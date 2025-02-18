/**
 * @module QWire
 * @description
 * A class representing a wire in the quantum network.
 * 
 */

import globalEvents from "./EventEmitter.mjs";

export default class QWire {
    static nextId = 1;
    static wires = [];
    /**
     * This static method creates a wire template for the given direction and length.
     * @param {number} x the position of the wire on its horizontal axis in pixels from left to right (x-axis)
     * @param {number} y the position of the wire on its vertical axis in pixels from top to bottom (y-axis)
     * @param {Array[number, number]} direction the direction of the wire as an array of two numbers. 
     * @returns {SVGElement} a wire template
     */
    static wireTemplate(id, x,y, direction, shadow=false){
        const wireID = `wire_${id}`;
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x);
        line.setAttribute("y1", y);
        line.setAttribute("x2", x + direction[0] - 1);
        line.setAttribute("y2", y + direction[1]);
        line.setAttribute("stroke", "black");
        line.setAttribute("stroke-width", 2);
        line.setAttribute("id", wireID);

        if(shadow){
            return [line];
        }

        const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hitbox.setAttribute("x", x - 10);
        hitbox.setAttribute("y", y - 10);
        hitbox.setAttribute("width", 20);
        hitbox.setAttribute("height", 20);
        hitbox.setAttribute("fill", "transparent");
        hitbox.setAttribute("stroke", "transparent");
        hitbox.setAttribute("id", `hitbox_${id}`);
        if(globalEvents.hasListeners("wireNodeClick")){
            hitbox.addEventListener("click", (event) => {
                globalEvents.emit("wireNodeClick",event, wireID);
            });
        }else{
            console.log("no listeners for wireNodeClick");
        }

        const hitbox2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        hitbox2.setAttribute("x1", x);
        hitbox2.setAttribute("y1", y);
        hitbox2.setAttribute("x2", x + direction[0]);
        hitbox2.setAttribute("y2", y + direction[1]);
        hitbox2.setAttribute("stroke", "transparent");
        hitbox2.setAttribute("stroke-width", 20);

        hitbox2.setAttribute("id", `hitbox2_${id}`);
        if(globalEvents.hasListeners("wireClick")){
            hitbox2.addEventListener("click", (event) => {
                globalEvents.emit("wireClick", event,wireID);
            });
        }else{
            console.log("no listeners for wireClick");
        }
        return [line,hitbox,hitbox2];
    }

    /**
     * @constructor
     * @param {number} x the position of the wire on its horizontal axis in pixels from left to right (x-axis)
     * @param {number} y the position of the wire on its vertical axis in pixels from top to bottom (y-axis)
     * @param {Array[number, number]} direction the direction of the wire as an array of two numbers. 
     */
    constructor(x, y, direction,shadow=false) {
        this.id = QWire.nextId++;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.element = QWire.wireTemplate(this.id, x, y, direction);
        this.shadow = shadow;
    }

    /**
     * @param {SVGElement} parent 
     */
    place(parent){
        parent.appendChild(this.element[0]);
        if(!this.shadow){
            parent.appendChild(this.element[2]);
            parent.appendChild(this.element[1]);
        }    
    }

    remove(parent){
        parent.removeChild(this.element[0]);
        if(!this.shadow){
            parent.removeChild(this.element[1]);
            parent.removeChild(this.element[2]);
        }
    }

    /**
     * This method moves the wire to the given position.
     * @param {HTMLElement} parent the parent element to which the wire is to be appended
     * @param {number} x the new position of the wire on its horizontal axis in pixels from left to right (x-axis)
     * @param {number} y the new position of the wire on its vertical axis in pixels from top to bottom (y-axis)
     */
    moveTo(parent,x,y){
        this.remove(parent);
        this.x = x;
        this.y = y;
        this.element = QWire.wireTemplate(this.id, this.x, this.y, this.direction, this.shadow);
        this.place(parent);
    }

    /**
     * This method changes the direction of the wire. AKA length
     * @param {HTMLElement} parent the parent element to which the wire is to be appended
     * @param {Array[number, number]} direction the new direction of the wire as an array of two numbers.
     */
    changeDirection(parent,direction){
        this.remove(parent);
        this.direction = direction;
        this.element = QWire.wireTemplate(this.id, this.x, this.y, this.direction, this.shadow);
        this.place(parent);
    }

    shadow2wire(parent){
        this.shadow = false;
        this.element = QWire.wireTemplate(this.id, this.x, this.y, this.direction, this.shadow);
        this.place(parent);
        return this;
    }
};