/**
 * @module infoHandler
 * Hier werden wir uns um die Ergebnisser der Quanten Simulationen kümmern.
 * Es soll ein Fenster beim überhovern über die einzelnen Bausteine erscheinen, 
 * wenn eine erfolgreiche Simulation durchgeführt wurde.
 */
import QBlock from "./QBlock.mjs";
import globalEvents from "./EventEmitter.mjs";
import { circuitArea } from "./circuit_area.mjs";

class InfoHandler {
    infoHansler = null;
    
    static createTextElement = (text, x, y) => {
        const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textElement.setAttribute("x", x + 5);
        textElement.setAttribute("y", y + 15);
        textElement.setAttribute("font-size", 12);
        textElement.setAttribute("fill", "black");
        textElement.innerHTML = text;
        return textElement;
    }

    static infoHandlerTemplate = (text,x,y) => {
        let elements = [];
        const texts = text.split("<br>");
        let maxTextLength = 0;

        for (let i = 0; i < texts.length; i++) {
            elements.push(InfoHandler.createTextElement(texts[i], x, y + i * 15));
            if (texts[i].length > maxTextLength) {
                maxTextLength = texts[i].length;
            }
        }
        
        const infoBox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        infoBox.setAttribute("x", x);
        infoBox.setAttribute("y", y);
        infoBox.setAttribute("width", maxTextLength * 6 + 15);
        infoBox.setAttribute("height", texts.length * 15 + 10);
        infoBox.setAttribute("fill", "white");
        infoBox.setAttribute("stroke", "black");
        infoBox.setAttribute("stroke-width", 1);
        elements.splice(0, 0, infoBox);
        
        return elements;
    }

    port2ID = (port) => {
        const splitted = port.split("_");
        if (splitted.length > 1) {
            return splitted[1];
        }
        return null;
    }

    constructor() {
        this.toolboxGrid = document.getElementById("toolbox_grid");
        this.circuit_area = document.getElementById("circuit-area"); 
        globalEvents.on("infoHover", this.showInfo);
        globalEvents.on("infoUnhover", this.unshowInfo);
        this.data = null;
    }

    getOffset = () => {
        const circuitAreaRect = this.circuit_area.getBoundingClientRect();
        const xOff = circuitAreaRect.left - 20;
        const yOff = circuitAreaRect.top - 20;
        return [xOff, yOff];
    }

    setData = (data) => {
        this.data = data;
        this.cleanData(data);
    }

    cleanData = (data) => {
        if (data.measurement_counts){ //Messung an einem Messblock
            for (const key in data.measurement_counts) { 
                const id = this.port2ID(key);
                if (id) {
                    if(!this.data[id]){
                        this.data[id] = {}
                    }
                    let counts = data.measurement_counts[key];
                    counts = counts.split("{")[1].split("}")[0].split(",");
                    if(counts.length > 0){
                        this.data[id]["measurement_counts"] = {};
                    }
                    for (const count of counts) {
                        const [key, value] = count.split(":");
                        this.data[id]["measurement_counts"][key] = value
                    }
                }
            }
        }
        if (data.wavefunctions){
            for (const key in data.wavefunctions) {
                const id = this.port2ID(key);
                if (id) {
                    if(!this.data[id]){
                        this.data[id] = {}
                    }
                    this.data[id]["wavefunctions"] = [];
                    let wavefunction = data.wavefunctions[key];
                    wavefunction = wavefunction.split("[")[1].split("]")[0].split(",");
                    for(const wf of wavefunction){
                        this.data[id]["wavefunctions"].push(wf);
                    }
                }
            }
        }
    }



    placeInfoBox = (infoBox) => {
        if (this.infoBox) {
            this.infoBox.forEach(element => {
                this.toolboxGrid.removeChild(element);
            });
        }
        this.infoBox = infoBox;
        infoBox.forEach(element => {
            this.toolboxGrid.appendChild(element);
        });
    }

    deleteInfoBox = () => {
        if (this.infoBox) {
            this.infoBox.forEach(element => {
                this.toolboxGrid.removeChild(element);
            });
            this.infoBox = null;
        }
    }

    showInfo = (event, id) => {
        //BlockHover Event
        this.currentBlock = QBlock.getBlockById(id);
        let infoBox = null;
        if (this.currentBlock) {
            const data = this.createInfoBoxData(this.currentBlock);
            const [xOff, yOff] = this.getOffset();
            const [x,y] = circuitArea.getNextGridPoint(event.clientX - xOff, event.clientY - yOff);
            infoBox = InfoHandler.infoHandlerTemplate(data, x, y);
            this.placeInfoBox(infoBox);
        }
    }

    createInfoBoxData = (block) => {
        console.log(this.data);
        if(block.kind === "qinput"){
            return "Input " + block.id + "<br>Constand: |0>";
        }else if(block.kind === "measure"){
            if(!this.data || !(block.id in this.data)){
                return "Measure " + block.id + "<br>No Data";
            }
            let ret = "Measure " + block.id; 
            ret += "<br>Gemessene Eigenschaften: ";
            for (const key in this.data[block.id]["measurement_counts"]) {
                ret += "<br>|" + key.trim() + ">: " + this.data[block.id]["measurement_counts"][key];
            }
            ret += "<br>Wavefunction: " 
            ret += "<br>" + this.data[block.id]["wavefunctions"];
            return ret;
        }else{
            if(!this.data || !(block.id in this.data)){
                return "Block " + block.id + "<br>No Data";
            }
            let ret = "Block " + block.id 
            ret += "<br>Wavefunction: " 
            ret += "<br>" + this.data[block.id]["wavefunctions"];
            return ret;
        }
    }

    unshowInfo = (event, id) => {
        this.deleteInfoBox();
    }
}

const infoHandler = new InfoHandler();
export default infoHandler;