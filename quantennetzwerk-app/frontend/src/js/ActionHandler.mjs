/**
 * Hier kommen alle actions zusammen und werden an die entsprechenden Funktionen und Klassen weitergeleitet
 */
// ActionHandler.js
import globalEvents from './EventEmitter.mjs';
import { toolState } from './toolState.mjs';
import QBlock from './QBlock.mjs';
import QWire from './QWire.mjs';
import { circuitArea } from './circuit_area.mjs';

class ActionHandler {

    static instance = null;

    static blockOffsetX = 350 +20;
    static blockOffsetY = 95 +20;

    /**
     * 
     * @returns 
     */
    constructor() {
        this.circuit_area = document.getElementById("circuit-area");  // Hier wird alles eingefügt => Parent div Element
        if (ActionHandler.instance) {
            return ActionHandler.instance;
        }
        ActionHandler.instance = this;
        this.qBlock_tools = toolState.gettools().filter(tool => QBlock.isQBlock(tool));
        this.non_qBlock_tools = toolState.gettools().filter(tool => !QBlock.isQBlock(tool));
        this.draggedQBlock = null;

        // Registriere Listener für die Events
        globalEvents.on("startDrag", this.startDrag.bind(this));
        globalEvents.on("startWire", this.startWire.bind(this));
        globalEvents.on("shadowDrag", this.shadowDrag.bind(this));
        globalEvents.on("placeBlock", this.createBlock.bind(this));

        //Registriere ToolState Events
        this.qBlock_tools.forEach(tool => {
            toolState.addEventListener(tool, this.shadowBlock.bind(this));
        });
        this.non_qBlock_tools.forEach(tool => {
            toolState.addEventListener(tool, this.removeShadowBlock.bind(this));
        });

        //Binde Funktionen
        // Event-Handler-Funktionen *einmal* binden
        this.boundDragMove = this.dragMove.bind(this);;
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
                const [gridX, gridY] = circuitArea.getNextGridPoint(event.clientX, event.clientY);
                shadowBlock.style.transform = `translate(${gridX - ActionHandler.blockOffsetX}px, ${gridY - ActionHandler.blockOffsetY}px)`;
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
        const [gridX, gridY] = circuitArea.getNextGridPoint(event.clientX, event.clientY);
        const x = gridX - ActionHandler.blockOffsetX;
        const y = gridY - ActionHandler.blockOffsetY;   
        //prüfe Hintergrund
        const possibleCollBlock = QBlock.checkCollision(this.shadow);
        if(possibleCollBlock){
            //change to edit mode
            toolState.toSelect();
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
        console.log(`Start Wire at Port: ${portId} with event: ${event.type}`)
        if(this.shadowWire === null || this.shadowWire === undefined){
            
            this.shadowWire = QWire.createSchadow()
        }
    }

    getQBlockPortPosition(portID){
        
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
