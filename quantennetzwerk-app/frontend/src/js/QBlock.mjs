import globalEvents from "./EventEmitter.mjs";

class QBlock {


    static __nextId = 0;

    static getNextId() {
        return QBlock.__nextId++;
    }

    static blocks = {};   //{id: block, ...} -> block = {id: id, template: template, x, y, inputWireIds: [], outputWireIds: []}
    static qblocks = ["qinput", "measure", "identity", "hadamard",
        "pauli_x", "pauli_y", "pauli_z", "cnot", "swap", "toffoli", "fredkin"];

    static qinputTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "Input", 0, 1, shadow); }
    static measureTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "M", 1, 0, shadow); }
    static identityTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "Ident", 1, 1, shadow); }
    static hadamardTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "H", 1, 1, shadow); }
    static pauli_xTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "P X", 1, 1, shadow); }
    static pauli_yTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "P Y", 1, 1, shadow); }
    static pauli_zTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "P Z", 1, 1, shadow); }
    static cnotTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "C Not", 2, 2, shadow); }
    static swapTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "Swap", 2, 2, shadow); }
    static toffoliTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "Toff", 3, 3, shadow); }
    static fredkinTemplate = (id, shadow = false) => { return QBlock.__ntomTemplate(id, "Fred", 3, 3, shadow); }
    //Derzeitig nicht implementiert in Qengine
    static xgateTemplate = (id, name, klasse, x, y, shadow = false) => { return QBlock.__ntomTemplate(id, name, klasse, x, y, shadow); }

    /**
     * Ein allgemeines Gatter-Template für die Toolbox
     * du kannst die Menge der Inputs und Outputs angeben und diese werden automatisch generiert
     * @param {number} id
     * @param {string} gatename
     * @param {number} inputs
     * @param {number} outputs
     * @returns {SVGElement}
     */
    static __ntomTemplate(id, gatename, inputs, outputs, shadow = false,x=0,y=0) {
        //Wir wollen die Größe des Gatters berechnen
        const elements = [];

        const height = 60 + 20 * Math.max(inputs, outputs); //60 ist die Höhe des Rechtecks, 20 ist der Abstand zwischen den Inputs/Outputs
        const width = 60; //Die Breite des Rechtecks
        const in_out_offset = 45;

        const has_startDrag = globalEvents.hasListeners("startDrag") && !shadow;
        const has_placeBlock = globalEvents.hasListeners("placeBlock") && shadow;
        const has_startWire = globalEvents.hasListeners("startWire") && !shadow;
        const has_info_hover = globalEvents.hasListeners("infoHover") && !shadow;
        const has_info_unhover = globalEvents.hasListeners("infoUnhover") && !shadow;
        //Warnungen, wenn keine Listener vorhanden sind, wenn sie benötigt werden
        if (!has_startDrag && !shadow) console.warn("No listener for 'startDrag' event.");
        if (!has_placeBlock && shadow) console.warn("No listener for 'placeBlock' event.");
        if (!has_startWire && !shadow) console.warn("No listener for 'startWire' event.");
        if (!has_info_hover && !shadow) console.warn("No listener for 'infoHover' event.");
        if (!has_info_unhover && !shadow) console.warn("No listener for 'infoUnhover' event.");

        // Rechteck
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("id", `${id}_rect`);
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", width);
        rect.setAttribute("height", height);
        rect.setAttribute("fill", "white");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "1");
        rect.style.zIndex = 3;
        if (has_startDrag) {
            rect.addEventListener("mousedown", (event) => {
                globalEvents.emit("startDrag", event, id);
            });
        }
        if (has_placeBlock) {
            rect.addEventListener("mousedown", (event) => {
                globalEvents.emit("placeBlock", event, id);
            });
        }
        if (has_info_hover) {
            rect.addEventListener("mouseover", (event) => {
                globalEvents.emit("infoHover", event, id);
            });
        }
        if (has_info_unhover) {
            rect.addEventListener("mouseleave", (event) => {
                globalEvents.emit("infoUnhover", event, id);
            });
        }
        elements.push(rect);

        // Text
        //Wir müssen den die höhe des Textes berechnen
        const heightText = 20
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("id", `${id}_text`);
        text.setAttribute("x", x + width / 2);
        text.setAttribute("y", y + heightText + 20);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("alignment-baseline", "middle");
        text.setAttribute("font-size", "20");
        text.setAttribute("fill", "black");
        text.textContent = gatename;
        if (has_startDrag) {
            text.addEventListener("mousedown", (event) => {
                globalEvents.emit("startDrag", event, id);
            });
        }
        if (has_placeBlock) {
            text.addEventListener("mousedown", (event) => {
                globalEvents.emit("placeBlock", event, id);
            });
        }
        if (has_info_hover) {
            text.addEventListener("mouseover", (event) => {
                globalEvents.emit("infoHover", event, id);
            });
        }
        if (has_info_unhover) {
            text.addEventListener("mouseleave", (event) => {
                globalEvents.emit("infoUnhover", event, id);
            });
        }
        text.style.zIndex = 4;
        elements.push(text);

        // Highlight Box
        const highlight = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        highlight.setAttribute("id", `highlight_${id}`);
        highlight.setAttribute("x", x-10);
        highlight.setAttribute("y", y-10);
        highlight.setAttribute("width", width + 20);
        highlight.setAttribute("height", height + 20);
        highlight.setAttribute("fill", "transparent");
        highlight.setAttribute("stroke", "blue");
        highlight.setAttribute("stroke-width", "2");
        highlight.setAttribute("visibility", "hidden");
        if (has_startDrag) {
            highlight.addEventListener("mousedown", (event) => {
                globalEvents.emit("startDrag", event, id);
            });
        }
        highlight.style.zIndex = 2;
        elements.push(highlight);

        // Inputs rote Kreise, weil noch keine Verbindung besteht
        for (let i = 0; i < inputs; i++) {
            const inputID = `input_${id}_${i}`;
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("id", inputID);
            circle.setAttribute("cx", x);
            circle.setAttribute("cy",y + 20 * i + in_out_offset -5);
            circle.setAttribute("r", "5");
            circle.setAttribute("fill", "red");
            circle.setAttribute("stroke", "black");
            circle.setAttribute("stroke-width", "1");
            circle.style.zIndex = 2;
            elements.push(circle);
            //Unsichtbare Hitbox zum Klicken auf den Input
            const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            hitbox.setAttribute("id", inputID + "_hitbox");
            hitbox.setAttribute("x", x-10);
            hitbox.setAttribute("y", y + 20 * i + in_out_offset -15);
            hitbox.setAttribute("width", "30");
            hitbox.setAttribute("height", "20");
            hitbox.setAttribute("fill", "transparent");
            if (has_startWire) {
                hitbox.addEventListener("mousedown", (event) => {
                    globalEvents.emit("startWire", event, inputID)
                });
            }
            hitbox.style.zIndex = 2;
            if (!shadow) elements.push(hitbox);


        }

        // Outputs rote Dreiecke, weil noch keine Verbindung besteht
        for (let i = 0; i < outputs; i++) {
            const outputID = `output_${id}_${i}`;
            const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            polygon.setAttribute("id", outputID);
            polygon.setAttribute("points", `${x + width - 10},${y + 20 * i + in_out_offset - 10} ${x + width},${y + 20 * i + in_out_offset - 5} ${x +width - 10},${y +20 * i + in_out_offset}`);
            polygon.setAttribute("fill", "red");
            polygon.setAttribute("stroke", "black");
            polygon.setAttribute("stroke-width", "1");
            polygon.style.zIndex = 2;
            elements.push(polygon);

            //Unsichtbare Hitbox zum Klicken auf den Output
            const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            hitbox.setAttribute("id", outputID + "_hitbox"); // Korrigierte ID
            hitbox.setAttribute("x", x + width -10);
            hitbox.setAttribute("y", y + 20 * i + in_out_offset -10);
            hitbox.setAttribute("width", "30");
            hitbox.setAttribute("height", "20");
            hitbox.setAttribute("fill", "transparent");
            if (has_startWire) {
                hitbox.addEventListener("mousedown", (event) => {
                    globalEvents.emit("startWire", event, outputID)
                });
            }
            hitbox.style.zIndex = 2;
            if (!shadow) elements.push(hitbox);
        }

        return elements;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {null | String} null wenn kein Block getroffen wurde, sonst die ID des getroffenen Ports
     */
    static hitInputOutput(x, y) {
        for (let BlockID in QBlock.blocks) {
            const block = QBlock.blocks[BlockID];
            const hit = block.checkInputOutput(x, y);
            if (hit) return hit;
        }
        return null;
    }

    /**
     * 
     * @param {SVGElement || QBlock} collBlock 
     * @returns 
     */
    static checkCollision(collBlock) {
        //Wir prüfen 9 Punkte auf Kollision
        let dimensions = { x: 0, y: 0, width: 0, height: 0 };
        if (collBlock instanceof QBlock) {
            dimensions = collBlock.getDimensions();
        }
        else if (collBlock.getAttribute("id") === "shadowBlock") {
            collBlock.getAttribute("style").split(";").forEach((style) => {
                if (style.includes("translate")) {
                    const [x, y] = style.match(/-?\d+/g);
                    dimensions.x = parseInt(x);
                    dimensions.y = parseInt(y);
                }
            });
            collBlock.querySelectorAll("rect").forEach((rect) => {
                dimensions.width = parseInt(rect.getAttribute("width"));
                dimensions.height = parseInt(rect.getAttribute("height"));
            });
        }
        else {
            console.error("Invalid argument for checkCollision: ", collBlock);
            return null;
        }
        const points = this.__colisionPoints(dimensions.x, dimensions.y, dimensions.width, dimensions.height);
        for (let BlockID in QBlock.blocks) {
            const block = QBlock.blocks[BlockID];
            const blockDimensions = block.getDimensions();
            if (block.id === collBlock.id) continue;
            const blockPoints = QBlock.__colisionPoints(blockDimensions.x, blockDimensions.y, blockDimensions.width, blockDimensions.height);
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
    static __colisionPoints(x, y, width, height) {
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
        if (!block) {
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
    static __connetctor(blockId, wireId, connect, inputIndex = -1, outputIndex = -1) {
        const block = QBlock.getBlockById(blockId);
        if (!block) {
            return false; // Block nicht gefunden
        }

        const element = inputIndex >= 0
            ? block.elements.find(element => element.getAttribute("id") === `input_${blockId}_${inputIndex}`)
            : block.elements.find(element => element.getAttribute("id") === `output_${blockId}_${outputIndex}`);
        if (element) {
            element.setAttribute("fill", connect ? "green" : "red");
            if (inputIndex >= 0) {
                //Prüfung ob der Eingang schon belegt ist.
                if (connect && block.inputWireIds[inputIndex] !== null) {
                    console.warn(`Input ${inputIndex} of block ${blockId} is already connected.`);
                    return false;
                }
                block.inputWireIds[inputIndex] = connect ? wireId : null;
            } else {
                //Prüfung ob der Ausgang schon belegt ist.
                if (connect && block.outputWireIds[outputIndex] !== null) {
                    console.warn(`Output ${outputIndex} of block ${blockId} is already connected.`);
                    return false;
                }
                block.outputWireIds[outputIndex] = connect ? wireId : null;
            }
            return true;
        } else {
            console.error(`Element not found in block ${blockId}:`, inputIndex >= 0 ? `Input ${inputIndex}` : `Output ${outputIndex}`); // Detailliertere Fehlermeldung
            return false;
        }
    }

    static isQBlock(name) {
        for (let i = 0; i < QBlock.qblocks.length; i++) {
            if (QBlock.qblocks[i].includes(name)) return true;
        }
        return false;
    }

    static getQBlockNames() {
        return QBlock.qblocks;
    }

    static restoreBlock(block){
        if(QBlock.blocks[block.id]){
            console.warn("Block with id already exists: ",block.id);
            return;
        }
        QBlock.blocks[block.id] = block;
        block.place(block.x,block.y);
    }

    constructor(kind, shadow = false, parent = "toolbox_grid",force_id=false,id=0) {
        this.kind = kind;
        this.shadow = shadow;
        if(force_id){
            this.id = id;
            QBlock.__nextId = Math.max(Number.parseInt(QBlock.__nextId),Number.parseInt(id)+1);
        }else{
            this.id = QBlock.getNextId();
        }
        this._isLoading = true; // Ladezustand setzen
        this.x = 0;
        this.y = 0;
        this.parentId = parent;
        this.parent = document.getElementById(this.parentId);
        try {
            /**
             * Dynamische Erstellung der SVG Elemente durch die Template Funktionen
             * @type {SVGElement}
             */
            this.elements = QBlock[kind + "Template"](this.id, this.shadow);
            let numInputs = 0;
            let numOutputs = 0;
            for (const element of this.elements) {
                if (element.tagName === "circle") {
                    numInputs++;
                }
                else if (element.tagName === "polygon") {
                    numOutputs++;
                }
            }
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
     * @param {number} x 
     * @param {number} y 
     */
    place(x, y) {
        this.x = x;
        this.y = y;
        this.__setPositioning();
        for (const element of this.elements) {
            this.parent.appendChild(element);
        }
    }

    __setPositioning(){
        const width = 60; //Die Breite des Rechtecks
        const in_out_offset = 45;
        for(const element of this.elements){
            /**
             * @type {string}
             */
            const id = element.getAttribute("id");
            if(id.includes("rect")){
                element.setAttribute("x",this.x);
                element.setAttribute("y",this.y);
            }else if(id.includes("text")){
                element.setAttribute("x",this.x + width / 2);
                element.setAttribute("y",this.y+20);
            }else if(id.includes("highlight")){
                element.setAttribute("x",this.x-10);
                element.setAttribute("y",this.y-10);
            }else if(id.includes("input") && !element.id.includes("hitbox")){
                const index = parseInt(element.id.split("_")[2]);
                element.setAttribute("cx",this.x);
                element.setAttribute("cy",this.y + 20 * index + in_out_offset -5);
            }else if(id.includes("output") && !element.id.includes("hitbox")){
                const index = parseInt(element.id.split("_")[2]);
                element.setAttribute("points", `${this.x + width - 10},${this.y + 20 * index + in_out_offset - 10} ${this.x + width},${this.y + 20 * index + in_out_offset - 5} ${this.x +width - 10},${this.y +20 * index + in_out_offset}`);
            }else if(id.includes("hitbox")){
                const index = parseInt(id.split("_")[2]);
                if(id.includes("input")){
                    element.setAttribute("x",this.x-10);
                    element.setAttribute("y",this.y + 20 * index + in_out_offset -15);
                }else{
                    element.setAttribute("x",this.x + width-20);
                    element.setAttribute("y",this.y + 20 * index + in_out_offset-15);
                }
            }

        }
    }

    /**
     * Wandelt den Schattenblock in einen normalen Block um
     */
    shadowToBlock() {
        this.shadow = false;
        this.elements = QBlock[kind + "Template"](this.id, this.shadow);
        this.remove();
        this.place(this.x, this.y);
    }

    /**
     * Löscht den QBlock aus dem DOM, ohne ihn zu zerstören
     */
    remove() {
        for (const element of this.elements) {
            if(this.parent.hasChildNodes() && this.parent.contains(element)){
                this.parent.removeChild(element);
            }
        }
    }

    /**
     * Zerstört den QBlock und entfernt ihn aus dem DOM
     */
    destroy() {
        QBlock.deleteBlockById(this.id);
        this.remove();
    }

    highlight() {
        const highlightBox = this.elements.find(element => element.getAttribute("id").includes("highlight"));
        highlightBox.setAttribute("visibility", "visible");
    }

    unhighlight() {
        const highlightBox = this.elements.find(element => element.getAttribute("id").includes("highlight"));
        highlightBox.setAttribute("visibility", "hidden");
    }

    getDimensions() {
        const highlightBox = this.elements.find(element => element.getAttribute("id").includes("highlight"));
        const width = parseInt(highlightBox.getAttribute("width"));
        const height = parseInt(highlightBox.getAttribute("height"));
        return { x: this.x, y: this.y, width: width, height: height };
    }

    /**
     * Gibt die Position des Inputs oder Outputs zurück
     * @param {string} inoutID
     * @returns {{x: number, y: number}}
        */
    getQBlockPortPosition(portID, scrollLeft, scrollTop) {
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

    checkInputOutput(x, y) {
        const inputs = this.elements.filter(element => element.tagName === "circle");
        const outputs = this.elements.filter(element => element.tagName === "polygon");
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const rect = input.getBoundingClientRect();
            console.log(rect);
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return `input_${this.id}_${i}`;
            }
        }
        for (let i = 0; i < outputs.length; i++) {
            const output = outputs[i];
            const rect = output.getBoundingClientRect();
            console.log(rect);
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return `output_${this.id}_${i}`;
            }
        }
    }

    forSaving(){
        return {
            kind: this.kind,
            x: Number.parseInt(this.x),
            y: Number.parseInt(this.y),
            inputWireIds: Number.parseInt(this.inputWireIds),
            outputWireIds: Number.parseInt(this.outputWireIds)
        }
    }

    /**
     * 
     * @param {string} message 
     */
    showError(message) {
        window.alert(message);
    }
}

export default QBlock;