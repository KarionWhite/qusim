class BlockManager {
    constructor(dragndropCallback, setRasterElementCallback, getWireManagerStartWireCallback, hasChangedCallback) {
        this.dragndrop = dragndropCallback; // Store the callbacks
        this.setRasterElement = setRasterElementCallback;
        this.getWireManagerStartWire = getWireManagerStartWireCallback; // Callback to get startWire from WireManager
        this.hasChanged = hasChangedCallback;

        this.blocks = {};
        this.idCounter = 1;
    }

    ntomTemplate(id, name, klasse, inputs, outputs) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", `gate_${klasse}`);
        g.setAttribute("draggable", "true");

        const height = 60 + 20 * Math.max(inputs, outputs);
        const width = 60;
        const in_out_offset = 45;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("id", `${id}_rect`);
        rect.setAttribute("width", width);
        rect.setAttribute("height", height + 10);
        rect.setAttribute("fill", "white");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "1");
        rect.addEventListener("mousedown", (event) => this.eventManager.dragndrop(event, id)); // Use eventManager instance
        g.appendChild(rect);

        const heightText = 20;
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("id", `${id}_text`);
        text.setAttribute("x", width / 2);
        text.setAttribute("y", heightText);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("alignment-baseline", "middle");
        text.setAttribute("font-size", "20");
        text.setAttribute("fill", "black");
        text.textContent = name;
        text.addEventListener("mousedown", (event) => this.eventManager.dragndrop(event, id)); // Use eventManager instance
        g.appendChild(text);

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

            const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            hitbox.setAttribute("id", `${id}_input_hitbox_${i}`);
            hitbox.setAttribute("x", "-5");
            hitbox.setAttribute("y", 20 * i + in_out_offset - 5);
            hitbox.setAttribute("width", "10");
            hitbox.setAttribute("height", "10");
            hitbox.setAttribute("fill", "transparent");
            hitbox.addEventListener("mousedown", (event) => this.wireManager.startWire(event, `${id}_input_${i}`)); // Use wireManager instance
            g.appendChild(hitbox);
        }

        for (let i = 0; i < outputs; i++) {
            const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            polygon.setAttribute("id", `${id}_output_${i}`);
            polygon.setAttribute("points", `${width - 5},${20 * i + in_out_offset + 5} ${width},${20 * i + in_out_offset} ${width - 5},${20 * i + in_out_offset - 5}`);
            polygon.setAttribute("fill", "white");
            polygon.setAttribute("stroke", "black");
            polygon.setAttribute("stroke-width", "1");
            g.appendChild(polygon);

            const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            hitbox.setAttribute("id", `${id}_output_hitbox_${i}`);
            hitbox.setAttribute("x", width - 5);
            hitbox.setAttribute("y", 20 * i + in_out_offset - 5);
            hitbox.setAttribute("width", "10");
            hitbox.setAttribute("height", "10");
            hitbox.setAttribute("fill", "transparent");
            hitbox.addEventListener("mousedown", (event) => this.wireManager.startWire(event, `${id}_output_${i}`)); // Use wireManager instance
            g.appendChild(hitbox);
        }
        return g;
    }

    schattenTemplate(id, inputs, outputs) {
        const height = 60 + 20 * Math.max(inputs, outputs);
        const width = 60;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", id);
        g.setAttribute("class", "schatten");

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("id", `${id}_rect`);
        rect.setAttribute("width", width);
        rect.setAttribute("height", height + 10);
        rect.setAttribute("fill", "gray");
        rect.setAttribute("fill-opacity", "0.5");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "1");
        g.appendChild(rect);

        return g;
    }

    // Template getter functions
    qinputTemplate(id) { return this.ntomTemplate(id, "Input", "qinput", 0, 1); }
    measureTemplate(id) { return this.ntomTemplate(id, "M", "measure", 1, 0); }
    identityTemplate(id) { return this.ntomTemplate(id, "Ident", "identity", 1, 1); }
    hadamardTemplate(id) { return this.ntomTemplate(id, "Hada", "hadamard", 1, 1); }
    pauli_xTemplate(id) { return this.ntomTemplate(id, "Pauli X", "pauli_x", 1, 1); }
    pauli_yTemplate(id) { return this.ntomTemplate(id, "Pauli Y", "pauli_y", 1, 1); }
    pauli_zTemplate(id) { return this.ntomTemplate(id, "Pauli Z", "pauli_z", 1, 1); }
    shadowoneTemplate(id) { return this.schattenTemplate(id, 1, 1); }
    cnotTemplate(id) { return this.ntomTemplate(id, "CNOT", "cnot", 2, 2); }
    swapTemplate(id) { return this.ntomTemplate(id, "SWAP", "swap", 2, 2); }
    shadowtwoTemplate(id) { return this.schattenTemplate(id, 2, 2); }
    toffoliTemplate(id) { return this.ntomTemplate(id, "TOFF", "toffoli", 3, 3); }
    fredkinTemplate(id) { return this.ntomTemplate(id, "FRED", "fredkin", 3, 3); }
    shadowthreeTemplate(id) { return this.schattenTemplate(id, 3, 3); }
    xgateTemplate(id) { return this.ntomTemplate(id, "XGate", "xgate", 1, 1); } // Example xgate template
    shadowXgateTemplate(id) { return this.schattenTemplate(id, 1, 1); } // Example shadow for xgate


    placeTemplate(activeTool, x, y, toolboxGrid) {
        const boxId = `${activeTool}_${this.idCounter++}`;
        const chosenTemplate = this[`${activeTool}Template`](boxId); // Dynamically call template function
        eventManager.setRasterElement(chosenTemplate, x, y); // Use eventManager instance for raster placement

        toolboxGrid.appendChild(chosenTemplate);
        let [rx, ry, width, height] = this.getTemplateRectDimensions(chosenTemplate);
        this.blocks[boxId] = {
            block: activeTool,
            x: rx,
            y: ry
        };
    }

    getElementPosition(element) {
        const transform = element.getAttribute("transform");
        if (!transform) {
            console.error(`Element ${element.id} hat kein transform Attribut!`);
            return [0, 0];
        }
        const x = parseInt(transform.split("(")[1].split(",")[0]) || 0;
        const y = parseInt(transform.split(",")[1].split(")")[0]) || 0;
        return [x, y];
    }

    getTemplateRectDimensions(element) {
        if (element.getAttribute("class").includes("gate")) {
            let x = parseInt(element.getAttribute("transform").split("(")[1].split(",")[0]) || 0;
            let y = parseInt(element.getAttribute("transform").split(",")[1].split(")")[0]) || 0;
            const rect = element.querySelector(`#${element.id}_rect`);
            const width = parseInt(rect.getAttribute("width"));
            const height = parseInt(rect.getAttribute("height"));
            return [x, y, width, height];
        }
    }

    updateBlockPosition(blockId, x, y) {
        this.blocks[blockId] = {
            ...this.blocks[blockId], // Keep other properties
            x: x,
            y: y
        };
    }

    searchBlocksTemplate(id) {
        const entries = Object.entries(this.blocks);
        for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];
            if (key.includes(id)) {
                return key; // Return the key (block ID)
            }
        }
        return null; // Not found
    }

    searchWireConnection(blockId) {
        return wireManager.searchWireConnectionForBlock(blockId); // Delegate to WireManager
    }

    deleteTemplate(id) {
        let elementId = this.searchBlocksTemplate(id);
        if (!elementId) {
            console.log("Element not found in blocks");
            return;
        }

        delete this.blocks[elementId];
        const elementToRemove = document.getElementById(elementId);
        if (elementToRemove) {
            elementToRemove.remove();
        }

        const wireIds = this.searchWireConnection(elementId);
        wireIds.forEach(wireId => {
            wireManager.deleteWire(wireId); // Use wireManager to delete wires
        });
        eventManager.hasChanged(); // Use eventManager instance
    }

    getBlocks() {
        return JSON.parse(JSON.stringify(this.blocks));
    }
}

export {BlockManager};