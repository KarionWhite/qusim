/**
 * Hier kommen alle actions zusammen und werden an die entsprechenden Funktionen und Klassen weitergeleitet
 */
// ActionHandler.js
import globalEvents from './EventEmitter.mjs';
import { toolState } from './toolState.mjs';
import QBlock from './QBlock.mjs';
import { circuitArea } from './circuit_area.mjs';
import qWireSession from './QWireSession.mjs';

class ActionHandler {

    static instance = null;

    static circuitAreaOffsetX = 0;
    static circuitAreaOffsetY = 0;
    static blockOffsetX = 370;
    static blockOffsetY = 115;
    static wireOffsetX = 330;
    static wireOffsetY = 55;

    /**
     * 
     * @returns 
     */
    constructor() {
        console.log("Creating new instance of class: " + this);
        this.circuit_area = document.getElementById("circuit-area");  // Hier wird alles eingefügt => Parent div Element
        if (ActionHandler.instance) {
            return ActionHandler.instance;
        }
        ActionHandler.instance = this;
        this.qBlock_tools = toolState.gettools().filter(tool => QBlock.isQBlock(tool));
        this.non_qBlock_tools = toolState.gettools().filter(tool => !QBlock.isQBlock(tool));
        this.draggedQBlock = null;
        this.wiring = false;
        this.wiring_horizontal = false;
        this.selectedWire = null;
        this.wireSessionState = null; //Sicherung der Wire sub Session for Undo

        // Registriere Listener für die Events
        globalEvents.on("startDrag", this.startDrag.bind(this));
        globalEvents.on("startWire", this.startWire.bind(this));
        globalEvents.on("shadowDrag", this.shadowDrag.bind(this));
        globalEvents.on("placeBlock", this.createBlock.bind(this));
        globalEvents.on("wireNodeClick", this.wireNodeClick.bind(this));
        globalEvents.on("wireClick", this.wireClick.bind(this));


        //Registriere ToolState Events
        this.qBlock_tools.forEach(tool => {
            toolState.addEventListener(tool, this.shadowBlock.bind(this));
        });
        this.non_qBlock_tools.forEach(tool => {
            toolState.addEventListener(tool, this.removeShadowBlock.bind(this));
        });

        //Binde Funktionen
        // Event-Handler-Funktionen *einmal* binden
        this.boundDragMove = this.dragMove.bind(this);

        window.addEventListener("resize", this.updateOffsets);
        this.updateOffsets();
    }

    updateOffsets = () => {
        const circuitAreaRect = this.circuit_area.getBoundingClientRect();
        ActionHandler.circuitAreaOffsetX = circuitAreaRect.left;
        ActionHandler.circuitAreaOffsetY = circuitAreaRect.top;
        ActionHandler.blockOffsetX = circuitAreaRect.left +30;
        ActionHandler.blockOffsetY = circuitAreaRect.top +60;
        //ActionHandler.wireOffsetX = circuitAreaRect.left + 50;
        //ActionHandler.wireOffsetY = circuitAreaRect.top + 50;
    }

    removeShadowBlock(event) {
        if (this.shadow) {
            this.shadow.destroy();
        }
    }

    shadowBlock(event) {
        const tool = toolState.getTool();
        if (QBlock.isQBlock(tool)) {
            this.shadow = new QBlock(tool, true);
            this.shadow.place(this.circuit_area, 0, 0);
            document.addEventListener("mousemove", this.shadowDrag.bind(this));
            document.addEventListener("keydown", this.stopshadowDrag.bind(this));
        }
    }

    /**
     * Anders als ein normaler Block, wird der Schattenblock immer an der Mausposition angezeigt.
     * Beim Klicken erstellen wir dann den richtigen Block.
     * Diese Funktion sorgt für die Bewegung des Schattenblocks.
     * @param {*} event 
     */
    shadowDrag(event) {
        const tool = toolState.getTool();
        if (QBlock.isQBlock(tool)) {
            const [gridX, gridY] = circuitArea.getNextGridPoint(event.clientX - ActionHandler.blockOffsetX, event.clientY - ActionHandler.blockOffsetY);
            const x = gridX;
            const y = gridY;
            this.shadow.place(x, y);
        }
    }

    stopshadowDrag(event) {
        if (this.shadow && (event.key === "Escape" || event.code === "Escape") && toolState.getTool() !== "wire") {
            this.shadow.destroy();
            document.removeEventListener("mousemove", this.shadowDrag);
            document.removeEventListener("keydown", this.stopshadowDrag);
            toolState.toSelect();
        }
    }

    createBlock(event) {
        if (event.button !== 0) return; // Nur linke Maustaste
        const [gridX, gridY] = circuitArea.getNextGridPoint(event.clientX - ActionHandler.blockOffsetX, event.clientY - ActionHandler.blockOffsetY);
        const x = gridX;
        const y = gridY;
        //prüfe Hintergrund
        const possibleCollBlock = QBlock.checkCollision(this.shadow);
        if (possibleCollBlock) {
            //change to edit mode
            //toolState.toSelect();
            return;
        }
        const tool = toolState.getTool();
        if (QBlock.isQBlock(tool)) {
            const qblock = new QBlock(tool);
            qblock.place(x, y);
        }
    }

    startDrag(event, id) {
        if (event.button !== 0 || this.wiring || toolState.getTool() === "info") return; // Nur linke Maustaste

        if (this.draggedQBlock === null) {
            this.draggedQBlock = QBlock.getBlockById(id);
            if (!this.draggedQBlock) return;

            this.startDragX = this.draggedQBlock.x;
            this.startDragY = this.draggedQBlock.y;

            this.draggedQBlock.highlight();
            this.mouseOffsetX = event.clientX - this.draggedQBlock.x;
            this.mouseOffsetY = event.clientY - this.draggedQBlock.y;
            // Korrigierte Event-Listener: mousemove und *mouseup*
            document.addEventListener("mousemove", this.boundDragMove);
            document.addEventListener("keydown", this.dragKeydown.bind(this));
            document.addEventListener("dblclick", this.dragKeydown.bind(this));
            event.preventDefault();
        }
        else {
            ActionHandler.__deleteAttachedWires(this.draggedQBlock);
            document.removeEventListener("mousemove", this.dragMove);
            document.removeEventListener("keydown", this.dragKeydown);
            document.removeEventListener("dblclick", this.dragKeydown);
            this.mouseOffsetX = 0;
            this.mouseOffsetY = 0;
            this.draggedQBlock.unhighlight();
            this.draggedQBlock = null;
        }
    }


    dragMove(event) {
        if (this.draggedQBlock) {
            const [gridX, gridY] = circuitArea.getNextGridPoint(event.clientX - this.mouseOffsetX, event.clientY - this.mouseOffsetY);
            const x = gridX + 10;
            const y = gridY + 5;
            this.draggedQBlock.place(this.circuit_area, x, y);
        }
    }


    dragKeydown(event) {
        if ((event.key === "Delete" || event.code === "KeyD" || event.type === "dblclick") && this.draggedQBlock) {
            ActionHandler.__deleteAttachedWires(this.draggedQBlock);
            this.draggedQBlock.unhighlight();
            this.draggedQBlock.destroy(this.circuit_area);
            document.removeEventListener("mousemove", this.dragMove);
            document.removeEventListener("keydown", this.dragKeydown);
            document.removeEventListener("dblclick", this.dragKeydown);
            this.mouseOffsetX = 0;
            this.mouseOffsetY = 0;
            this.draggedQBlock = null;
        }
        if ((event.key === "Escape" || event.code === "Escape") && this.draggedQBlock) {
            this.draggedQBlock.unhighlight();
            this.draggedQBlock.place(this.circuit_area, this.startDragX, this.startDragY);
            document.removeEventListener("mousemove", this.dragMove);
            document.removeEventListener("keydown", this.dragKeydown);
            document.removeEventListener("dblclick", this.dragKeydown);
            this.mouseOffsetX = 0;
            this.mouseOffsetY = 0;
            this.draggedQBlock = null;
        }
    }

    startWire(event, portId) { //Muss noch angepasst werden
        if (event.button !== 0 && this.draggedQBlock === null && !toolState.getTool() === "info") return; // Nur linke Maustaste
        if (this.wiring_horizontal) { //Wir müssen Horizontal starten und enden.
            this.wiring_horizontal = true;
        }
        toolState.toWire();
        const [type, blockIdnum, portnum] = portId.split("_");
        const block = QBlock.getBlockById(blockIdnum);
        if (!block) {
            console.error(`Block with id ${blockIdnum} not found with ${portId}`);
            return;
        }
        let [x, y] = block.getQBlockPortPosition(portId, this.circuit_area.scrollLeft, this.circuit_area.scrollTop);
        [x, y] = circuitArea.getNextGridPoint(x - ActionHandler.circuitAreaOffsetX, y - ActionHandler.circuitAreaOffsetY);
        console.log(`Start Wire at Port: ${portId} with event: ${event.type} at x: ${x} and y: ${y}`)
        this.mouseOffsetX = event.clientX - ActionHandler.circuitAreaOffsetX;
        this.mouseOffsetY = event.clientY - ActionHandler.circuitAreaOffsetY;
        if (!this.wiring) {
            this.wiring = true;
            qWireSession.startSession(portId);
            if (type === "input") {
                this.wiring_input = true;
                qWireSession.newshadowWire(x, y, [-1, 0]);
                QBlock.connectInput(blockIdnum, portnum, qWireSession.currentWire.id);
            } else if (type === "output") {
                this.wiring_input = false;
                qWireSession.newshadowWire(x, y, [1, 0]);
                QBlock.connectOutput(blockIdnum, portnum, qWireSession.currentWire.id);
            }
            qWireSession.placeCurrentWire();
            document.addEventListener("mousemove", this.boundWireDrawing);
            document.addEventListener("mouseup", this.changeWireDirection);
            document.addEventListener("keydown", this.wiringKeydown);
        } else {
            this.wiring = false;
            this.wiring_horizontal = false;
            document.removeEventListener("mousemove", this.boundWireDrawing);
            document.removeEventListener("mouseup", this.changeWireDirection);
            document.removeEventListener("keydown", this.wiringKeydown);
            if (type === "input") {
                QBlock.connectInput(blockIdnum, portnum, qWireSession.currentWire.id);
            } else if (type === "output") {
                QBlock.connectOutput(blockIdnum, portnum, qWireSession.currentWire.id);
            }
            qWireSession.shadow2wire();
            qWireSession.endSession(portId);
            toolState.toSelect();
        }
    }

    boundWireDrawing = (event) => {
        const [gridX, gridY] = circuitArea.getNextGridPoint(
            event.clientX - ActionHandler.circuitAreaOffsetX - this.mouseOffsetX - 10,
            event.clientY - ActionHandler.circuitAreaOffsetY - this.mouseOffsetY - 10);
        let x = gridX + 10;
        let y = gridY + 10;
        if (this.wiring_horizontal) {
            y = 0;
        } else {
            x = 0;
        }
        qWireSession.shadowFollow([x, y]);
    }

    changeWireDirection = (event) => {
        if (event.type === "mouseup" && event.button !== 0) return; // Nur linke Maustaste
        let newdirection = [0, 0];
        if (this.wiring_horizontal) {
            this.wiring_horizontal = false;
            this.mouseOffsetX = event.clientX - ActionHandler.circuitAreaOffsetX + 10; //keine Ahnung warum das +10 sein muss
            newdirection = [0, 1];
        } else {
            this.wiring_horizontal = true;
            this.mouseOffsetY = event.clientY - ActionHandler.circuitAreaOffsetY;
            newdirection = [1, 0];
        }
        const x = qWireSession.currentWire.x + qWireSession.currentWire.direction[0];
        const y = qWireSession.currentWire.y + qWireSession.currentWire.direction[1];

        /**
         * Tolle Idee aber sehr buggy
        const possibleX = x + ActionHandler.blockOffsetX;
        const possibleY = y + ActionHandler.blockOffsetY;
        console.log(`Change Wire Direction a possibleX: ${possibleX} and possibleY: ${possibleY}`);
        const portID = QBlock.hitInputOutput(possibleX, possibleY);
        if (portID) {
            console.log(`Hit at Port: ${portID}`);
            document.getElementById(portID).click();
            return;
        }
        */

        qWireSession.shadow2wire()
        qWireSession.newshadowWire(x, y, newdirection);
        qWireSession.placeCurrentWire();
    }



    wireNodeClick(event, wireId) {
        console.log(`Wire Node Clicked: ${wireId}`);
        if (event.button !== 0) return; // Nur linke Maustaste
        //TODO: Implementieren der Drag Funktion für Wire Nodes
    }

    wireClick = (event, wireId) => {
        console.log(`wireClick: ${wireId}`);
        if (event.button !== 0) return; // Nur linke Maustaste
        if (toolState.getTool() === "info") {
            const clicked_session = qWireSession.findSessionByWire(wireId.split("_")[1]);
            if (this.selectedWire !== null && this.selectedWire.id !== clicked_session.id) {
                qWireSession.unhighlightSession(this.selectedWire);
                this.selectedWire = clicked_session;
                qWireSession.highlightSession(clicked_session);
                return;
            } else if (this.selectedWire !== null && this.selectedWire === clicked_session) {
                qWireSession.unhighlightSession(clicked_session);
                this.selectedWire = null;
                return;
            }
            qWireSession.highlightSession(clicked_session);
            this.selectedWire = clicked_session;
            return;
        }
        toolState.toWire();


    }

    wiringKeydown = (event) => {
        if (event.key === "Escape" || event.code === "Escape") {
            this.wiring = false;
            document.removeEventListener("mousemove", this.boundWireDrawing);
            document.removeEventListener("mouseup", this.changeWireDirection);
            document.removeEventListener("wiringKeydown", this.wiringKeydown);
            const currentWireSession = qWireSession.sessions[qWireSession.currentSessionID];
            if (currentWireSession.qbit_start !== null) {
                ActionHandler.__diconnectWire(currentWireSession.qbit_start);
            }
            if (currentWireSession.qbit_end !== null) {
                ActionHandler.__diconnectWire(currentWireSession.qbit_end);
            }
            qWireSession.destroySession(qWireSession.currentSessionID);
            toolState.toSelect();
        }
    };

    wireKeydown = (event, wireId) => {
        if (toolState.getTool() !== "wire") return; // Nur wenn ich im Wire Tool bin
        if (this.selectedWire === null) return; // Nur wenn ich eine Wire ausgewählt habe
        if (event.key === "Delete" || event.code === "KeyD") {

        } else if (event.key === "Escape" || event.code === "Escape") {
            this.selectedWire.unhighlight();
            this.selectedWire = null;
            toolState.toSelect();
        }
    }

    static __diconnectWire(QBlock_Port) {
        const [, blockId, portnum] = QBlock_Port.split("_");
        const block = QBlock.getBlockById(blockId);
        if (!block) {
            console.error(`Block with id ${blockId} not found with ${QBlock_Port}`);
            return;
        }
        if (QBlock_Port.includes("input")) {
            QBlock.disconnectInput(blockId, portnum);
        } else if (QBlock_Port.includes("output")) {
            QBlock.disconnectOutput(blockId, portnum);
        }
    }

    static __deleteAttachedWires(qBlock) {
        const inputs = qBlock.inputWireIds;
        const outputs = qBlock.outputWireIds;
        for (const input of inputs) {
            if(!input)continue;
            const session = qWireSession.sessions[qWireSession.findSessionByWire(input)];
            if (!session) continue;
            const qStart = session.qbit_start;
            const qEnd = session.qbit_end;
            if (qStart !== null) {
                ActionHandler.__diconnectWire(qStart);
            }
            if (qEnd !== null) {
                ActionHandler.__diconnectWire(qEnd);
            }
            qWireSession.destroySession(session.id);
        }
        for (const output of outputs) {
            if(!output)continue;
            const session = qWireSession.sessions[qWireSession.findSessionByWire(output)];
            if (!session) continue;
            const qStart = session.qbit_start;
            const qEnd = session.qbit_end;
            if (qStart !== null) {
                ActionHandler.__diconnectWire(qStart);
            }
            if (qEnd !== null) {
                ActionHandler.__diconnectWire(qEnd);
            }
            qWireSession.destroySession(session.id);
        }
    }

    static getInstance() {
        if (ActionHandler.instance) {
            return ActionHandler.instance;
        }
        return new ActionHandler();
    }
}

const actionHandler = new ActionHandler(); // Instanz erstellen *außerhalb* der Klasse
export default actionHandler;
