import globalEvents from "./EventEmitter.mjs";

/**
 * QWire class
 * @class QWire
 * @property {number} id - ID of the wire
 * 
 * 
 * Tipps for understanding the code:
 * If you look at QBlock.mjs, you will see the name scheme for the input and output ports.
 * We will use those ports as a node for the wire, as starting and ending points.
 */


export default class QWire {

    static wirings = {}; // {id: QWire};
    static nextId = 1;

    /**
     * Erstellt eine SVG-Grafik für eine Drahtverbindung
     * @param {number} id
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2
     * @param {boolean} shadow 
     */
    static wireTemplate(id, x1, y1, x2, y2, shadow = false) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("id", 'wire_' + id);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("id", 'wire_path' + id);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "black");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
        g.appendChild(path);
        if (shadow) {
            path.setAttribute("stroke", "gray");
            path.setAttribute("stroke-width", "4");
            path.setAttribute("stroke-opacity", "0.5");
            return g;
        }
        //Erstellung der Wire-Hitbox 20px breit bzw. hoch (je nach Richtung) und 20px Abstand zum Ende des Pfades
        let hx1, hy1, width, height;
        if (x1 === x2) {
            hx1 = x1 - 10;
            width = 20;
            hy1 = y1 < y2 ? y1 : y2 + 10;
            height = Math.abs(y1 - y2) - 20;
        } else {
            hy1 = y1 - 10;
            height = 20;
            hx1 = x1 < x2 ? x1 : x2 + 10;
            width = Math.abs(x1 - x2) - 20;
        }
        const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        hitbox.setAttribute("id", 'wire_hitbox' + id);
        hitbox.setAttribute("x", hx1);
        hitbox.setAttribute("y", hy1);
        hitbox.setAttribute("width", width);
        hitbox.setAttribute("height", height);
        hitbox.setAttribute("fill", "none");
        hitbox.setAttribute("stroke", "black");
        hitbox.setAttribute("stroke-width", "20");
        hitbox.setAttribute("stroke-opacity", "0");
        if (globalEvents.hasListeners("wire_click")) {
            hitbox.addEventListener("click", () => {
                globalEvents.emit("wire_click", id);
            });
        } else {
            console.warn("No listener for wire_click in globalEvents");
        }
        g.appendChild(hitbox);
    }

    static createSchadow(x1, y1, x2, y2) {
        if (document.getElementById("shadow_wire")) document.getElementById("shadow_wire").remove();
        return QWire.wireTemplate("ShadowWire", x1, y1, x2, y2, true);
    }

    static startingShadow(x,y){}

    /**
     * QWire constructor
     */
    constructor(x1, y1, x2, y2) {
        /**
         * @type {number}
         */
        this.id = QWire.nextId++;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.shadow = false;
        this.svg = QWire.wireTemplate(this.id, x1, y1, x2, y2, this.shadow);
        QWire.wirings[this.id] = this;

    }
}