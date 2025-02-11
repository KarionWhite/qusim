// EventEmitter.js (Eigenständiges Modul)
class EventEmitter {
    constructor() {
        this.listeners = {};
    }

    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    off(event, listener) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        }
    }

    emit(event, ...args) {
        if (!this.listeners[event]) {
            console.warn(`Event "${event}" has no listeners.`);
            return;
        }
        this.listeners[event].forEach(listener => listener(...args));
    }

    hasListeners(listener) {
        return !!this.listeners[listener];
    }
}

const globalEvents = new EventEmitter(); // Eine globale Instanz, die überall verwendet werden kann
export default globalEvents;