/**
 * @module ActionWatcher
 * @description Will register Actions and list them in a table.	So that we can implement a undo/redo function.
 */
import globalEvents from "./EventEmitter.mjs";


class ActionWatcher {

    REGISTERED_ACTIONS = {
        ActionTaken: "actionTaken",
        GetUndo: "getUndo",
        GetRedo: "getRedo",
        CanUndo: "canUndo",
        CanRedo: "canRedo"
    }

    EMMITED_ACTIONS = {
        ActionRegistered: "actionRegistered",
        UndoAction: "undoAction",
        RedoAction: "redoAction"
    }

    constructor(){
        this.actions = [];
        this.currentAction = -1;    // -1 means no action
        this.maxActions = -1;       // With undo we will reduce currentAction but will not about the maxActions for redo

        globalEvents.on(this.REGISTERED_ACTIONS.ActionTaken, this.actionTaken);
        globalEvents.on(this.REGISTERED_ACTIONS.GetUndo, this.getUndo);
        globalEvents.on(this.REGISTERED_ACTIONS.GetRedo, this.getRedo);
        globalEvents.on(this.REGISTERED_ACTIONS.CanUndo, this.canUndo);
        globalEvents.on(this.REGISTERED_ACTIONS.CanRedo, this.canRedo);
    }

    /**
     * 
     * @param {string} action Die Aktion die ausgeführt wurde 
     * @param {object} data  Der Zustand vor der Aktion zu dem man zurückkehren möchte
     * @description Sollte aufgerufen werden, wenn eine Aktion ausgeführt wurde, die rückgängig gemacht werden kann.
     * Es bietet dem globalen EventEmitter an, dass eine Aktion ausgeführt wurde unter "actionRegistered".
     * Binde diese Aktion ein, wenn du eine Quit befor Save Funktion implementierst oder so...
     * Aber auch das Eingrauen der Redo und Undo Funktionen können so verkraut werden. 
     */
    actionTaken = (action, data) => {
        if (this.currentAction < this.actions.length - 1) {    
            this.actions.splice(this.currentAction + 1, this.actions.length - (this.currentAction + 1));
        }
        this.actions.push({ action: action, data: data });
        this.currentAction++;
        this.maxActions = this.currentAction;
        globalEvents.emit(this.EMMITED_ACTIONS.ActionRegistered, this.actions[this.currentAction]);
    }

    /**
     * 
     * @returns {object} Die letzte Aktion, die ausgeführt wurde
     * @description Gibt die letzte Aktion zurück, die ausgeführt wurde.
     * Sollte aufgerufen werden, wenn eine Aktion rückgängig gemacht werden soll.
     * Es bietet dem globalen EventEmitter an, dass eine Aktion
     * rückgängig gemacht werden soll unter "undoAction".
     */
    getUndo = () => {
        if(this.currentAction >= 0){
            const undoAction = this.actions[this.currentAction]
            this.currentAction--;
            globalEvents.emit(this.EMMITED_ACTIONS.UndoAction, undoAction);
            return undoAction;
        }
        return null;
    }

    /**
     * 
     * @returns {object} Die nächste Aktion, die ausgeführt wurde
     * @description Gibt die nächste Aktion zurück, die ausgeführt wurde.
     * Sollte aufgerufen werden, wenn eine Aktion wiederholt werden soll.
     * Es bietet dem globalen EventEmitter an, dass eine Aktion
     * wiederholt werden soll unter "redoAction".
    */
    getRedo = () => {
        if(this.currentAction < this.maxActions){
            this.currentAction++;
            globalEvents.emit(this.EMMITED_ACTIONS.RedoAction, this.actions[this.currentAction]);
            return this.actions[this.currentAction]
        }
        return null;
    }

    /**
     * 
     * @returns {boolean} Ob eine Aktion rückgängig gemacht werden kann
     * @description Gibt zurück, ob eine Aktion rückgängig gemacht werden kann.
     */
    canUndo = () => {
        return this.currentAction >= 0;
    }

    /**
     * 
     * @returns {boolean} Ob eine Aktion wiederholt werden kann
     * @description Gibt zurück, ob eine Aktion wiederholt werden kann.
     */
    canRedo = () =>{
        return this.currentAction < this.maxActions;
    }

    /**
     * 
     * @returns {object} Die Liste aller Aktionen
     * @description Gibt die Liste aller Aktionen zurück, die in globaleEvent gecalled werden können. 
     */
    getEmittedActions = () => {
        return this.EMMITED_ACTIONS;
    }


    /**
     * 
     * @returns {object} Die Liste aller registrierten Aktionen
     * @description Gibt die Liste aller registrierten Aktionen zurück, die in globaleEvent gecalled werden können. 
     */
    getRegisteredActions = () => {
        return this.REGISTERED_ACTIONS;
    }

};

const actionWatcher = new ActionWatcher();
export default actionWatcher;