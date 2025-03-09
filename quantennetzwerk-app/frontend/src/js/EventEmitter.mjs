// EventEmitter.js (Eigenständiges Modul)
class EventEmitter {
    constructor() {
        this.listeners = {};
    }

    /**
     * 
     * @param {Event} event 
     * @param {Function} listener
     * @description Fügt einen Listener für ein Event hinzu 
     */
    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    /**
     *
     * @param {Event} event
     * @param {Function} listener
     * @description Entfernt einen Listener für ein Event
     */
    off(event, listener) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        }
    }

    /**
     * 
     * @param {Event} event 
     * @param  {...any} args 
     * @description Sendet ein Event an alle Listener
     */
    emit(event, ...args) {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event].forEach(listener => listener(...args));
    }

    /**
     * 
     * @param {Event} listener 
     * @returns {boolean} Gibt zurück, ob ein Listener für ein Event existiert
     * @description Gibt zurück, ob ein Listener für ein Event existiert
     */
    hasListeners(listener) {
        return !!this.listeners[listener];
    }
}

const globalEvents = new EventEmitter(); // Eine globale Instanz, die überall verwendet werden kann
export default globalEvents;