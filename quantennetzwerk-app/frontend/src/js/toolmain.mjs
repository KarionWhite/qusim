/**
 * Main entry point for the frontend application.
 * 
 */

import { toolState } from "./toolState.mjs";
import {CircuitArea} from "./circuit_area.mjs";
import {toolMenue} from "./toolMenue.mjs";

addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    const doc_circuitArea = document.getElementById('circuit-area');
    new CircuitArea(doc_circuitArea);
});