/**
 * @module circuit_area
 * @description This module contains the class CircuitArea, which is responsible for the circuit area.
 * This means the background grid and the calculation of the grid coordinates for placing the wires and gates depending on the grid size and offset.
 * This class also contains the event listeners for the circuit area.
 * @requires toolState
 * 
 */

import { toolState } from "./toolState.mjs";

class CircuitArea {
    constructor(circuitAreaElement) {
        this.circuitAreaElement = circuitAreaElement;
        this.svgGrid = this.createGrid();
        this.gridRect = this.svgGrid.querySelector('rect'); // Referenz auf das rect Element speichern
        this.circuitAreaElement.appendChild(this.svgGrid);

        this.adjustGridSize(); // Initial Grid-Größe setzen
        window.addEventListener('resize', this.adjustGridSize.bind(this)); // Event Listener für Fenster-Resize
    }

    createGrid() {
        const toolbox_grid = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        toolbox_grid.setAttribute("id", "toolbox_grid");
        toolbox_grid.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        toolbox_grid.setAttribute("width", "100%"); // Temporär 100%, wird dynamisch angepasst
        toolbox_grid.setAttribute("height", "100%"); // Temporär 100%, wird dynamisch angepasst

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const gridPattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        gridPattern.setAttribute("id", "cross-pattern");
        gridPattern.setAttribute("width", "20");
        gridPattern.setAttribute("height", "20");
        gridPattern.setAttribute("patternUnits", "userSpaceOnUse");

        const gridPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        gridPath.setAttribute("d", "M 10 8 L 10 12 M 8 10 L 12 10");
        gridPath.setAttribute("stroke", "gray");
        gridPath.setAttribute("stroke-width", "1");
        gridPattern.appendChild(gridPath);
        defs.appendChild(gridPattern);
        toolbox_grid.appendChild(defs);

        const gridRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        gridRect.setAttribute("width", "100%"); // Wird dynamisch angepasst
        gridRect.setAttribute("height", "100%"); // Wird dynamisch angepasst
        gridRect.setAttribute("fill", "url(#cross-pattern)");
        toolbox_grid.appendChild(gridRect);

        return toolbox_grid;
    }

    adjustGridSize() {
        const width = this.circuitAreaElement.offsetWidth; // Aktuelle Breite des circuit-area Elements
        const height = this.circuitAreaElement.offsetHeight; // Aktuelle Höhe

        this.svgGrid.setAttribute("width", width + "px"); // SVG Größe anpassen
        this.svgGrid.setAttribute("height", height + "px");
        this.gridRect.setAttribute("width", width + "px"); // rect Größe anpassen
        this.gridRect.setAttribute("height", height + "px");

        console.log(`Gridgröße angepasst: Breite=<span class="math-inline">\{width\}px, Höhe\=</span>{height}px`); // Debug-Ausgabe
    }
}

export { CircuitArea };