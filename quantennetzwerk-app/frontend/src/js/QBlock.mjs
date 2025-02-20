import  globalEvents from "./EventEmitter.mjs";

class QBlock {

    /**
     * Erstelle einen Schattenblock, der als Vorschau für das Ziehen von Blöcken verwendet wird bevor ein Block existiert.
     * Prüfe vor der Nutzung, ob ein Shadowblock bereits existiert und lösche ihn gegebenenfalls.
     * @param {string} kind 
     * @returns {SVGElement}
     */
    static createShadowBlock(kind) {
        const shadowBlock = document.getElementById("shadowBlock");
        if (shadowBlock) {
            shadowBlock.remove();
        }
        const shadowBlockElement = QBlock[kind + "Template"]("shadowBlock", true);
        shadowBlockElement.setAttribute("id", "shadowBlock");
        shadowBlockElement.setAttribute("class", "shadowBlock");
        shadowBlockElement.setAttribute("draggable", "true");
        return shadowBlockElement;
    }

    static __nextId = 0;

    static getNextId() {
        return QBlock.__nextId++;
    }

    static blocks = {};   //{id: block, ...} -> block = {id: id, template: template, x, y, inputWireIds: [], outputWireIds: []}
    static qblocks = ["qinput", "measure", "identity", "hadamard", 
        "pauli_x", "pauli_y", "pauli_z", "cnot", "swap", "toffoli", "fredkin"];

    static qinputTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "Input", "qinput", 0, 1,shadow); }
    static measureTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "M", "measure", 1, 0,shadow); }
    static identityTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "Ident", "identity", 1, 1,shadow); }
    static hadamardTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "Hada", "hadamard", 1, 1,shadow); }
    static pauli_xTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "Pauli X", "pauli_x", 1, 1,shadow); }
    static pauli_yTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "Pauli Y", "pauli_y", 1, 1,shadow); }
    static pauli_zTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "Pauli Z", "pauli_z", 1, 1,shadow); }
    static cnotTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "CNOT", "cnot", 2, 2,shadow); }
    static swapTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "SWAP", "swap", 2, 2,shadow); }
    static toffoliTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "TOFF", "toffoli", 3, 3,shadow); }
    static fredkinTemplate = (id,shadow=false) => { return QBlock.__ntomTemplate(id, "FRED", "fredkin", 3, 3,shadow); }
    //Derzeitig nicht implementiert in Qengine
    static xgateTemplate = (id, name, klasse, x, y,shadow=false) => { return QBlock.__ntomTemplate(id, name, klasse, x, y,shadow); }

    /**
     * Ein allgemeines Gatter-Template für die Toolbox
     * du kannst die Menge der Inputs und Outputs angeben und diese werden automatisch generiert
     * @param {number} id
     * @param {string} gatename
     * @param {string} klasse
     * @param {number} inputs
     * @param {number} outputs
     * @returns {SVGElement}
     */
    static __ntomTemplate(id, gatename, klasse, inputs, outputs,shadow=false) {
        const divg = document.createElement("div");
        divg.setAttribute("id", `klasse_${id}`);
        divg.setAttribute("class", `gate_${klasse}`);
        divg.setAttribute("draggable", "true");   //Funktioniert nicht ?! Wir werden es wohl mit JS machen müssen =(
        const g = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        g.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        g.setAttribute("id", `svg_${id}`);


        //Wir wollen die Größe des Gatters berechnen
        const height = 60 + 20 * Math.max(inputs, outputs); //60 ist die Höhe des Rechtecks, 20 ist der Abstand zwischen den Inputs/Outputs
        const width = 60; //Die Breite des Rechtecks
        const in_out_offset = 45;

        g.setAttribute("width", width + 30); // +20 weil es besser aussieht
        g.setAttribute("height", height + 40);


        const has_startDrag = globalEvents.hasListeners("startDrag") && !shadow; 
        const has_placeBlock = globalEvents.hasListeners("placeBlock") && shadow;
        const has_startWire = globalEvents.hasListeners("startWire") && !shadow;
        //Warnungen, wenn keine Listener vorhanden sind, wenn sie benötigt werden
        if(!has_startDrag && !shadow) console.warn("No listener for 'startDrag' event.");
        if(!has_placeBlock && shadow) console.warn("No listener for 'placeBlock' event.");
        if(!has_startWire && !shadow) console.warn("No listener for 'startWire' event.");

        let rectOffsetX = 10;
        let rectOffsetY = 10;

        // Rechteck
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("id", `${id}_rect`);
        rect.setAttribute("x", rectOffsetX);
        rect.setAttribute("y", rectOffsetY);
        rect.setAttribute("width", width);
        rect.setAttribute("height", height + 10); // +10 weil es besser aussieht
        rect.setAttribute("fill", "white");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "1");
        if(has_startDrag){
            rect.addEventListener("mousedown", (event) => {
                globalEvents.emit("startDrag", event, id);
            });
        }
        if(has_placeBlock){
            rect.addEventListener("mousedown", (event) => {
                globalEvents.emit("placeBlock", event, id);
            });
        }
        g.appendChild(rect);

        // Text
        //Wir müssen den die höhe des Textes berechnen
        const heightText = 20
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("id", `${id}_text`);
        text.setAttribute("x", width / 2 + 10);
        text.setAttribute("y", heightText + 10);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("alignment-baseline", "middle");
        text.setAttribute("font-size", "20");
        text.setAttribute("fill", "black");
        text.textContent = gatename;
        if(has_startDrag){
            text.addEventListener("mousedown", (event) => {
                globalEvents.emit("startDrag", event, id);
            });
        }
        if(has_placeBlock){
            text.addEventListener("mousedown", (event) => {
                globalEvents.emit("placeBlock", event, id);
            });
        }
        g.appendChild(text);
        divg.appendChild(g);
        //Wenn es sich um einen Schattenblock handelt, dann sollen keine Inputs und Outputs angezeigt werden
        if(shadow){
            return divg;
        }
        // Highlight Box
        const highlight = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        highlight.setAttribute("id", `highlight_${id}`);
        highlight.setAttribute("x", "0");
        highlight.setAttribute("y", "0");
        highlight.setAttribute("width", width+20);
        highlight.setAttribute("height", height+30);
        console.log(width+20);
        console.log(height+30)
        highlight.setAttribute("fill", "transparent");
        highlight.setAttribute("stroke", "blue");
        highlight.setAttribute("stroke-width", "2");
        highlight.setAttribute("visibility", "hidden");
        if(has_startDrag){
            highlight.addEventListener("mousedown", (event) => {
                globalEvents.emit("startDrag", event, id);
            });
        }
        g.appendChild(highlight);

        // Inputs rote Kreise, weil noch keine Verbindung besteht
        for (let i = 0; i < inputs; i++) {
            const inputID = `input_${id}_${i}`;
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("id", inputID);
            circle.setAttribute("cx", "10");
            circle.setAttribute("cy", 20 * i + in_out_offset + 10);
            circle.setAttribute("r", "5");
            circle.setAttribute("fill", "red");
            circle.setAttribute("stroke", "black");
            circle.setAttribute("stroke-width", "1");
            g.appendChild(circle);
            //Unsichtbare Hitbox zum Klicken auf den Input
            const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            hitbox.setAttribute("id", inputID + "_hitbox");
            hitbox.setAttribute("x", "0");
            hitbox.setAttribute("y", 20 * i + in_out_offset);
            hitbox.setAttribute("width", "20");
            hitbox.setAttribute("height", "20");
            hitbox.setAttribute("fill", "transparent");
            if(has_startWire){
                hitbox.addEventListener("mousedown", (event) => {
                    globalEvents.emit("startWire", event, inputID)
                });
            }
            g.appendChild(hitbox);

        }

        // Outputs rote Dreiecke, weil noch keine Verbindung besteht
        for (let i = 0; i < outputs; i++) {
            const outputID = `output_${id}_${i}`;
            const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            polygon.setAttribute("id", outputID);
            polygon.setAttribute("points", `${width},${20 * i + in_out_offset + 5} ${width+10},${20 * i + in_out_offset + 10} ${width},${20 * i + in_out_offset + 15}`);
            polygon.setAttribute("fill", "red");
            polygon.setAttribute("stroke", "black");
            polygon.setAttribute("stroke-width", "1");
            g.appendChild(polygon);
            //Unsichtbare Hitbox zum Klicken auf den Output
            const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            hitbox.setAttribute("id", outputID + "_hitbox"); // Korrigierte ID
            hitbox.setAttribute("x", width);
            hitbox.setAttribute("y", 20 * i + in_out_offset);
            hitbox.setAttribute("width", "20");
            hitbox.setAttribute("height", "20");
            hitbox.setAttribute("fill", "transparent");
            if(has_startWire){
                hitbox.addEventListener("mousedown", (event) => {
                    globalEvents.emit("startWire", event, outputID)
                });
            }
            g.appendChild(hitbox);
        }

        return divg;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {null | String} null wenn kein Block getroffen wurde, sonst die ID des getroffenen Ports
     */
    static hitInputOutput(x,y){
        for (let BlockID in QBlock.blocks) {
            const block = QBlock.blocks[BlockID];
            const hit = block.checkInputOutput(x,y);
            if(hit) return hit;
        }
        return null;
    }

    /**
     * 
     * @param {SVGElement || QBlock} collBlock 
     * @returns 
     */
    static checkCollision(collBlock){
        //Wir prüfen 9 Punkte auf Kollision
        let dimensions = {x:0,y:0,width:0,height:0};
        if(collBlock instanceof QBlock){
            dimensions = collBlock.getDimensions();
        }
        else if(collBlock.getAttribute("id") === "shadowBlock"){
            collBlock.getAttribute("style").split(";").forEach((style) => {
                if(style.includes("translate")){
                    const [x,y] = style.match(/-?\d+/g);
                    dimensions.x = parseInt(x);
                    dimensions.y = parseInt(y);
                }
            });
            collBlock.querySelectorAll("rect").forEach((rect) => {
                dimensions.width = parseInt(rect.getAttribute("width"));
                dimensions.height = parseInt(rect.getAttribute("height"));
            });
        }
        else{
            console.error("Invalid argument for checkCollision: ", collBlock);
            return null;
        }
        const points = this.__colisionPoints(dimensions.x,dimensions.y,dimensions.width,dimensions.height);
        for (let BlockID in QBlock.blocks) {
            const block = QBlock.blocks[BlockID];
            const blockDimensions = block.getDimensions();
            if(block.id === collBlock.id) continue;
            const blockPoints = QBlock.__colisionPoints(blockDimensions.x,blockDimensions.y,blockDimensions.width,blockDimensions.height);
            if (this.__checkCollisionPoints(points, blockPoints)) {
                return block;
            }
        }
        return null;
    }

    /**
     * @private
     * Checks if any of the points in points2 are inside the rectangle defined by points1.
     * @param {number[][]} points1 - Array of [x, y] points representing the corners and center of the first rectangle.
     * @param {number[][]} points2 - Array of [x, y] points representing the corners and center of the second rectangle.
     * @returns {boolean} True if a collision is detected, false otherwise.
     */
    static __checkCollisionPoints(points1, points2) {
        // Iterate through each point of the second block (points2)
        for (const point2 of points2) {
            // Check if point2 is inside the rectangle defined by points1
            if (this.__isPointInRectangle(point2, points1)) {
                return true; // Collision detected
            }
        }
        //No points of points2 were inside points1. Now check the other way round.
        for (const point1 of points1) {
            // Check if point2 is inside the rectangle defined by points1
            if (this.__isPointInRectangle(point1, points2)) {
                return true; // Collision detected
            }
        }
        return false; // No collision detected
    }

    /**
     * @private
     * Checks if a given point is inside a rectangle.
     * @param {number[]} point - The [x, y] coordinates of the point to check.
     * @param {number[][]} rectPoints - Array of [x, y] points representing the corners and center of the rectangle.  We only need two opposing corners, but using all points simplifies the calling function.
     * @returns {boolean} True if the point is inside the rectangle, false otherwise.
    */

    static __isPointInRectangle(point, rectPoints) {
        // Find min and max X and Y coordinates from rectPoints
        let minX = rectPoints[0][0];
        let maxX = rectPoints[0][0];
        let minY = rectPoints[0][1];
        let maxY = rectPoints[0][1];

        for (const rectPoint of rectPoints) {
            minX = Math.min(minX, rectPoint[0]);
            maxX = Math.max(maxX, rectPoint[0]);
            minY = Math.min(minY, rectPoint[1]);
            maxY = Math.max(maxY, rectPoint[1]);
        }

        const [x, y] = point;

        // Check if the point's x and y coordinates are within the rectangle's bounds
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }

    /**
     * @private
     */
    static __colisionPoints(x,y,width,height){
        const p1 = [x, y];    //Obere linke Ecke
        const p2 = [x + width, y]; //Obere rechte Ecke
        const p3 = [x, y + height]; //Untere linke Ecke
        const p4 = [x + width, y + height]; //Untere rechte Ecke
        const p5 = [x + width / 2, y + height / 2]; //Mitte
        return [p1, p2, p3, p4, p5];
    }


    /**
     * Gibt den QBlock mit der gegebenen ID zurück oder null, wenn der Block nicht gefunden wurde.
     * @param {number} id 
     * @returns {QBlock | null}
     */
    static getBlockById(id) {
        const block = QBlock.blocks[id];
        if(!block){
            console.error("Block not Found: " + id);
            return null;
        }
        return block;
    }

    static deleteBlockById(id) {
        delete QBlock.blocks[id];
    }

    static connectInput(blockId, inputIndex, wireId) {
        return QBlock.__connetctor(blockId, wireId, true, inputIndex);
    }

    static disconnectInput(blockId, inputIndex) {
        return QBlock.__connetctor(blockId, null, false, inputIndex);
    }

    static connectOutput(blockId, outputIndex, wireId) {
        return QBlock.__connetctor(blockId, wireId, true, -1, outputIndex);
    }

    static disconnectOutput(blockId, outputIndex) {
        return QBlock.__connetctor(blockId, null, false, -1, outputIndex);
    }

    /**
     * @private
     */
    static __connetctor(blockId, wireId, connect, inputIndex=-1, outputIndex=-1) {
        const block = QBlock.getBlockById(blockId);
        if (!block) {
            return false; // Block nicht gefunden
        }

        const element = inputIndex >= 0
            ? block.template.querySelector(`#input_${blockId}_${inputIndex}`)
            : block.template.querySelector(`#output_${blockId}_${outputIndex}`);
        if (element) {
            element.setAttribute("fill", connect ? "green" : "red");
            if (inputIndex >= 0) {
                //Prüfung ob der Eingang schon belegt ist.
                if(connect && block.inputWireIds[inputIndex] !== null){
                    console.warn(`Input ${inputIndex} of block ${blockId} is already connected.`);
                    return false;
                }
                block.inputWireIds[inputIndex] = connect ? wireId : null;
            } else {
                //Prüfung ob der Ausgang schon belegt ist.
                 if(connect && block.outputWireIds[outputIndex] !== null){
                    console.warn(`Output ${outputIndex} of block ${blockId} is already connected.`);
                    return false;
                }
                block.outputWireIds[outputIndex] = connect ? wireId : null;
            }
            return true;
        } else {
            console.error(`Element not found in block ${blockId}:`, inputIndex >=0 ? `Input ${inputIndex}` : `Output ${outputIndex}`); // Detailliertere Fehlermeldung
            return false;
        }
    }

    static isQBlock(name) {
        for(let i = 0; i < QBlock.qblocks.length; i++){
            if(QBlock.qblocks[i].includes(name)) return true;
        }
        return false;
    }

    static getQBlockNames() {
        return QBlock.qblocks;
    }

    constructor(kind) {
        this.id = QBlock.getNextId();
        this._isLoading = true; // Ladezustand setzen
        this.x = 0;
        this.y = 0;
        this.inputWireIds = []; // Initialisiere als leeres Array
        this.outputWireIds = []; // Initialisiere als leeres Array

        try {
            /**
             * Dynamische Erstellung des Templates
             * @type {SVGElement}
             */
            this.template = QBlock[kind + "Template"](this.id,false);
            const Inputs = this.template.querySelector(`#svg_${this.id}`)  .querySelectorAll(`[id^="input_${this.id}_"]:not([id$="_hitbox"])`);
            const Outputs = this.template.querySelector(`#svg_${this.id}`)  .querySelectorAll(`[id^="output_${this.id}_"]:not([id$="_hitbox"])`)
            const numInputs = Inputs.length;
            const numOutputs = Outputs.length;
            this.inputWireIds = new Array(numInputs).fill(null);
            this.outputWireIds = new Array(numOutputs).fill(null);

            QBlock.blocks[this.id] = this;

        } catch (error) {
            if (error instanceof TypeError) {
                console.error("Blockmanager:constructor->Template method not found:", kind, error);
                console.error(error.stack);
                this.showError(`Could not load block of type '${kind}'.`);
            } else {
                console.error("Blockmanager:constructor->An UNEXPECTED error occurred:", error);
                console.error(error.stack);
                this.showError("An unexpected error occurred. Please try again.");
            }
        } finally {
            this._isLoading = false;
        }
    }

    //class methods
    /**
     * Diese Methode Platziert den QBlock an die gegebene Position
     * @param {Element} parent div in dem der Block platziert werden soll
     * @param {number} x 
     * @param {number} y 
     */
    place(parent,x,y){
        this.template.style.position = "absolute";
        this.x = x;
        this.y = y;
        this.template.style.left = x + "px";
        this.template.style.top = y + "px";
        parent.appendChild(this.template);
    }

    /**
     * Zerstört den QBlock und entfernt ihn aus dem DOM
     * @param {Element} parent  div in dem der Block platziert wurde
     */
    destroy(parent){
        parent.removeChild(this.template);
        QBlock.deleteBlockById(this.id);
    }

    highlight(){
        const highlightBox = this.template.querySelector(`#highlight_${this.id}`)
        highlightBox.setAttribute("visibility", "visible");
    }

    unhighlight(){
        const highlightBox = this.template.querySelector(`#highlight_${this.id}`)
        highlightBox.setAttribute("visibility", "hidden");
    }

    getDimensions(){
        const width = parseInt(this.template.querySelector(`#highlight_${this.id}`).getAttribute("width"));   
        const height = parseInt(this.template.querySelector(`#highlight_${this.id}`).getAttribute("height"));
        return {x: this.x, y: this.y, width: width, height: height};
    }

    /**
     * Gibt die Position des Inputs oder Outputs zurück
     * @param {string} inoutID
     * @returns {{x: number, y: number}}
        */	
    getQBlockPortPosition(portID,scrollLeft,scrollTop){
        const match = portID.match(/(input|output)_(\d+)_(\d+)/);
        if (!match) {
            console.error("Invalid port ID format:", portID);
            return [0, 0];
        }
        const [, portType, blockIdStr, portIndexStr] = match;
        const portIndex = parseInt(portIndexStr, 10);
    
        const portElement = document.getElementById(portID);
        if (!portElement) {
            console.error("Port element not found for ID:", portID);
            return [0, 0];
        }
    
        const portRect = portElement.getBoundingClientRect();
    
        let x;
        if (portType === "input") {
            x = portRect.left + scrollLeft + (portRect.width / 2);
        } else { // output
            x = portRect.left + scrollLeft + portRect.width;
        }
        const y = portRect.top + scrollTop + (portRect.height / 2);
    
        return [x, y];
    }

    checkInputOutput(x,y){
        const inputs = this.template.querySelectorAll(`[id^="input_${this.id}_"]`);
        const outputs = this.template.querySelectorAll(`[id^="output_${this.id}_"]`);
        for(let i = 0; i < inputs.length; i++){
            const input = inputs[i];
            const rect = input.getBoundingClientRect();
            console.log(rect);
            if(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom){
                return `input_${this.id}_${i}`;
            }
        }
        for(let i = 0; i < outputs.length; i++){
            const output = outputs[i];
            const rect = output.getBoundingClientRect();
            console.log(rect);
            if(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom){
                return `output_${this.id}_${i}`;
            }
        }
    }

    /**
     * 
     * @param {string} message 
     */
    showError(message){
        window.alert(message);
    }
}

export default QBlock;