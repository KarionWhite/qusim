let changes = {}
let blocks = {}
let wires = {}
let wire_parts = {}
let wire_nodes = {}
let wire_drawing = false
let current_wire_part_id = null;
let id_counter = 1
let currently_dragging = null;
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
    g.setAttribute("class", `gate_${klasse}`);
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
    rect.addEventListener("mousedown", (event) => dragndrop(event, id));
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
    text.addEventListener("mousedown", (event) => dragndrop(event, id));
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
        //Unsichtbare Hitbox zum Klicken auf den Input
        const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hitbox.setAttribute("id", `${id}_input_hitbox_${i}`);
        hitbox.setAttribute("x", "-5");
        hitbox.setAttribute("y", 20 * i + in_out_offset - 5);
        hitbox.setAttribute("width", "10");
        hitbox.setAttribute("height", "10");
        hitbox.setAttribute("fill", "transparent");
        hitbox.addEventListener("mousedown", (event) => startWire(event, `${id}_input_${i}`));
        g.appendChild(hitbox);
 
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
        //Unsichtbare Hitbox zum Klicken auf den Output
        const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hitbox.setAttribute("id", `${id}_input_hitbox_${i}`);
        hitbox.setAttribute("x", width - 5);
        hitbox.setAttribute("y", 20 * i + in_out_offset - 5);
        hitbox.setAttribute("width", "10");
        hitbox.setAttribute("height", "10");
        hitbox.setAttribute("fill", "transparent");
        hitbox.addEventListener("mousedown", (event) => startWire(event,`${id}_output_${i}`));
        g.appendChild(hitbox);
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

// Wire Template für die Toolbox
const wireTemplate = (id, x1, y1, x2, y2) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", id);
    g.setAttribute("class", "wire");

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "black");
    line.setAttribute("stroke-width", "1");
    g.appendChild(line);

    return g;
};

//Wire Node Template für die Toolbox
const wireNodeTemplate = (id, x, y) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", id);
    g.setAttribute("class", "wire_node");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "5");
    circle.setAttribute("fill", "black");
    circle.setAttribute("stroke", "black");
    circle.setAttribute("stroke-width", "1");
    g.appendChild(circle);

    return g;
};

// Templates für die verschiedenen Gatter
const onersTemplaes = ["qinput", "identity", "hadamard", "pauli_x", "pauli_y", "pauli_z", "measure"];
const qinputTemplate = (id) => { return ntomTemplate(id, "Input", "qinput", 0, 1); }
const measureTemplate = (id) => { return ntomTemplate(id, "M", "measure", 1, 0); }
const identityTemplate = (id) => { return ntomTemplate(id, "Ident", "identity", 1, 1); }
const hadamardTemplate = (id) => { return ntomTemplate(id, "Hada", "hadamard", 1, 1); }
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
    if (document.getElementById("qshadow") !== null) {
        document.getElementById("qshadow").remove();
    }
    if (onersTemplaes.includes(tool)) {
        activeShadow = shadowoneTemplate("qshadow");
    } else if (tworsTemplates.includes(tool)) {
        activeShadow = shadowtwoTemplate("qshadow");
    } else if (threersTemplates.includes(tool)) {
        activeShadow = shadowthreeTemplate("qshadow");
    } else if (xgateTemplate === "xgate") {
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

function get_next_grid_point(x, y) {
    const raster = 20;
    const x_offset = -30;
    const y_offset = -35;
    return [x_offset + Math.round(x / raster) * raster, y_offset + Math.round(y / raster) * raster];
}

function get_element_position(element) {
    const transform = element.getAttribute("transform");
    if (!transform) {
      console.error(`Element ${element.id} hat kein transform Attribut!`);
      return [0, 0];
    }
    const x = parseInt(transform.split("(")[1].split(",")[0]) || 0;
    const y = parseInt(transform.split(",")[1].split(")")[0]) || 0;
    return [x, y];
  }

function get_template_rect_dimensions(element) {
    if (element.getAttribute("class").includes("gate")) {
      const rect = element.querySelector(`#${element.id}_rect`);
      const x = parseInt(rect.getAttribute("x")) || 0; 
      const y = parseInt(rect.getAttribute("y")) || 0; 
      const width = parseInt(rect.getAttribute("width"));
      const height = parseInt(rect.getAttribute("height"));
      return [x, y, width, height];
    }
  }

function get_element_with_position(x, y) {
    for (let key in blocks) {
        const element = document.getElementById(blocks[key].id);
        const [x1, y1] = get_element_position(element);
        const [x2, y2, width, height] = get_template_rect_dimensions(element);
        if (x >= x1 && x <= x1 + width && y >= y1 && y <= y1 + height) {
            return element;
        }
    }
    return null;
}

function get_nearest_raster_point(x, y) {
    const raster = 20;
    const x_offset = -30;
    const y_offset = -35;
    return [x_offset + Math.round(x / raster) * raster, y_offset + Math.round(y / raster) * raster];
}

addEventListener("DOMContentLoaded", () => {
    const toolbox_grid = document.getElementById("toolbox_grid");

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
        if (activeTool === "select") {
            if (currently_dragging !== null) {
                dragndrop(event, null);
            }
        } else if (activeTool === "wire") {
            console.log(get_nearest_raster_point(event.offsetX, event.offsetY));
        } else if (document.getElementById("qshadow") === null) {
            toolbox_grid.appendChild(activeShadow);
        } else {
            const x = event.offsetX;
            const y = event.offsetY;
            set_raster_element(activeShadow, x, y);
        }
    });

    toolbox_grid.addEventListener("mousedown", (event) => {
        console.log(event.button + " " + event.target.id + " " + (event.button === 0));
        const x = event.offsetX;
        const y = event.offsetY;
        if (event.button === 0) {
            if (activeTool === "select") {
                selecttool(x, y);
            }
            else if (activeTool === "wire") {
                wiringtool(x, y);
            }
            else {
                placeTemplate(x, y);
            }
        }
    });
});

function dragndrop(event, id) {
    //Wir bewegen das Element. Wir bekommen das aus dem mousemovement event. id ist null
    document.getElementById("tool_select").click();
    if (event.type === "mousemove") {
        const x = event.offsetX;
        const y = event.offsetY;
        set_raster_element(document.getElementById(currently_dragging), x, y);
    }
    //2. Click wir droppen das Element
    else if (event.type === "mousedown" && currently_dragging === id) {
        currently_dragging = null;
    }
    //1. Click wir heben das Element
    else if (event.type === "mousedown" && currently_dragging === null) {
        currently_dragging = id;
    }
}

function selecttool(x, y) {
    console.log("Select-Tool");
}


/**
 * Funktion zum Zeichnen von Wires
 * Idee: 
 * 1. Klick auf einen Input/Output
 * 2. Wir starten wires im waagerechten zu zeichnen
 * 3. Klick und wenn es nicht auf einen Input/Output ist, dann zeichnen wir im senkrechten
 * 4. Klick Wenn wir im senkrechten sind gehen wir zurück zum waagerechten
 * Am Ende steht wieder ein Input/Output
 * Daraus folgt, dass eine ungerade Anzahl uns in den senkrechten Modus bringt
 * Eine gerade Anzahl bringt uns in den waagerechten Modus
 * {wire_{eine id}:[
 *      {type: "{input}", id: "{Nummer des Blocks}", "port": {Nummer}, "x": "{x}", "y": "{y}"},
 *      {type: "{node}", id: "{Nummer des Nodes}", "port": 0, "x": "{x}", "y": "{y}"},
 *      {type: "{node}", id: "{Nummer des Nodes}", "port": 0, "x": "{x}", "y": "{y}"},
 *      {type: "{output}", id: "{Nummer des Blocks}", "port": {Nummer}, "x": "{x}", "y": "{y}"}
 *      ...
 *  ],
 * wire_{eine id}:[
 *      {type: "{output}", id: "{Nummer des Blocks}", "port": {Nummer}, "x": "{x}", "y": "{y}"},
 *      {type: "{output}", id: "{Nummer des Blocks}", "port": {Nummer}, "x": "{x}", "y": "{y}"}
 *  ]    
 * ...
 * 
 * }
 * Nodes haben immer nur den Port 0
 */

function startWire(event, id) {
    //linker Mausklick
    if(event.type === "mousedown" && event.button == 0 && current_wire_part_id === null){
        document.getElementById("tool_wire").click();
        current_wire_part_id = "wire" + id_counter++;
    }
    //Ein erneutes klicken auf den Input/Output beendet das zeichnen
    else if(event.type === "mousedown" && event.button == 0 && current_wire_part_id !== null){
        draw_wire(event);
        current_wire_part_id = null;
    }
    //Nun holen wir uns den Knoten Punkt
    [rx,ry] = get_next_grid_point(event.offsetX, event.offsetY);
    target_element = element.target.id;
    
};

function draw_wire(event){
    if(current_wire_part_id === null){
        return; //Wie sind wir hier gelandet?
    }else if(event.type === "mousemove"){
        length = wire_nodes.length-1;
        [last_id, last_x, last_y] = wire_nodes[length];
        if(length % 2 === 0){  //Wir sind im waagerechten Modus
            document.getElementById(current_wire_part_id).remove();
            let new_x = Math.round(event.offsetX/20)*20;
            let wire = wireTemplate(current_wire_part_id, last_x, last_y, new_x, last_y);
            set_raster_element(wire, last_x, last_y);
            toolbox_grid.appendChild(wire);
        }else{  //Wir sind im senkrechten Modus
            document.getElementById(current_wire_part_id).remove();
            let new_y = Math.round(event.offsetY/20)*20;
            let wire = wireTemplate(current_wire_part_id, last_x, last_y, last_x, new_y);
            set_raster_element(wire, last_x, last_y);
            toolbox_grid.appendChild(wire);
        }
    }else if(event.type === "mousedown"){
        last_wire = document.getElementById(current_wire_part_id); //dieses Wire ist fertig
        wires[current_wire_part_id] = last_wire.outerHTML;
        //TODO

    }
}



function wiringtool() {
    console.log("Wire-Tool");
}

function placeTemplate(x, y) {
    // Neues QInput-Element erstellen
    const chosenTemplate = eval(`${activeTool}Template`)(`${activeTool}_${id_counter++}`);
    set_raster_element(chosenTemplate, x, y);

    // Hinzufügen zum SVG
    toolbox_grid.appendChild(chosenTemplate);

    blocks[Date.now()] = {
        id: chosenTemplate.id,
        x: rx,
        y: ry
    };
}