import { BlockManager } from "./BlockManager.mjs";
import { WireManager } from "./WireManager.mjs";
import { go_post } from "./go_post.mjs";

const task_has_changed = {
    "task": "has_changed",
    "data": {
        "HasChanged": true
    }
};


class EventManager {
    constructor() {
        this.blockManager = new BlockManager( 
            (event, id) => this.dragndrop(event, id), 
            (element, x, y) => this.setRasterElement(element, x, y), 
            () => (event, id) => this.wireManager.startWire(event, id), 
            () => this.hasChanged() 
        );
        this.wireManager = new WireManager( 
            (x, y) => this.getNearestRasterPoint(x, y),
            (element, x, y) => this.setRasterElement(element, x, y),
            () => this.hasChanged(), 
            (tool) => this.toolButtonClicked(tool),
            () => this.blockManager.idCounter 
        );
        this.activeTool = "select";
        this.activeShadow = null;
        this.buttonIds = [
            "select", "wire", "qinput", "identity", "hadamard",
            "pauli_x", "pauli_y", "pauli_z", "cnot", "swap",
            "toffoli", "fredkin", "measure", "xgate"
        ];
        this.onersTemplates = ["qinput", "identity", "hadamard", "pauli_x", "pauli_y", "pauli_z", "measure"];
        this.tworsTemplates = ["cnot", "swap"];
        this.threersTemplates = ["toffoli", "fredkin"];
        this.xgateTemplateName = "xgate"; 
        this.toolboxGrid = document.getElementById("toolbox_grid");
        this.currentlyDragging = null; 

        this.setupEventListeners();
        this.resetButtons(); 
    }

    hasChanged() {
        let k = go_post(task_has_changed);  // Sendet an den Server, dass sich etwas geändert hat
        console.log(k);
    }

    resetButtons() {
        const buttons = document.getElementsByClassName("tool_button");
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].classList.remove("active");
        }
    }

    toolButtonClicked(tool) {
        this.activeTool = tool;
        this.resetButtons();
        document.getElementById("tool_" + tool).classList.add("active");
        this.activeShadow = null;
        if (document.getElementById("qshadow") !== null) {
            document.getElementById("qshadow").remove();
        }
        if (this.onersTemplates.includes(tool)) {
            this.activeShadow = this.blockManager.shadowoneTemplate("qshadow");
        } else if (this.tworsTemplates.includes(tool)) {
            this.activeShadow = this.blockManager.shadowtwoTemplate("qshadow");
        } else if (this.threersTemplates.includes(tool)) {
            this.activeShadow = this.blockManager.shadowthreeTemplate("qshadow");
        } else if (tool === this.xgateTemplateName) {
            this.activeShadow = this.blockManager.shadowXgateTemplate("qshadow", 1, 1); // Assuming shadowXgateTemplate is in BlockManager
        }
        return () => {
            console.log("Tool: " + tool);
        };
    }

    keydownlistener(event) {
        if (event.key === "Escape") {
            if (this.buttonIds.slice(2).includes(this.activeTool)) {
                if (document.getElementById("qshadow") !== null) {
                    document.getElementById("qshadow").remove();
                }
                document.getElementById("tool_select").click();
            }
            if (this.currentlyDragging !== null) {
                document.getElementById("tool_select").click();
            }
            if (this.wireManager.currentWireId !== null) {
                this.wireManager.escapeWire(event);
            }
        }
        if (event.key === "Delete") {
            if (this.currentlyDragging !== null) {
                this.blockManager.deleteTemplate(this.currentlyDragging);
                this.currentlyDragging = null; // Reset dragging after delete
            }
        }
    }

    setRasterElement(element, x, y) {
        const raster = 20;
        const x_offset = -30;
        const y_offset = -35;
        element.setAttribute("transform", `translate(${x_offset + Math.round(x / raster) * raster},${y_offset + Math.round(y / raster) * raster})`);
    }

    getNearestRasterPoint(x, y) {
        const raster = 20;
        const x_offset = -30;
        const y_offset = -35;
        return [x_offset + Math.round(x / raster) * raster, y_offset + Math.round(y / raster) * raster];
    }

    mouseDebugWindowTemplate(x, y) {
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
        let [rx, ry] = this.getNearestRasterPoint(x, y);
        text.textContent = `${rx} ${ry}`;
        g.appendChild(text);

        return g;
    }

    mouseDebug(event) {
        if (document.getElementById("mouse_debug_window") !== null) {
            document.getElementById("mouse_debug_window").remove();
        }
        this.toolboxGrid.appendChild(this.mouseDebugWindowTemplate(event.offsetX, event.offsetY));
    }

    dragndrop(event, id) {
        document.getElementById("tool_select").click();
        if (event.type === "mousemove") {
            const x = event.offsetX;
            const y = event.offsetY;
            this.setRasterElement(document.getElementById(this.currentlyDragging), x, y);
        } else if (event.type === "mousedown" && this.currentlyDragging === id) {
            let [x, y] = this.blockManager.getElementPosition(document.getElementById(this.currentlyDragging));
            this.blockManager.updateBlockPosition(this.currentlyDragging, x, y);
            this.currentlyDragging = null;
            this.hasChanged();
        } else if (event.type === "mousedown" && this.currentlyDragging === null) {
            this.currentlyDragging = id;
        }
    }

    selectToolAction(x, y) {
        console.log("Select-Tool Action at:", x, y);
        // Add select tool specific logic here if needed, like selecting blocks
    }

    placeTemplateAction(x, y) {
        if (this.activeTool !== "select" && this.activeTool !== "wire") {
            this.blockManager.placeTemplate(this.activeTool, x, y, this.toolboxGrid);
            this.hasChanged();
        }
    }

    handleMousemove(event) {
        if (this.activeTool === "select") {
            if (this.currentlyDragging !== null) {
                this.dragndrop(event, null);
            }
        } else if (this.activeTool === "wire") {
            this.wireManager.drawWire(event, this.toolboxGrid);
        } else if (this.activeShadow === null && this.activeTool !== "select" && this.activeTool !== "wire") {
            this.toolboxGrid.appendChild(this.activeShadow = this.activeShadow || this.createActiveShadow());
        } else if (this.activeShadow && this.activeTool !== "select" && this.activeTool !== "wire") {
            this.setRasterElement(this.activeShadow, event.offsetX, event.offsetY);
        }
        this.mouseDebug(event);
    }

    createActiveShadow() {
        if (this.onersTemplates.includes(this.activeTool)) {
            return this.blockManager.shadowoneTemplate("qshadow");
        } else if (this.tworsTemplates.includes(this.activeTool)) {
            return this.blockManager.shadowtwoTemplate("qshadow");
        } else if (this.threersTemplates.includes(this.activeTool)) {
            return this.blockManager.shadowthreeTemplate("qshadow");
        } else if (this.activeTool === this.xgateTemplateName) {
            return this.blockManager.shadowXgateTemplate("qshadow", 1, 1);
        }
        return null; // Or a default shadow if needed
    }


    handleMousedown(event) {
        const x = event.offsetX;
        const y = event.offsetY;
        if (event.button === 0) { // Left mouse button
            if (this.activeTool === "select") {
                this.selectToolAction(x, y);
            } else if (this.activeTool === "wire" && this.wireManager.wireDrawing) {
                this.wireManager.drawWire(event, this.toolboxGrid);
            } else {
                this.placeTemplateAction(x, y);
            }
        }
    }

    setupEventListeners() {
        this.buttonIds.forEach(id => {
            document.getElementById(`tool_${id}`).addEventListener("click", () => this.toolButtonClicked(id));
        });
        document.addEventListener("keydown", (event) => this.keydownlistener(event));
        this.toolboxGrid.addEventListener("mousemove", (event) => this.handleMousemove(event));
        this.toolboxGrid.addEventListener("mousedown", (event) => this.handleMousedown(event));
    }
}

let eventManager = new EventManager();


addEventListener("DOMContentLoaded", () => {
    // No direct event listeners here, they are set up in EventManager constructor
});


export const getBlocks = () => eventManager.blockManager.getBlocks();
export const getWireNodes = () => eventManager.wireManager.getWireNodes();