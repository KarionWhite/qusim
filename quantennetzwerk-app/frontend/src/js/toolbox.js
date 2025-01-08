/**
 * Ein allgemeines Gatter-Template für die Toolbox
 * du kannst die Menge der Inputs und Outputs angeben und diese werden automatisch generiert
 * @param {string} id 
 * @param {string} name 
 * @param {string} klasse 
 * @param {number} inputs 
 * @param {number} outputs 
 * @returns {SVGElement}
 */
const ntomTemplate = (id, name, klasse, inputs, outputs) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", id);
    g.setAttribute("class", `gate ${klasse}`);
    g.setAttribute("draggable", "true");    //Funktioniert nicht ?! Wir werden es wohl mit JS machen müssen =(

    //Wir wollen die Größe des Gatters berechnen
    const height = 60 + 20 * Math.max(inputs, outputs); //60 ist die Höhe des Rechtecks, 20 ist der Abstand zwischen den Inputs/Outputs
    const width = 60; //Die Breite des Rechtecks
    const in_out_offset = 45;

    // Rechteck
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("id", `${id}_rect`);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height + 10); // +10 weil es besser aussieht
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", "black");
    rect.setAttribute("stroke-width", "1");
    g.appendChild(rect);

    // Text
    //Wir müssen den die höhe des Textes berechnen
    const heightText = 20
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("id", `${id}_text`);
    text.setAttribute("x", width / 2);
    text.setAttribute("y", heightText);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("alignment-baseline", "middle");
    text.setAttribute("font-size", "20");
    text.setAttribute("fill", "black");
    text.textContent = name;
    g.appendChild(text);

    // Inputs grüne Kreise
    for (let i = 0; i < inputs; i++) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("id", `${id}_input_${i}`);
        circle.setAttribute("cx", "0");
        circle.setAttribute("cy", 20 * i + in_out_offset);
        circle.setAttribute("r", "5");
        circle.setAttribute("fill", "green");
        circle.setAttribute("stroke", "black");
        circle.setAttribute("stroke-width", "1");
        g.appendChild(circle);
    }

    // Outputs
    for (let i = 0; i < outputs; i++) {
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("id", `${id}_output_${i}`);
        polygon.setAttribute("points", `${width - 5},${20 * i + in_out_offset + 5} ${width},${20 * i + in_out_offset} ${width - 5},${20 * i + in_out_offset - 5}`);
        polygon.setAttribute("fill", "white");
        polygon.setAttribute("stroke", "black");
        polygon.setAttribute("stroke-width", "1");
        g.appendChild(polygon);
    }
    return g;
};

/**
 * Erstellt ein neues Schatten-Element für die Toolbox
 * @param {string} id ID des Elements
 * @param {number} inputs Anzahl der Inputs
 * @param {number} outputs Anzahl der Outputs
 * @returns {SVGElement}
 */
const schattenTemplate = (id, inputs, outputs) => {
    // Wir wollen die Größe des Gatters berechnen
    const height = 60 + 20 * Math.max(inputs, outputs); //60 ist die Höhe des Rechtecks, 20 ist der Abstand zwischen den Inputs/Outputs
    const width = 60; //Die Breite des Rechtecks

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", id);
    g.setAttribute("class", "schatten");

    // Rechteck
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("id", `${id}_rect`);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height + 10); // +10 weil es besser aussieht
    rect.setAttribute("fill", "gray");
    rect.setAttribute("fill-opacity", "0.5");
    rect.setAttribute("stroke", "black");
    rect.setAttribute("stroke-width", "1");
    g.appendChild(rect);

    return g;
};

const onersTemplaes = ["qinput","identity", "hadamard", "pauli_x", "pauli_y", "pauli_z", "measure"];
const qinputTemplate = (id) => { return ntomTemplate(id, "Input", "qinput", 0, 1); }
const measureTemplate = (id) => { return ntomTemplate(id, "M", "measure", 1, 0); }
const identityTemplate = (id) => { return ntomTemplate(id, "Identity", "identity", 1, 1); }
const hadamardTemplate = (id) => { return ntomTemplate(id, "Hadamard", "hadamard", 1, 1); }
const pauli_xTemplate = (id) => { return ntomTemplate(id, "Pauli X", "pauli_x", 1, 1); }
const pauli_yTemplate = (id) => { return ntomTemplate(id, "Pauli Y", "pauli_y", 1, 1); }
const pauli_zTemplate = (id) => { return ntomTemplate(id, "Pauli Z", "pauli_z", 1, 1); }
const shadowoneTemplate = (id) => { return schattenTemplate(id, 1, 1); }

const tworsTemplates = ["cnot", "swap"];
const cnotTemplate = (id) => { return ntomTemplate(id, "CNOT", "cnot", 2, 2); }
const swapTemplate = (id) => { return ntomTemplate(id, "SWAP", "swap", 2, 2); }
const shadowtwoTemplate = (id) => { return schattenTemplate(id, 2, 2); }

const threersTemplates = ["toffoli", "fredkin"];
const toffoliTemplate = (id) => { return ntomTemplate(id, "TOFF", "toffoli", 3, 3); }
const fredkinTemplate = (id) => { return ntomTemplate(id, "FRED", "fredkin", 3, 3); }
const shadowthreeTemplate = (id) => { return schattenTemplate(id, 3, 3); }
//Derzeitig nicht implementiert in Qengine
const xgateTemplate = (id, name, klasse, x, y) => { return ntomTemplate(id, name, klasse, x, y); }
const shadowXgateTemplate = (id, x, y) => { return schattenTemplate(id, x, y); }

let activeTool = "select";
let activeShadow = null;

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
    activeShadow = null;
    if(document.getElementById("qshadow") !== null) {
        document.getElementById("qshadow").remove();
    }
    if(onersTemplaes.includes(tool)) {
        activeShadow = shadowoneTemplate("qshadow");
    } else if(tworsTemplates.includes(tool)) {
        activeShadow = shadowtwoTemplate("qshadow");
    } else if(threersTemplates.includes(tool)) {
        activeShadow = shadowthreeTemplate("qshadow");
    } else if(xgateTemplate === "xgate") {
        activeShadow = shadowXgateTemplate("qshadow", 1, 1);
    }
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

function set_raster_element(element, x, y) {
    const raster = 20;
    const x_offset = -30;
    const y_offset = -35;
    element.setAttribute("transform", `translate(${x_offset + Math.round(x / raster) * raster},${y_offset + Math.round(y / raster) * raster})`);
}

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

    // Event-Listener für das Toolbox-Grid
    //Wir wollen den Schatten so zeichenen, sodass eine vorschau des Gatters gezeigt wird
    toolbox_grid.addEventListener("mousemove", (event) => {
        if (activeTool === "select" || activeTool === "wire") return;
        if (document.getElementById("qshadow") === null) {
            toolbox_grid.appendChild(activeShadow);
        }

        const x = event.offsetX;
        const y = event.offsetY;
        set_raster_element(activeShadow, x, y);
    });

    toolbox_grid.addEventListener("mousedown", (event) => {
        console.log(event.button + " " + event.target.id + " " + (event.button === 0));
        if(event.button === 0) {
            if(activeTool === "select" || activeTool === "wire") return;
            // Koordinaten des Klicks berechnen
            const x = event.offsetX;
            const y = event.offsetY;

            // Neues QInput-Element erstellen
            const chosenTemplate = eval(`${activeTool}Template`)();
            set_raster_element(chosenTemplate, x, y);

            // Hinzufügen zum SVG
            toolbox_grid.appendChild(chosenTemplate);
        }
    });
});