/**
 * Hier kommen alle actions zusammen und werden an die entsprechenden Funktionen und Klassen weitergeleitet
 */
// ActionHandler.js
import globalEvents from './EventEmitter.mjs';
import { toolState } from './toolState.mjs';
import QBlock from './QBlock.mjs';
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
        console.log("startWire (ActionHandler)", portId, event);
         if (event.button !== 0) return; // Nur linke Maustaste

        const parts = portId.split("_");
        const blockId = parts[0] === "klasse" ? parts[1] : parts[0]; // Korrekte Block-ID
        const type = parts[1]; // "input" oder "output"
        const index = parseInt(parts[2]);


          if (type === "output") { // Nur von Outputs starten!
            startPortIndex = index;
            isDrawingWire = true;

            // Erstelle ein temporäres Draht-Element (für die Vorschau)
            const startElement = QBlock.getBlockById(blockId).template.querySelector(`#${portId}`);
            const startRect = startElement.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect(); // Deine SVG Zeichenfläche
            const startX = startRect.right - svgRect.left;
            const startY = startRect.top + startRect.height / 2 - svgRect.top;

            // Erstelle einen temporären Pfad für die Vorschau
            const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            tempPath.setAttribute("stroke", "gray"); // Graue Farbe für die Vorschau
            tempPath.setAttribute("stroke-width", "2");
            tempPath.setAttribute("fill", "none");
            tempPath.setAttribute("d", `M ${startX} ${startY} L ${startX} ${startY}`); // Starte am Ausgang
            svg.appendChild(tempPath); // Füge den Pfad zum SVG hinzu

            // Event-Listener für mousemove und mouseup (zum Zeichnen des Drahtes)
            document.addEventListener("mousemove", (event) => {
                if (!isDrawingWire) return;
                const mouseX = event.clientX - svgRect.left;
                const mouseY = event.clientY - svgRect.top;
                tempPath.setAttribute("d", `M ${startX} ${startY} L ${mouseX} ${mouseY}`);
            });
              document.addEventListener("mouseup", (event) => {
                if (!isDrawingWire) return;
                    isDrawingWire = false;
                    tempPath.remove();

                    // Finde heraus, ob wir auf einem gültigen Input gelandet sind
                    const targetElement = document.elementFromPoint(event.clientX, event.clientY); //Sehr hilfreich
                    if (targetElement) {

                        // Extrahiere die Informationen über den Ziel-Input
                        let targetId = targetElement.id;
                        if(!targetId) return; //Kein Ziel

                        let targetParts = targetId.split("_");
                        let targetBlockId = targetParts[0] === "klasse" ? targetParts[1] : targetParts[0];
                        let targetType = targetParts[1];
                        let targetIndex = parseInt(targetParts[2]);

                        if(targetType === "input_hitbox") { //Input-Hitbox angeklickt, also korrigieren
                            targetType = "input";
                            targetIndex = parseInt(targetParts[3]); // Input-Hitboxen haben eine andere ID-Struktur
                        } else if (targetType === "output" && targetId === `<span class="math-inline">\{targetBlockId\}\_output\_hitbox\_</span>{targetIndex}`){
                            targetType = "output";
                        } else if(targetType !== "input"){
                            return; // Ungültiges Ziel: Brich ab, wenn es kein Input ist!
                        }

                        // Stelle sicher, dass die Blöcke unterschiedlich sind (keine Schleifen!)
                        if (startBlockId === targetBlockId) {
                            console.warn("Cannot connect a block to itself.");
                            return; //Verlasse die Funktion
                        }

                        // Versuche, die Verbindung herzustellen
                        const success = QBlock.connectInput(targetBlockId, targetIndex, "tempWireId"); // WICHTIG: Temporäre ID
                        if (success) {
                            // Erstelle den *richtigen* Draht
                            const newWire = new Wire(startBlockId, startPortIndex, targetBlockId, targetIndex);

                            // Aktualisiere die wireId im Zielblock (ersetze die temporäre ID)
                            QBlock.getBlockById(targetBlockId).inputWireIds[targetIndex] = newWire.id;

                        } else {
                            // Verbindung fehlgeschlagen (wahrscheinlich, weil der Input schon belegt ist)
                            console.warn("Connection failed.");
                            // Optional: Zeige eine Fehlermeldung in der UI an
                        }
                    }

            });
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
