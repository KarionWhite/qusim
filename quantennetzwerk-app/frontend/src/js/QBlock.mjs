import { globalEvents } from "./EventEmitter.mjs";

class QBlock {

    constructor(kind) {
        this.id = QBlock.getNextId();
        this._isLoading = true; // Ladezustand setzen
        this.inputWireIds = []; // Initialisiere als leeres Array
        this.outputWireIds = []; // Initialisiere als leeres Array

        try {
            this.template = QBlock[kind + "Template"](this.id);

            // Dynamische Initialisierung der inputWireIds und outputWireIds
            const numInputs = this.template.querySelectorAll('[id$="_input_0"]').length > 0
                ? parseInt(this.template.querySelector('[id$="_input_0"]').id.split("_")[0].match(/\d+$/)[0]) + 1
                : 0;
            const numOutputs = this.template.querySelectorAll('[id$="_output_0"]').length > 0
                ? parseInt(this.template.querySelector('[id$="_output_0"]').id.split("_")[0].match(/\d+$/)[0]) + 1
                : 0;


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

    static blocks = {};   //{id: block, ...} -> block = {id: id, template: template, inputWireIds: [], outputWireIds: []}
    static qblocks = ["qinput", "measure", "identity", "hadamard", "pauli_x", "pauli_y", "pauli_z", "cnot", "swap", "toffoli", "fredkin"];

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
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", `klasse_${id}`);
        g.setAttribute("class", `gate_${klasse}`);
        g.setAttribute("draggable", "true");   //Funktioniert nicht ?! Wir werden es wohl mit JS machen müssen =(

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
        rect.addEventListener("mousedown", (event) => {
            if(globalEvents.hasListeners("startDrag")) globalEvents.emit("startDrag", event, id);
            else console.warn("No listener for 'startDrag' event.");
        });
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
        text.textContent = gatename;
        text.addEventListener("mousedown", (event) => {
            if(globalEvents.hasListeners("startDrag"))globalEvents.emit("startDrag", event, id)
            else console.warn("No listener for 'startDrag' event.");});
        g.appendChild(text);

        //Wenn es sich um einen Schattenblock handelt, dann sollen keine Inputs und Outputs angezeigt werden
        if(shadow){
            return g;
        }

        // Inputs rote Kreise, weil noch keine Verbindung besteht
        for (let i = 0; i < inputs; i++) {
            const inputID = `${id}_input_${i}`;
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("id", inputID);
            circle.setAttribute("cx", "0");
            circle.setAttribute("cy", 20 * i + in_out_offset);
            circle.setAttribute("r", "5");
            circle.setAttribute("fill", "red");
            circle.setAttribute("stroke", "black");
            circle.setAttribute("stroke-width", "1");
            g.appendChild(circle);
            //Unsichtbare Hitbox zum Klicken auf den Input
            const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            hitbox.setAttribute("id", inputID + "_hitbox");
            hitbox.setAttribute("x", "-5");
            hitbox.setAttribute("y", 20 * i + in_out_offset - 5);
            hitbox.setAttribute("width", "10");
            hitbox.setAttribute("height", "10");
            hitbox.setAttribute("fill", "transparent");
            hitbox.addEventListener("mousedown", (event) => {
                if(globalEvents.hasListeners("startWire"))globalEvents.emit("startWire", event, inputID)
                else console.warn("No listener for 'startDrag' event.");});
            g.appendChild(hitbox);

        }

        // Outputs rote Dreiecke, weil noch keine Verbindung besteht
        for (let i = 0; i < outputs; i++) {
            const outputID = `${id}_output_${i}`;
            const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            polygon.setAttribute("id", outputID);
            polygon.setAttribute("points", `${width - 5},${20 * i + in_out_offset + 5} ${width},${20 * i + in_out_offset} ${width - 5},${20 * i + in_out_offset - 5}`);
            polygon.setAttribute("fill", "red");
            polygon.setAttribute("stroke", "black");
            polygon.setAttribute("stroke-width", "1");
            g.appendChild(polygon);
            //Unsichtbare Hitbox zum Klicken auf den Output
            const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            hitbox.setAttribute("id", outputID + "_hitbox"); // Korrigierte ID
            hitbox.setAttribute("x", width - 5);
            hitbox.setAttribute("y", 20 * i + in_out_offset - 5);
            hitbox.setAttribute("width", "10");
            hitbox.setAttribute("height", "10");
            hitbox.setAttribute("fill", "transparent");
            hitbox.addEventListener("mousedown", (event) => {
                if(globalEvents.hasListeners("startWire"))globalEvents.emit("startWire", event, outputID)
                else console.warn("No listener for 'startDrag' event.");
            });
            g.appendChild(hitbox);
        }
        return g;
    }

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
            ? block.template.querySelector(`#${blockId}_input_${inputIndex}`)
            : block.template.querySelector(`#${blockId}_output_${outputIndex}`);

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

    showError(message){
        window.alert(message);
    }
}

export default QBlock;