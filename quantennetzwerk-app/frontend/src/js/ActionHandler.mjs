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
        ActionHandler.blockOffsetX = circuitAreaRect.left + 50;
        ActionHandler.blockOffsetY = circuitAreaRect.top + 50;
        //ActionHandler.wireOffsetX = circuitAreaRect.left + 50;
        //ActionHandler.wireOffsetY = circuitAreaRect.top + 50;
    }

    removeShadowBlock(event) {
        if(this.shadow){
            this.shadow.remove();
            document.removeEventListener("mousemove", this.shadowDrag);
        }
    }

    shadowBlock(event) {
        const tool = toolState.getTool();
        if(QBlock.isQBlock(tool)){
            this.shadow = QBlock.createShadowBlock(tool);
            this.circuit_area.appendChild(this.shadow);
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
        if(QBlock.isQBlock(tool)){
            const shadowBlock = this.shadow;
            if(shadowBlock){
                const [gridX, gridY] = circuitArea.getNextGridPoint(event.clientX - ActionHandler.blockOffsetX, event.clientY - ActionHandler.blockOffsetY);
                shadowBlock.style.transform = `translate(${gridX + 10}px, ${gridY + 5}px)`;
            }
        }
    }

    stopshadowDrag(event) {
        if(this.shadow && (event.key === "Escape" || event.code === "Escape")){
            this.shadow.remove();
            document.removeEventListener("mousemove", this.shadowDrag);
            document.removeEventListener("keydown", this.stopshadowDrag);
            toolState.toSelect();
        }
    }

    createBlock(event){
        if(event.button !== 0) return; // Nur linke Maustaste
        const [gridX, gridY] = circuitArea.getNextGridPoint(event.clientX - ActionHandler.blockOffsetX, event.clientY - ActionHandler.blockOffsetY);
        const x = gridX + 10;
        const y = gridY + 5;   
        //prüfe Hintergrund
        const possibleCollBlock = QBlock.checkCollision(this.shadow);
        if(possibleCollBlock){
            //change to edit mode
            //toolState.toSelect();
            return;
        }
        const tool = toolState.getTool();
        if(QBlock.isQBlock(tool)){
            const qblock = new QBlock(tool);
            qblock.place(this.circuit_area, x, y);
        }
    }

    startDrag(event, id) {
        if (event.button !== 0) return; // Nur linke Maustaste
    
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
            const x = gridX +10;
            const y = gridY +5;   
            this.draggedQBlock.place(this.circuit_area,x, y);
        }
    }


    dragKeydown(event) {
        if ((event.key === "Delete" || event.code === "KeyD" || event.type === "dblclick") && this.draggedQBlock) {
            this.draggedQBlock.unhighlight();
            this.draggedQBlock.destroy(this.circuit_area);
            document.removeEventListener("mousemove", this.dragMove);
            document.removeEventListener("keydown", this.dragKeydown);
            document.removeEventListener("dblclick", this.dragKeydown);
            this.mouseOffsetX = 0;
            this.mouseOffsetY = 0;
            this.draggedQBlock = null;
        }
        if((event.key === "Escape" || event.code === "Escape") && this.draggedQBlock){
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
        if (event.button !== 0) return; // Nur linke Maustaste
        if(this.wiring_horizontal){ //Wir müssen Horizontal starten und enden.
            this.wiring_horizontal = true;
        }
        toolState.toWire();
        const [type,blockIdnum,portnum] = portId.split("_");
        const block = QBlock.getBlockById(blockIdnum);
        if (!block) {
            console.error(`Block with id ${blockIdnum} not found with ${portId}`);   
            return;
        }
        let [x,y] = block.getQBlockPortPosition(portId, this.circuit_area.scrollLeft, this.circuit_area.scrollTop);
        [x,y] = circuitArea.getNextGridPoint(x - ActionHandler.circuitAreaOffsetX, y - ActionHandler.circuitAreaOffsetY);
        console.log(`Start Wire at Port: ${portId} with event: ${event.type} at x: ${x} and y: ${y}`)
        this.mouseOffsetX = event.clientX - ActionHandler.circuitAreaOffsetX;
        this.mouseOffsetY = event.clientY - ActionHandler.circuitAreaOffsetY;
        if(!this.wiring){
            this.wiring = true;
            qWireSession.startSession(this, portId);
            if(type === "input"){
                this.wiring_input = true;
                qWireSession.newshadowWire(x, y, [-1,0]);
                QBlock.connectInput(blockIdnum, portnum,qWireSession.currentWire.id);
            }else if(type === "output"){
                this.wiring_input = false;
                qWireSession.newshadowWire(x, y, [1,0]);
                QBlock.connectOutput(blockIdnum, portnum,qWireSession.currentWire.id);
            }
            qWireSession.placeCurrentWire();
            document.addEventListener("mousemove", this.boundWireDrawing);
            document.addEventListener("mouseup", this.changeWireDirection);
        }else{
            this.wiring = false;
            document.removeEventListener("mousemove", this.boundWireDrawing);
            document.removeEventListener("mouseup", this.changeWireDirection);
            if(type === "input"){
                QBlock.connectInput(blockIdnum, portnum,qWireSession.currentWire.id);
            }else if(type === "output"){
                QBlock.connectOutput(blockIdnum, portnum,qWireSession.currentWire.id);
            }
            qWireSession.shadow2wire();
            qWireSession.endSession(this, portId);
            toolState.toSelect();
        }
    }

    boundWireDrawing = (event) => {
        const [gridX, gridY] = circuitArea.getNextGridPoint(
            event.clientX - ActionHandler.circuitAreaOffsetX - this.mouseOffsetX - 10,
            event.clientY - ActionHandler.circuitAreaOffsetY - this.mouseOffsetY - 10);
        let x = gridX + 10;
        let y = gridY + 10;
        if(this.wiring_horizontal){
            y = 0;
        }else{
            x = 0;
        }
        qWireSession.shadowFollow([x,y]);
    }

    changeWireDirection = (event) => {
        if(event.type === "mouseup" && event.button !== 0) return; // Nur linke Maustaste
        let newdirection = [0,0];
        if(this.wiring_horizontal){
            this.wiring_horizontal = false;
            this.mouseOffsetX = event.clientX - ActionHandler.circuitAreaOffsetX + 10; //keine Ahnung warum das +10 sein muss
            newdirection = [0,1];
        }else{
            this.wiring_horizontal = true;
            this.mouseOffsetY = event.clientY - ActionHandler.circuitAreaOffsetY;
            newdirection = [1,0];
        }
        const x = qWireSession.currentWire.x + qWireSession.currentWire.direction[0];
        const y = qWireSession.currentWire.y + qWireSession.currentWire.direction[1];

        //Treffe ich auf einen In-/Output?
        console.log(`Change Wire Direction at x: ${x} and y: ${y}`);
        const portID = QBlock.hitInputOutput(x,y);
        if(portID){
            document.getElementById(portID).click();
            return;
        }
        qWireSession.shadow2wire()
        qWireSession.newshadowWire(x,y,newdirection);
        qWireSession.placeCurrentWire();
    }

    wireNodeClick(event, wireId) {
        console.log(`Wire Node Clicked: ${wireId}`);
        if (event.button !== 0) return; // Nur linke Maustaste
        if (this.wiring) {
            qWireSession.shadow2wire();
            qWireSession.endSession(this, wireId);
            this.wiring = false;
            document.removeEventListener("mousemove", this.boundWireDrawing);
            document.removeEventListener("mouseup", this.changeWireDirection);
            toolState.toSelect();
        }
    }

    wireClick(event, wireId) {
        console.log(`wireClick: ${wireId}`);
        if (event.button !== 0) return; // Nur linke Maustaste
        if (this.wiring) {
            qWireSession.shadow2wire();
            qWireSession.endSession(this, wireId);
            this.wiring = false;
            document.removeEventListener("mousemove", this.boundWireDrawing);
            document.removeEventListener("mouseup", this.changeWireDirection);
            toolState.toSelect();
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
