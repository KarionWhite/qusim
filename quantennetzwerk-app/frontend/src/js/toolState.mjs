

const toolElements = document.querySelectorAll('[id^="tool_"]');
const tools = Array.from(toolElements).map(element => element.id.slice(5));

class ToolState {

    toolState_instance = null;

    constructor(){
        console.log("Creating new instance of class: " + this);
        if (ToolState.toolState_instance) {
            return ToolState.toolState_instance;
        }
        this.last_tool = "";
        this.tool = "select";
        this.events = {};   // {tool: [callback, ...], ...}
        this.leaveEvents = {}; // {tool: [callback, ...], ...}
        ToolState.toolState_instance = this;
        
        tools.forEach(toolName => {
            this[`to${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`] = function() {
                this.last_tool = this.tool;
                this.tool = toolName;
                this._fireleaveEvents(this.last_tool);
                this._fireEvents(toolName);
            };
        });
    }

    /**
     * Function to add an event listener for a specific tool.
     * @param {String} tool Name of the selected tool, e.g.: "select" or "drawLine". 
     * @param {function} callback Function to be called when the tool is selected. 
     * @param {boolean} leave If true, the event will be fired when the state is left, e.g. when selecting another tool. 
     * @returns {void}} callback 
     */
    addEventListener(tool, callback, leave = false) {
        if(!leave) {
            if (!(tool in this.events)) {
                this.events[tool] = [];
            }
            this.events[tool].push(callback);
        } else {
            if (!(tool in this.leaveEvents)) {
                this.leaveEvents[tool] = [];
            }
            this.leaveEvents[tool].push(callback);
        }
    }

    /**
     * Function to get all event listeners for a specific tool.
     * @param {String} tool Name of the selected tool, e.g.: "select" or "drawWire".
     * @returns {Array[Array, Array]} Array of event listeners for the selected tool. 0 = events, 1 = leaveEvents.
     * If there are no event listeners for the selected tool, an empty array will be returned.
     * @description This is useful if you just want to remove one event listener for a specific tool.
     * You take the array of event listeners, remove the one you want to remove, and then set the array of event listeners again.
     */
    getEventListeners(tool) {
        ev = this.events[tool];
        le = this.leaveEvents[tool];
        return [ev, le];
    }

    /**
     * Function to remove an event listener for a specific tool.
     * @param {String} tool Name of the selected tool, e.g.: "select" or "drawLine".         
    */
    removeEventListener(tool) {
        delete this.events[tool];
        delete this.leaveEvents[tool];
    }
    
    /**
     * Function to check whether there are any listeners registered for a specific tool name.
     * @returns {boolean}. 
     */
    hasEventListeners() { 
        for (let key in this.events) {
            if (this.events.hasOwnProperty(key)) {
                return true;
            }
        }
    };
    
    /**
     * @private
     * Inner function to fire an event for a specific tool.
     * @param {String} tool 
     */
    _fireEvents(tool) {
        if (tool in this.events) {
            this.events[tool].forEach(callback => callback(tool));
        }
    }

    /**
     * @private
     * Inner function to fire an event for a specific tool when deselecting it again after selecting another one.
     * @param {String} tool 
     */
    _fireleaveEvents(tool) {
        if (tool in this.leaveEvents) {
            this.leaveEvents[tool].forEach(callback => callback(tool));
        }
    }

    getTool() {
        return this.tool;
    }

    /**
     * 
     * @returns {Array} returns the tool names as an array, e.g.: ["select", "Wire"]
     */
    gettools() {
        return tools;
    }

    /**
     * 
     * @returns {NodeList} toolElements
     */
    gettoolElements() {
        return toolElements;
    }

    static getInstance() {
        if (!ToolState.toolState_instance) {
            ToolState.toolState_instance = new ToolState();
        }
        return ToolState.toolState_instance;
    }
};

/**@type {ToolState}*/
const toolState = ToolState.getInstance();

export { toolState };