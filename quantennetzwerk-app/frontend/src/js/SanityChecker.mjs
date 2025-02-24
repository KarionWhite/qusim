import QBlock from "./QBlock.mjs";
import qWireSession from "./QWireSession.mjs";
import globalEvents from "./EventEmitter.mjs";



/**
 * @class SanityChecker
 * @classdesc Überprüft die Konsistenz des Quantennetzwerks.
 * Alle Checks können über globalEvents ausgelöst werden.
 * @constructor Benutze getInstance() um die Instanz zu erhalten
 * @method check Überprüft die Konsistenz des Quantennetzwerks
 * @method checkWire Überprüft die Konsistenz der QWireSession
 * @property {QBlock} qBlock Das QBlock-Objekt
 * @property {QWireSession} qWireSession Das QWireSession-Objekt
 * 
 * @description
 * Ein gutes Netzwerk ist eins, wo alle Eingänge korrekt verbunden sind.
 * Es darf keine unverbundenen Eingänge geben.
 * Es darf keine Eingänge geben, die mehrfach verbunden sind.
 * Es darf keine Eingänge geben, die mit sich selbst verbunden sind.
 * Es darf keine Eingänge geben, die mit einem anderen Eingang verbunden sind.
 * Es darf keine Eingänge geben, die mit einem Ausgang des gleichen QBlocks verbunden sind.
 * Es darg keine Ausgänge geben, die mit einem anderen Ausgang verbunden sind.
 * Es darf keine Ausgänge geben, die mit einem Eingang des gleichen QBlocks verbunden sind.
 * Ausgänge können offen sein.
 * Alles muss mit einem QInput anfangen.
 * Es darf nur ein Measurment geben.
 */

class SanityChecker {
    
    static instance = null;
    
    constructor() {
        if (SanityChecker.instance) {
            return SanityChecker.instance;
        }
        globalEvents.on("sanityCheck", this.check);
        globalEvents.on("sanityCheckWire", this.checkWire);
    }


    checkWire = (QWireSessionID) => {};

    /**
     * Wir hohlen uns die angeschlossenen QBlocks und überprüfen, ob die Verbindungen korrekt sind.
     * @param {String|number} wireID 
     * @returns {Array[QBlock]} Gibt die QBlocks zurück, die mit dem Wire verbunden sind 
     */
    getQFlowWire = (wireID) => {
        const qFlow = [];
        const wire = qWireSession.findSessionByWire(wireID);
        if(!wire){  //unwahrscheinlich aber gut zu prüfen
            console.error("Wire not found");
            return [];
        }
        const wireSession = qWireSession.sessions[wire];
        if(!wireSession){ //unwahrscheinlich aber gut zu prüfen
            console.error("WireSession not found");
            return [];
        }
        const qBlockStart = wireSession.qbit_start;
        const qBlockEnd = wireSession.qbit_end;
        if(qBlockStart){
            qFlow.push(qBlockStart);
        }
        if(qBlockEnd){
            qFlow.push(qBlockEnd);
        }
        return qFlow;
    };

    getQFlowBlock = (qBlockPort) => {
        /**
         * qBlockPort = "input/output_qBlockID_Port"
            */
        let wire = null;
        const [direction, qBlockID, port] = qBlockPort.split("_");
        const qBlock = QBlock.getBlockById(qBlockID);
        if(!qBlock){
            console.error("QBlock not found");
            return [];
        }
        if(direction === "input"){
            return qBlock.inputWireIds[port]
        }

        return qBlock.outputWireIds[port];
    };

    check = () => {
        console.log("Sanity Check");
        let qBlocks = JSON.parse(JSON.stringify(QBlock.blocks));
        let qWires = JSON.parse(JSON.stringify(qWireSession.sessions));

        let qInputs = [];
        for(const qBlock in qBlocks){
            if(qBlocks[qBlock].type === "QInput"){
                qInputs.push(qBlock);
            }
        }
        const usedBlocks = {};
        const usedWires = {};
        const correctFlow = {};
        let next_input = 0;
        let currentBlock = qInputs[next_input++];
        correctFlow[currentBlock] = []; //Block, Wire, Block, Wire, Block, Wire, Block,...
        let currentWire = null;
        //Circularity check
        while(currentBlock || currentWire){
            if(currentBlock){
                if(usedBlocks[currentBlock]){
                    this.pop_error("Block already used! There is a loop in the network!", [currentBlock]);
                    return;
                }
                currentWire = this.getQFlowBlock(currentBlock);
                usedBlocks[currentBlock] = true;
                correctFlow[currentBlock].append(currentBlock);
                currentBlock = null;
                if(!currentWire){
                    currentBlock = qInputs[next_input++];   //Nächster Input, weil mit dem aktuellen Flow fertig
                }
            };
            if(currentWire){
                if(usedWires[currentWire]){
                    this.pop_error("Wire already used! There is a loop in the network!", [currentWire]);
                    return;
                }
                currentBlock = this.getQFlowWire(currentWire)[1];   //Der zweite Block ist der Endblock
                correctFlow[currentBlock].append(currentWire);
                usedWires[currentWire] = true;
                currentWire = null;
            }
        };
        //Check if all blocks are used
        let unusedBlocks = [];
        for(const block in qBlocks){
            if(qBlocks[block]){
                unusedBlocks.push(block);
            }
        }
        if(unusedBlocks.length > 0){
            this.pop_error("There are unused blocks in the network!", unusedBlocks);
            return;
        }
        //Check wires for input, output scheme
        for(const wire in qWires){
            const [startBlock, endBlock] = this.getQFlowWire(wire);
            //null check
            if(!startBlock || !endBlock){
                pop_error("Wire not connected correctly!", [wire]);
                return;
            }
            const [startType, startBlockID, startPort] = startBlock.split("_");
            const [endType, endBlockID, endPort] = endBlock.split("_");
            //input ouput check
            if(startType === "output" && endType === "output" || startType === "input" && endType === "input"){
                this.pop_error("Wire not connected correctly!", [wire]);
                return;
            }
            //check circularity
            if(startBlock === endBlock){
                this.pop_error("Wire not connected correctly!", [wire]);
                return;
            }
        }
    }

    pop_error = (message, data) => {
        console.error(message);
        globalEvents.emit("sanityError", {message, data});
    };    

    static getInstance() {
        if (!SanityChecker.instance) {
            SanityChecker.instance = new SanityChecker();
        }
        return SanityChecker.instance;
    }
}

const sanityChecker = SanityChecker.getInstance();
export default sanityChecker;