import { go_post } from "/js/go_com.mjs"

let changes = {}
let blocks = {}
let wires = {}
let wire_nodes = {}
let wire_drawing = false
let current_wire_id = null;
let id_counter = 1
let currently_dragging = null;
let activeTool = "select";
let activeShadow = null;

const buttonIds = [
    "select", "wire", "qinput", "identity", "hadamard",
    "pauli_x", "pauli_y", "pauli_z", "cnot", "swap",
    "toffoli", "fredkin", "measure", "xgate"
];
const task_has_changed = {
    "task": "has_changed",
    "data": {
        "HasChanged": true
    }
}

function has_changed() {
    let k = go_post(task_has_changed);  // Sendet an den Server, dass sich etwas geändert hat
    console.log(k);
}
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
        hitbox.addEventListener("mousedown", (event) => startWire(event, `${id}_output_${i}`));
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
        if(buttonIds.slice(2).includes(activeTool)){
            document.getElementById("qshadow").remove();
            document.getElementById("tool_select").click();
        }
        if(currently_dragging !== null){
            document.getElementById("tool_select").click();
        }
        if(current_wire_id !== null){
            escape_Wire(event);
        }
    }
    if (event.key === "Delete") {
        if (currently_dragging !== null) {
            deleteTemplate(currently_dragging);
        }
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
    const x_offset = 10;
    const y_offset = -10;
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
        let x = parseInt(element.getAttribute("transform").split("(")[1].split(",")[0]) || 0;
        let y = parseInt(element.getAttribute("transform").split(",")[1].split(")")[0]) || 0;
        const rect = element.querySelector(`#${element.id}_rect`);
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
            draw_wire(event);
        } else if (document.getElementById("qshadow") === null) {
            toolbox_grid.appendChild(activeShadow);
        } else {
            const x = event.offsetX;
            const y = event.offsetY;
            set_raster_element(activeShadow, x, y);
        }
        mouse_debug(event);
    });

    toolbox_grid.addEventListener("mousedown", (event) => {
        console.log(event.button + " " + event.target.id + " " + (event.button === 0));
        const x = event.offsetX;
        const y = event.offsetY;
        if (event.button === 0) {
            if (activeTool === "select") {
                selecttool(x, y);
            }
            else if (activeTool === "wire" && wire_drawing) {
                draw_wire(event);
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
        //updating blocks
        let [x, y] = get_element_position(document.getElementById(currently_dragging));
        blocks[currently_dragging] = {
            block: currently_dragging,
            x: x,
            y: y
        };
        currently_dragging = null;
        has_changed();
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
 *      {type: "{input}", id: "{Nummer des Blocks}", "port": {Nummer}, "x": "{x}", "y": "{y}"},
 *      {type: "{output}", id: "{Nummer des Blocks}", "port": {Nummer}, "x": "{x}", "y": "{y}"}
 *  ]    
 * ...
 * 
 * }
 * Nodes haben immer nur den Port 0
 */
const wire_mouse_offset_x = 0;
const wire_mouse_offset_y = 10;

function startWire(event, id) {
    //linker Mausklick
    let my_wire_id = null;
    if (event.type === "mousedown" && event.button == 0 && current_wire_id === null) {
        document.getElementById("tool_wire").click();
        current_wire_id = "wire_" + id_counter++;
        my_wire_id = current_wire_id;
        wire_nodes[current_wire_id] = [];
        wire_drawing = true;
    }
    //Ein erneutes klicken auf den Input/Output beendet das zeichnen
    else if (event.type === "mousedown" && event.button == 0 && current_wire_id !== null) {
        my_wire_id = current_wire_id;
        current_wire_id = null;
        wire_drawing = false;
        has_changed();  // Wir haben eine Verbindung erstellt
    }
    //Nun holen wir uns den Knoten Punkt
    [rx, ry] = get_next_grid_point(event.offsetX + wire_mouse_offset_x, event.offsetY + wire_mouse_offset_y);
    target_element = event.target.id;
    //target input oder output?
    if (target_element.includes("input")) {
        wire_nodes[my_wire_id].push({ type: "input", id: target_element.split("_")[0], port: target_element.split("_")[2], x: rx, y: ry });
    }
    else if (target_element.includes("output")) {
        wire_nodes[my_wire_id].push({ type: "output", id: target_element.split("_")[0], port: target_element.split("_")[2], x: rx, y: ry });
    }
    else {
        //Sollte nicht passieren
        wire_nodes[my_wire_id].push({ type: "node", id: current_wire_part_id, port: 0, x: rx, y: ry });
        console.log("Error: Wire-Node at" + rx + " " + ry);
        console.log(my_wire_id);
        console.log("Ausirgend einem Grund ist ein Node entstanden, obwohl wir auf keinen Input/Output geklickt haben");
    }
    console.log(wire_nodes);
    event.stopPropagation();
    event.preventDefault();
};

function draw_wire(event) {
    if (current_wire_id === null) {
        return; //Wie sind wir hier gelandet?
    } else if (event.type === "mousemove") {
        length = wire_nodes[current_wire_id].length - 1;
        last_x = wire_nodes[current_wire_id][length].x;
        last_y = wire_nodes[current_wire_id][length].y;
        wire_exists = document.getElementById(current_wire_id);
        if (wire_exists !== null) {
            wire_exists.remove();
        }
        [mx, my] = get_next_grid_point(event.offsetX + wire_mouse_offset_x, event.offsetY + wire_mouse_offset_y);
        if (length % 2 === 0) {  //Wir sind im waagerechten Modus
            let new_x = mx;
            let wire = wireTemplate(current_wire_id, last_x, last_y, new_x, last_y);
            toolbox_grid.appendChild(wire);
        } else {  //Wir sind im senkrechten Modus
            let new_y = my;
            let wire = wireTemplate(current_wire_id, last_x, last_y, last_x, new_y);
            toolbox_grid.appendChild(wire);
        }
    } else if (event.type === "mousedown" && event.button == 0 && wire_nodes[current_wire_id].length > 0) {
        offsetX = event.offsetX;
        offsetY = event.offsetY;

        [x,y] = get_next_grid_point(offsetX, offsetY);
        console.log("wiring mousedown event " + x + " " + y);
        if(wire_nodes[current_wire_id].length % 2 === 1){ //Wir beenden den waagerechten Modus.
            current_y = wire_nodes[current_wire_id][wire_nodes[current_wire_id].length - 1].y;
            current_x = x  
        }else{ //Wir sind im senkrechten Modus
            current_x = wire_nodes[current_wire_id][wire_nodes[current_wire_id].length - 1].x;
            current_y = y;
        }
        wire_nodes[current_wire_id].push({ type: "node", id: `node_${id_counter++}`, port: 0, x: current_x, y: current_y });
        //male fertigen Wire
        node_one = wire_nodes[current_wire_id][wire_nodes[current_wire_id].length - 2];
        node_two = wire_nodes[current_wire_id][wire_nodes[current_wire_id].length - 1];
        wire_id = `wired_${id_counter++}`;
        wire = wireTemplate(wire_id, node_one.x, node_one.y, node_two.x, node_two.y);
        //Wir brauchen noch die Verbindung Node zu Wire. Das ist wichtig für das Löschen
        wire_nodes[current_wire_id].push({ type: "output", id: wire_id, node_one:node_one.id, node_two:node_two.id});
        toolbox_grid.appendChild(wire);
        //append Wire to wires
    if(Array.isArray(wires[current_wire_id])){
        wires[current_wire_id].push(wire_id);
    }else{
        wires[current_wire_id] = [wire_id];
    }

        //lösche alten Wire
        document.getElementById(current_wire_id).remove();
    }
}

function escape_Wire(event) {
    wire_drawing = false;
    delete_wire_part(current_wire_id);
    delete_wire(current_wire_id);
    current_wire_id = null;
}

function delete_wire_part(wire_id) {
    wire = document.getElementById(wire_id);
    wire.remove();
    delete wire_nodes[wire_id];
}

function delete_wire(wire_id) {
    // Überprüfen, ob wires[wire_id] existiert und ein Array ist
    if (Array.isArray(wires[wire_id])) { 
      // Iteriere über die Wire-IDs im Array
      wires[wire_id].forEach(wireId => {
        let wire = document.getElementById(wireId);
        if (wire !== null) {
          wire.remove();
        }
      });
    }
  
    delete wires[wire_id];
    delete wire_nodes[wire_id];
  }

function wiringtool() {
    console.log("Wire-Tool");
}

function placeTemplate(x, y) {
    // Neues QInput-Element erstellen
    const box_id = `${activeTool}_${id_counter++}`;
    const chosenTemplate = eval(`${activeTool}Template`)(`${box_id}`);
    set_raster_element(chosenTemplate, x, y);

    // Hinzufügen zum SVG
    toolbox_grid.appendChild(chosenTemplate);
    let [rx, ry, width, height] = get_template_rect_dimensions(chosenTemplate);
    blocks[box_id] = {
        block: activeTool,
        x: rx,
        y: ry
    };
    has_changed();
}

function searchBlocksTemplate(id) {
    const entries = Object.entries(blocks);
    for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        if (key.includes(id)) {
            result = value;
            break; // Schleife vorzeitig abbrechen
        }
    }
}

/**
 * Sucht nach Drahtverbindungen, die mit der angegebenen ID übereinstimmen.
 *
 * Diese Funktion durchsucht das `wires`-Objekt und sammelt alle Draht-IDs,
 * deren Typ "input" ist und deren ID mit der angegebenen ID übereinstimmt.
 *
 * @param {string} id - Die Block-ID, nach der gesucht werden soll.
 * @returns {Array} - Ein Array von Draht-IDs, die mit der Block-ID übereinstimmen.
 */
function searchWireConnection(block_id) {
    let node_ids = [];
    const entries = Object.entries(wire_nodes);
    for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        input_node = value[0];
        output_node = value[value.length - 1];
        if (input_node.id === block_id || output_node.id === block_id) {
            node_ids.push(key);
        }
    }
    return node_ids;
}

function deleteTemplate(id) {
    //Wir bekommen die bereinigte ID also eine Nummer
    let element_id = searchBlocksTemplate(id);
    if (id.includes("_") && buttonIds.some(str => id.includes(str))) {
        //kann passieren, soll aber auch nicht ein Problem sein
        element_id = id;
        id = element_id.split("_")[1];
    }else if (element_id === undefined) {
        console.log("Element ist nicht in blocks");
        return;
    }else if (element_id === null) {
        console.log("Element nicht gefunden");
        return;
    }
    //Lösche das Element aus blocks
    delete blocks[element_id];

    //Lösche das Element aus dem SVG
    document.getElementById(element_id).remove();
    delete blocks[id];

    //Lösche die Verbindungen
    wire_ids = searchWireConnection(element_id);
    wire_ids.forEach(wire_id => {
        delete_wire(wire_id);
    });
    has_changed();
}

const mouse_debug_window_template = (x,y) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", "mouse_debug_window");
    g.setAttribute("class", "mouse_debug_window");
    x = x + 10;
    y = y + 10;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", "100");
    rect.setAttribute("height", "100");
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", "black");
    rect.setAttribute("stroke-width", "1");
    g.appendChild(rect);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x + 50);
    text.setAttribute("y", y + 50);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("alignment-baseline", "middle");
    text.setAttribute("font-size", "20");
    text.setAttribute("fill", "black");
    let [rx, ry] = get_next_grid_point(x, y);
    text.textContent = `${rx} ${ry}`;
    g.appendChild(text);

    return g;
}



function mouse_debug(event){
    if(document.getElementById("mouse_debug_window") !== null){
        document.getElementById("mouse_debug_window").remove();
    }
    toolbox_grid.appendChild(mouse_debug_window_template(event.offsetX, event.offsetY));
}

// Getter Funktionen für blocks und wire_nodes für weitere Funktionalitäten

/**
 * Bekomme eine Kopie der im Arbeitsbereich erstellten Blockobjekte 
 * @returns {blocks: {}} -> {blocks: 1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ, wire_nodes:[]}
 */
function getBlocks() {
    const copy_Blocks = JSON.parse(JSON.stringify(blocks)); // Kopie des Blocks-Objekts und speicher es in einem neuen Objekt, damit wir nicht auf den gleichen Speicher verweisen können
    return copy_Blocks;
}

/**
 * Bekomme eine Kopie der wire_nodes-Objekte des Arbeitsbereichs. Diese Objekt wird verwendet, um die Verbindungen zu speichern und das SVG darauf aufzubauen.
 * @returns {wire_nodes:[]} -> [{x1:0}, {}, ...]
 */
function getWireNodes() {
    const copy_wires = JSON.parse(JSON.stringify(wire_nodes)); // Kopie des Wire-Objekts und speicher es in einem neuen Objekt, damit wir nicht auf den gleichen Speicher verweisen können
    return copy_wires;
}

// Exportiere Getter Funktionen
export { getBlocks, getWireNodes };

//Zwischenlager
/**
 * @module circuit_area
 * @description This module contains the class CircuitArea, which is responsible for the circuit area.
 *  This means the background grid and the calculation of the grid coordinates for placing the wires and gates
 *  depending on the grid size and offset. This class also contains the event listeners for the circuit area.
 * @requires toolState
 */

import { toolState } from "./toolState.mjs";

class CircuitArea {
    singleCircuitArea = null;
    gridSpacing = 20; // Abstand zwischen den Grid-Punkten
    xOffset = 10;     // X-Offset des Grids
    yOffset = 10;     // Y-Offset des Grids

    scroll_margin_create = 500; // Abstand zum Rand, ab dem ein neues Grid-Element erstellt wird (in Pixel) -  Wird jetzt nicht direkt verwendet, aber gut für spätere Erweiterungen
    scroll_margin = 100;       // Abstand zum Rand, ab dem das Grid verschoben wird (in Pixel) - Wird jetzt nicht direkt verwendet
    scroll_tollerance = 10;     // Tolleranz, ab der das Grid verschoben wird (in Pixel) - Wird jetzt nicht direkt verwendet
    scroll_speed = 10;         // Geschwindigkeit, mit der das Grid verschoben wird (in Pixel) - Wird jetzt nicht direkt verwendet

    constructor() {
        if (this.singleCircuitArea) {
            return CircuitArea.singleCircuitArea;
        }
        this.circuitAreaElement = document.getElementById('circuit-area');
        this.svgGrid = this.createGrid();
        this.gridRect = this.svgGrid.querySelector('rect'); // Referenz auf das rect Element
        this.circuitAreaElement.appendChild(this.svgGrid);

        this.circuitAreaElement.style.position = 'relative'; // Stelle sicher, dass der Container relativ positioniert ist
        this.circuitAreaElement.style.overflow = 'auto';     // Aktiviere Scrollen im Container
        this.svgGrid.style.position = 'absolute';            // Absolut positionieren innerhalb des Containers
        this.svgGrid.style.top = '0';
        this.svgGrid.style.left = '0';
        this.svgGrid.style.zIndex = '-1'; // Hinter anderen Elementen

        this.adjustGrid(); // Initiales Zeichnen
        this.circuitAreaElement.addEventListener("scroll", this.adjustGrid.bind(this)); // Scroll-Event

        // ResizeObserver für Änderungen an der Containergröße
        const resizeObserver = new ResizeObserver(entries => {
            this.adjustGrid();
        });
        resizeObserver.observe(this.circuitAreaElement);

        CircuitArea.singleCircuitArea = this;
    }

    createGrid() {
        const toolbox_grid = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        toolbox_grid.setAttribute("id", "toolbox_grid");
        toolbox_grid.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        toolbox_grid.setAttribute("width", "100%"); // Temporär 100%, wird in adjustGrid angepasst
        toolbox_grid.setAttribute("height", "100%"); // Temporär 100%, wird in adjustGrid angepasst


        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const gridPattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        gridPattern.setAttribute("id", "cross-pattern");
        gridPattern.setAttribute("width", this.gridSpacing);
        gridPattern.setAttribute("height", this.gridSpacing);
        gridPattern.setAttribute("patternUnits", "userSpaceOnUse");

        const gridPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        gridPath.setAttribute("d", `M ${this.gridSpacing / 2} 0 L ${this.gridSpacing / 2} ${this.gridSpacing} M 0 ${this.gridSpacing / 2} L ${this.gridSpacing} ${this.gridSpacing / 2}`); // Zentriertes Kreuz
        gridPath.setAttribute("stroke", "gray");
        gridPath.setAttribute("stroke-width", "1");
        gridPattern.appendChild(gridPath);

        defs.appendChild(gridPattern);
        toolbox_grid.appendChild(defs);

        const gridRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        // gridRect.setAttribute("width", "100%");  // Wird in adjustGrid angepasst
        // gridRect.setAttribute("height", "100%"); // Wird in adjustGrid angepasst
        gridRect.setAttribute("fill", "url(#cross-pattern)");
        toolbox_grid.appendChild(gridRect);

        return toolbox_grid;
    }

    adjustGrid() {
        const visibleWidth = this.circuitAreaElement.clientWidth;
        const visibleHeight = this.circuitAreaElement.clientHeight;
        const scrollLeft = this.circuitAreaElement.scrollLeft;
        const scrollTop = this.circuitAreaElement.scrollTop;
    
        const bufferX = this.gridSpacing;
        const bufferY = this.gridSpacing;
    
        const rectWidth = visibleWidth + 2 * bufferX;
        const rectHeight = visibleHeight + 2 * bufferY;
        const rectX = scrollLeft - bufferX;
        const rectY = scrollTop - bufferY;
    
        this.gridRect.setAttribute("width", rectWidth + "px");
        this.gridRect.setAttribute("height", rectHeight + "px");
        this.gridRect.setAttribute("x", rectX + "px");
        this.gridRect.setAttribute("y", rectY + "px");
    }



    getNextGridPoint(x, y) {
        const scrollLeft = this.circuitAreaElement.scrollLeft;
        const scrollTop = this.circuitAreaElement.scrollTop;

        const gridX = Math.round((x - this.xOffset) / this.gridSpacing) * this.gridSpacing + this.xOffset;
        const gridY = Math.round((y - this.yOffset) / this.gridSpacing) * this.gridSpacing + this.yOffset;
        return [gridX, gridY];
    }

    static getInstanz() {
        if (this.singleCircuitArea) {
            return CircuitArea.singleCircuitArea;
        }
        return new CircuitArea();
    }
}

const circuitArea = CircuitArea.getInstanz();

export { circuitArea };