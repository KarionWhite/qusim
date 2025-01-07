const qShadowTemplate = (name, x, y, height, width) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", "qshadow");
    g.setAttribute("class", "qshadow");
    g.setAttribute("transform", "translate(0, 0)");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", "gray");
    rect.setAttribute("fill-opacity", "0.5");
    rect.setAttribute("stroke", "black");
    rect.setAttribute("stroke-width", "1");

    g.appendChild(rect);
    return g;
};

const qInputTemplate = (id, name) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", id);
    g.setAttribute("class", "gate qinput");
    g.setAttribute("draggable", "true");

    // Rechteck
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("id", `${id}_rect`);
    rect.setAttribute("width", "60");
    rect.setAttribute("height", "60");
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", "black");
    rect.setAttribute("stroke-width", "1");

    // Text
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("id", `${id}_text`);
    text.setAttribute("x", "30");
    text.setAttribute("y", "35");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("alignment-baseline", "middle");
    text.setAttribute("font-size", "20");
    text.setAttribute("fill", "black");
    text.textContent = name;

    // Pfeil
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("id", `${id}_out`);
    polygon.setAttribute("points", "55,35 60,30 55,25");
    polygon.setAttribute("fill", "white");
    polygon.setAttribute("stroke", "black");
    polygon.setAttribute("stroke-width", "1");

    // Elemente anhängen
    g.appendChild(rect);
    g.appendChild(text);
    g.appendChild(polygon);

    return g;
};

let activeTool = "select";

const resetButtons = () => {
    const buttons = document.getElementsByClassName("tool_button");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }
};

const toolButtonClicked = (tool) => {
    activeTool = tool;
    resetButtons();
    document.getElementById("tool_" + tool).classList.add("active");
    return () => {
        console.log("Tool: " + tool);
    }
};

const keydownlistener = (event) => {
    if (event.key === "Escape") {
        document.getElementById("qshadow").remove();
        document.getElementById("tool_select").click();
    }
};

addEventListener("DOMContentLoaded", () => {
    const toolbox_grid = document.getElementById("toolbox_grid");
    let id_counter = 0;

    // Event_Listener für die Buttons
    const buttonIds = [
        "select", "wire", "qinput", "identity", "hadamard",
        "pauli_x", "pauli_y", "pauli_z", "cnot", "swap",
        "toffoli", "fredkin", "measure", "xgate"
    ];

    buttonIds.forEach(id => {
        document.getElementById(`tool_${id}`).addEventListener("click", () => toolButtonClicked(id));
    });

    // Keyboard-Event-Listener
    document.addEventListener("keydown", keydownlistener);

    toolbox_grid.addEventListener("mousedown", (event) => {
        // Koordinaten des Klicks berechnen
        const x = event.offsetX;
        const y = event.offsetY;

        // Neues QInput-Element erstellen
        const qInput = qInputTemplate("qinput_" + id_counter++, "QInput");
        qInput.setAttribute("transform", `translate(${x}, ${y})`);

        // Hinzufügen zum SVG
        toolbox_grid.appendChild(qInput);
    });
});