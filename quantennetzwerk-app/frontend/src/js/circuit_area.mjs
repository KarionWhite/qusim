/**
 * @module circuit_area
 * @description Creates a dynamic, scrollable dot grid using an optimized SVG pattern.
 */
class CircuitArea {
    gridSpacing = 20;
    xOffset = 10;
    yOffset = 10;
    patternSize = 500; // Puffer für das Grid

    constructor() {
        this.circuitAreaElement = document.getElementById('circuit-area');
        this.svgGrid = this.createGrid();
        this.circuitAreaElement.appendChild(this.svgGrid);

        window.addEventListener('resize', this.adjustGrid.bind(this));
        this.circuitAreaElement.addEventListener('scroll', this.adjustGrid.bind(this), { passive: true });
        this.adjustGrid(); // Initiales Grid
        this.circuitAreaElement.addEventListener("click", (event) => {
            if(event.button === 0) {
                const [gridX, gridY] = this.getNextGridPoint(event.clientX, event.clientY);
                console.log(`Click at ${gridX}, ${gridY}`);
            }
        });
    }

    createGrid() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("id", "toolbox_grid");
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        pattern.setAttribute("id", "dot-pattern");
        pattern.setAttribute("width", this.gridSpacing);
        pattern.setAttribute("height", this.gridSpacing);
        pattern.setAttribute("patternUnits", "userSpaceOnUse");

        // Kreis zentriert IM PATTERN
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", this.gridSpacing / 2); //  Mittelpunkt
        circle.setAttribute("cy", this.gridSpacing / 2);
        circle.setAttribute("r", 1.5);
        circle.setAttribute("fill", "gray");
        pattern.appendChild(circle); // Kreis zum PATTERN hinzufügen

        defs.appendChild(pattern);
        svg.appendChild(defs);

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		//Setze den Offset des Rechtecks.
        rect.setAttribute("x", this.xOffset);
        rect.setAttribute("y", this.yOffset);
        rect.setAttribute("fill", "url(#dot-pattern)");
        svg.appendChild(rect);
        this.gridRect = rect;

        return svg;
    }

    adjustGrid() {
        const width = this.circuitAreaElement.clientWidth + this.circuitAreaElement.scrollLeft + this.patternSize;
        const height = this.circuitAreaElement.clientHeight + this.circuitAreaElement.scrollTop + this.patternSize;

        this.svgGrid.setAttribute("width", width + "px");
        this.svgGrid.setAttribute("height", height + "px");
        this.gridRect.setAttribute("width", width + "px");
        this.gridRect.setAttribute("height", height + "px");
    }


    getNextGridPoint(x, y) {
        const scrollLeft = this.circuitAreaElement.scrollLeft;
        const scrollTop = this.circuitAreaElement.scrollTop;

        const gridX = Math.round((x + scrollLeft - this.xOffset) / this.gridSpacing) * this.gridSpacing + this.xOffset;
        const gridY = Math.round((y + scrollTop - this.yOffset) / this.gridSpacing) * this.gridSpacing + this.yOffset;

        return [gridX, gridY];
    }
}

const circuitArea = new CircuitArea();
export { circuitArea };