class WireManager {
    constructor(getNearestRasterPointCallback, setRasterElementCallback, hasChangedCallback, toolButtonClickedCallback, blockManagerIdCounterGetter) {
        this.wires = {};
        this.wireNodes = {};
        this.wireDrawing = false;
        this.currentWireId = null;
        this.wireNodeIdCounter = 1;
        this.wireMouseOffsetX = 0;
        this.wireMouseOffsetY = 10;

        this.getNearestRasterPoint = getNearestRasterPointCallback;
        this.setRasterElement = setRasterElementCallback;
        this.hasChanged = hasChangedCallback;
        this.toolButtonClicked = toolButtonClickedCallback;
        this.getBlockManagerIdCounter = blockManagerIdCounterGetter;
    }

    wireTemplate(id, x1, y1, x2, y2) {
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
    }

    wireNodeTemplate(id, x, y) {
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
    }

    startWire(event, id) {
        let myWireId = null;
        if (event.type === "mousedown" && event.button === 0 && this.currentWireId === null) {
            document.getElementById("tool_wire").click(); // Select wire tool if not already selected
            eventManager.toolButtonClicked("wire"); // Ensure activeTool is correctly set
            this.currentWireId = "wire_" + eventManager.blockManager.idCounter++; // Use blockManager's counter for IDs
            myWireId = this.currentWireId;
            this.wireNodes[this.currentWireId] = [];
            this.wireDrawing = true;
        } else if (event.type === "mousedown" && event.button === 0 && this.currentWireId !== null) {
            myWireId = this.currentWireId;
            this.currentWireId = null;
            this.wireDrawing = false;
            eventManager.hasChanged();
        } else {
            return; // Do not proceed if not starting or ending a wire correctly
        }

        let [rx, ry] = eventManager.getNearestRasterPoint(event.offsetX + this.wireMouseOffsetX, event.offsetY + this.wireMouseOffsetY);
        const targetElementId = event.target.id;
        let nodeType = null;
        let nodeId = null;
        let port = null;

        if (targetElementId.includes("input")) {
            nodeType = "input";
            nodeId = targetElementId.split("_")[0];
            port = targetElementId.split("_")[2];
        } else if (targetElementId.includes("output")) {
            nodeType = "output";
            nodeId = targetElementId.split("_")[0];
            port = targetElementId.split("_")[2];
        } else {
            nodeType = "node";
            nodeId = `node_${this.wireNodeIdCounter++}`;
            port = 0;
            console.log("Warning: Wire started/ended at a node point, not input/output");
        }

        this.wireNodes[myWireId].push({ type: nodeType, id: nodeId, port: port, x: rx, y: ry });
        console.log("Wire nodes updated:", this.wireNodes);

        event.stopPropagation();
        event.preventDefault();
    }


    drawWire(event, toolboxGrid) {
        if (this.currentWireId === null) {
            return;
        } else if (event.type === "mousemove") {
            const length = this.wireNodes[this.currentWireId].length - 1;
            const lastNode = this.wireNodes[this.currentWireId][length];
            if (!lastNode) return; // Prevent error if lastNode is undefined
            const lastX = lastNode.x;
            const lastY = lastNode.y;
            const wireExists = document.getElementById(this.currentWireId);
            if (wireExists) {
                wireExists.remove();
            }
            let [mx, my] = eventManager.getNearestRasterPoint(event.offsetX + this.wireMouseOffsetX, event.offsetY + this.wireMouseOffsetY);
            let wire;
            if (length % 2 === 0) {
                wire = this.wireTemplate(this.currentWireId, lastX, lastY, mx, lastY);
            } else {
                wire = this.wireTemplate(this.currentWireId, lastX, lastY, lastX, my);
            }
            toolboxGrid.appendChild(wire);
        } else if (event.type === "mousedown" && event.button === 0 && this.wireNodes[this.currentWireId].length > 0) {
            const offsetX = event.offsetX;
            const offsetY = event.offsetY;
            let [x, y] = eventManager.getNearestRasterPoint(offsetX, offsetY);
            let currentX, currentY;
            if (this.wireNodes[this.currentWireId].length % 2 === 1) {
                currentY = this.wireNodes[this.currentWireId][this.wireNodes[this.currentWireId].length - 1].y;
                currentX = x;
            } else {
                currentX = this.wireNodes[this.currentWireId][this.wireNodes[this.currentWireId].length - 1].x;
                currentY = y;
            }
            const newNodeId = `node_${this.wireNodeIdCounter++}`;
            this.wireNodes[this.currentWireId].push({ type: "node", id: newNodeId, port: 0, x: currentX, y: currentY });

            const nodeOne = this.wireNodes[this.currentWireId][this.wireNodes[this.currentWireId].length - 2];
            const nodeTwo = this.wireNodes[this.currentWireId][this.wireNodes[this.currentWireId].length - 1];
            const wireId = `wired_${eventManager.blockManager.idCounter++}`;
            const wire = this.wireTemplate(wireId, nodeOne.x, nodeOne.y, nodeTwo.x, nodeTwo.y);
            toolboxGrid.appendChild(wire);

            if (!Array.isArray(this.wires[this.currentWireId])) {
                this.wires[this.currentWireId] = [];
            }
            this.wires[this.currentWireId].push(wireId);
            document.getElementById(this.currentWireId).remove();
        }
    }


    escapeWire(event) {
        this.wireDrawing = false;
        this.deleteWirePart(this.currentWireId);
        this.deleteWire(this.currentWireId);
        this.currentWireId = null;
    }

    deleteWirePart(wireId) {
        const wire = document.getElementById(wireId);
        if (wire) {
            wire.remove();
        }
        delete this.wireNodes[wireId];
    }

    deleteWire(wireId) {
        if (Array.isArray(this.wires[wireId])) {
            this.wires[wireId].forEach(wireSvgId => {
                const wireSvg = document.getElementById(wireSvgId);
                if (wireSvg) {
                    wireSvg.remove();
                }
            });
        }

        delete this.wires[wireId];
        delete this.wireNodes[wireId];
    }

    searchWireConnectionForBlock(blockId) {
        let nodeIds = [];
        const entries = Object.entries(this.wireNodes);
        for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];
            const inputNode = value[0];
            const outputNode = value[value.length - 1];
            if (inputNode.id === blockId || outputNode.id === blockId) {
                nodeIds.push(key);
            }
        }
        return nodeIds;
    }


    getWireNodes() {
        return JSON.parse(JSON.stringify(this.wireNodes));
    }
}

export { WireManager };