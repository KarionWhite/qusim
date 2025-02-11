/**
 * Hier kommen alle actions zusammen und werden an die entsprechenden Funktionen und Klassen weitergeleitet
 */
// ActionHandler.js
import globalEvents from './EventEmitter.mjs';
import { toolState } from './toolState.mjs';
import QBlock from './QBlock.mjs';

class ActionHandler {

    static instance = null;

    static blockOffsetX = 0;
    static blockOffsetY = 0;

    constructor() {
        if (ActionHandler.instance) {
            return ActionHandler.instance;
        }
        ActionHandler.instance = this;

        // Registriere Listener für die Events
        globalEvents.on("startDrag", this.dragndrop.bind(this));
        globalEvents.on("startWire", this.startWire.bind(this));

        //Registriere ToolState Events
        
    }

    shadowBlock(event) {
        const tool = toolState.getTool();
        if(QBlock.isQBlock(tool) && event.type === "mousemove"){
            QBlock.createShadowBlock(tool, event.clientX, event.clientY);
        }
    }

    createBlock(event){
        const tool = toolState.getTool();
        if(QBlock.isQBlock(tool)){
            QBlock.createBlock(tool, event.clientX, event.clientY);
        }
    }

    startDrag(event, id) { // Umbenannt: startDrag
        if (event.button !== 0) return; // Nur linke Maustaste

        if (this.draggedElement === null) {
            // 1. Klick: Element auswählen
            this.draggedElement = QBlock.getBlockById(id).template;
            this.offsetX = event.clientX - this.draggedElement.getBoundingClientRect().left;
            this.offsetY = event.clientY - this.draggedElement.getBoundingClientRect().top;

            document.addEventListener("mousemove", this.dragMove);
            document.addEventListener("mousedown", this.endDrag); // mousedown statt mouseup!
            event.preventDefault();

        } else if (this.draggedElement === QBlock.getBlockById(id).template) {
            // 2. Klick: Element ablegen (nur wenn es dasselbe Element ist!)
            this.endDrag(event); // Aufruf der Methode
        } //else: Klick auf ein anderes Element -> ignorieren
    }


    dragMove(event) {
        if (this.draggedElement) {
            let x = event.clientX - this.offsetX;
            let y = event.clientY - this.offsetY;
            this.draggedElement.setAttribute("transform", `translate(${x}, ${y})`);

            // Wire-Updates (wie vorher, aber mit 'this.')
            const blockId = this.draggedElement.id.replace("klasse_","");
            const block = QBlock.getBlockById(blockId);
            if (block) {
                //Inputs
                for (let i = 0; i < block.inputWireIds.length; i++) {
                    if (block.inputWireIds[i] !== null) {
                        if (wires[block.inputWireIds[i]]) {
                            wires[block.inputWireIds[i]].updateWire();
                        }
                    }
                }
                //Outputs
                for (let i = 0; i < block.outputWireIds.length; i++) {
                    if (block.outputWireIds[i] !== null) {
                        if (wires[block.outputWireIds[i]]) {
                            wires[block.outputWireIds[i]].updateWire();
                        }
                    }
                }
            }
        }
    }

    endDrag(event) { // Umbenannt: endDrag
        if (this.draggedElement) {
            document.removeEventListener("mousemove", this.dragMove);
            document.removeEventListener("mousedown", this.endDrag); // mousedown entfernen

            this.draggedElement = null;
            this.offsetX = 0;
            this.offsetY = 0;
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
