/**
 * @module QWireSession
 * @description
 * A class representing a session of a quantum wire.
 * It will simplify the functions needed to handel events and data for a wire.
 */
import QWire from "./QWire.mjs";

class QWireSession {

    static qWireSession = null;

    /**
     * one session is created for each connection between two qubits
     * {id,qbit_start, qbit_end, wires}
     * id: unique id not for the dom but for the session
     * highest id is the newest session
     * qbit_start: the qbit port where the wire starts
     * qbit_end: the qbit port where the wire ends
     * wires: array of wires that are part of the session
     * session is needed for saving, loading, undo, redo
     */


    /**
     * 
     */
    constructor() {
        if(!QWireSession.qWireSession){
            QWireSession.qWireSession = this;
        }
        this.parent = document.getElementById("toolbox_grid");
        this.sessions = {};
        this.nextId = 1;
        /**
         * @type QWire
         */
        this.currentWire = null;
        this.currentSessionID = null;
    }


    findSessionByWire(wire_id) {
        for (const session in this.sessions) {
            if(!this.sessions[session])continue;
            const wires = this.sessions[session].wires;
            if(!wires)continue;
            for (const wire of wires) {
                if (wire.id == wire_id) {
                    return session;
                }
            }
        }
        return null;
    }

    getWireById(wire_id) {
        for (const session in this.sessions) {
            if(!this.sessions[session])continue;
            const wires = this.sessions[session].wires;
            if(!wires)continue;
            for (const wire of wires) {
                if (wire.id == wire_id) {
                    return wire;
                }
            }
        }
        return null;
    }

    findSessionByQbit(qbit_id) {
        for (const session in this.sessions) {
            if (session.qbit_start.id === qbit_id || session.qbit_end.id === qbit_id) {
                return session;
            }
        }
        return null;
    }

    findSessionByConnectedQBlock(qblock_id) {
        const [, qblock] = qblock_id.split("_");
        for (const session in this.sessions) {
            const [qbit_start, qbit_end] = this.sessionInOut(session);
            const [, qbit_start_id,] = qbit_start.id.split("_");
            const [, qbit_end_id,] = qbit_end.id.split("_");
            if (qblock === qbit_start_id || qblock === qbit_end_id) {
                return session;
            }
        }
        return null;
    }

    startSession(qbit) {
        const session = {};
        session.id = this.nextId++;
        session.qbit_start = qbit;
        session.wires = [];
        session.qbit_end = null;
        this.sessions[session.id] = session;
        this.currentSessionID = session.id;
        return session;
    }

    endSession(qbit) {
        const session = this.sessions[this.nextId - 1];
        session.qbit_end = qbit;
        this.currentSessionID = null;
    }

    newWire(x, y, direction) {
        const wire = new QWire(x, y, direction);
        this.sessions[this.sessions.length - 1].wires.push(wire);
    }

    newshadowWire(x, y, direction) {
        const wire = new QWire(x, y, direction, true);
        this.currentWire = wire;
    }

    shadowFollow(direction) {
        if (this.currentWire) {
            this.currentWire.changeDirection(this.parent, direction);
        }
    }

    shadow2wire() {
        if (this.currentWire) {
            const wire = this.currentWire.shadow2wire(this.parent);
            this.currentWire = null;
            this.sessions[this.nextId-1].wires.push(wire);
        }
    }

    placeWires() {
        for (const session in this.sessions) {
            const mySession = this.sessions[session];
            if(!mySession)continue;
            const sessionWires = mySession.wires;
            for (const wire of sessionWires) {
                wire.place(this.parent);
            }
        }
    }

    placeCurrentWire() {
        if (this.currentWire) {
            this.currentWire.place(this.parent);
        }
    }

    sessionInOut(session){
        if(this.sessions.session){
            return [this.sessions.session.qbit_start, this.sessions.session.qbit_end];
        }
        return [null, null];
    }

    highlightSession(session){
        const mySession = this.sessions[session];
        if(mySession){
            mySession.wires.forEach(wire => {
                wire.highlight();
            });
        }
    }

    unhighlightSession(session){
        const mySession = this.sessions[session];
        if(mySession){
            mySession.wires.forEach(wire => {
                wire.unhighlight();
            });
        }
    }

    selectSession(session){
        const mySession = this.sessions[session];
        if(mySession){
            mySession.wires.forEach(wire => {
                wire.selected();
            });
        }
    }

    unselectSession(session){
        const mySession = this.sessions[session];
        if(mySession){
            mySession.wires.forEach(wire => {
                wire.unselected();
            });
        }
    }

    destroySession(session){
        if(this.sessions[session]){
            this.sessions[session].wires.forEach(wire => {
                wire.remove(this.parent);
            });
            this.sessions[session] = null;
        }
        if(!this.currentWire)return;
        this.currentWire.remove(this.parent);
        this.currentWire = null;
    }

    destroyAllSessions(){
        for (const session in this.sessions) {
            this.destroySession(session);
        }
    }

    forSave(){
        const save = {};
        for (const sessionID in this.sessions) {
            const session = this.sessions[sessionID];
            if(!session)continue;
            if(session.qbit_end === null || session.qbit_start === null){
                continue;
            }
            save[sessionID] = {
                qbit_start: session.qbit_start,
                qbit_end: session.qbit_end,
                wires: []
            };
            for (const wire of session.wires) {
                if(wire.shadow)continue;
                save[sessionID].wires.push(wire.forSave());
            }
        }
        return save;
    }

    load(save){
        for (const sessionID in save) {
            const session = save[sessionID];
            this.sessions[sessionID] = {
                qbit_start: session.qbit_start,
                qbit_end: session.qbit_end,
                wires: [],
                id: sessionID
            };
            for (const wire of session.wires) {
                this.sessions[sessionID].wires.push(new QWire(wire.x, wire.y, wire.direction,false,true,wire.id));
            }
        }
        this.placeWires();
    }

    restoreSession(session){
        //Check for ID collision -> Should not happen but better safe than sorry
        if(this.sessions[session.id]){
            return;
        }
        this.sessions[session.id] = session;
        this.placeWires();
    }

}

const qWireSession = new QWireSession();
export default qWireSession;