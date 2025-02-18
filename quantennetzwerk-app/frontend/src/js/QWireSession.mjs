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
     * @param {SVGElement} parent 
     */
    constructor(parent) {
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
    }

    findSessionByWire(wire_id) {
        for (const session of this.sessions) {
            for (const wire of session.wires) {
                if (wire.id === wire_id) {
                    return session;
                }
            }
        }
        return null;
    }

    findSessionByQbit(qbit_id) {
        for (const session of this.sessions) {
            if (session.qbit_start.id === qbit_id || session.qbit_end.id === qbit_id) {
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
        return session;
    }

    endSession(qbit) {
        const session = this.sessions[this.nextId - 1];
        session.qbit_end = qbit;
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
        for (const session of this.sessions) {
            for (const wire of session.wires) {
                wire.place(this.parent);
            }
        }
    }

    placeCurrentWire() {
        if (this.currentWire) {
            this.currentWire.place(this.parent);
        }
    }

    destroySession(session){
        if(this.sessions.session){
            session.wires.forEach(wire => {
                wire.element.remove();
            });
            session = null;
        }
    }


}

const qWireSession = new QWireSession();
export default qWireSession;