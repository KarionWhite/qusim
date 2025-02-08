import { toolState } from "./toolState.mjs";

class ToolMenue {

    constructor() {
        console.log("Creating new instance of class: " + this);
        //Wir hohlen und die buttons aus dem HTML
        this.buttons = Array.from(toolState.gettoolElements()).map(element => document.getElementById(element.id));
        //Wir fügen jedem Button einen EventListener hinzu
        this.buttons.forEach(button => button.addEventListener('click', this.click.bind(this)));
        //Wir fügen jedem Button das Event "highlightButton" hinzu für jedes Tool
        toolState.gettools().forEach(tool => toolState.addEventListener(tool, this.highlightButton.bind(this)));
        //Wir fügen jedem Button das Event "unhighlightButton" hinzu für jedes Tool
        toolState.gettools().forEach(tool => toolState.addEventListener(tool, this.unhighlightButton.bind(this), true));
        for (let button of this.buttons){
            if (button.id === "tool_select"){
                button.click();
                break;
            }
        }
    }

    click(event) {
        //Wir hohlen uns den Button, der geklickt wurde
        const button = event.target;
        //Wir hohlen uns den Namen des Buttons
        const tool = button.id.slice(5);
        //Wir setzen den ToolState auf den geklickten Button
        toolState[`to${tool.charAt(0).toUpperCase() + tool.slice(1)}`]();
    }

    highlightButton(toolName) {
        const button = document.getElementById(`tool_${toolName}`);
        if (button) {
            button.classList.add("active"); // Button hervorheben
        }
    }

    // NEU: Funktion zum Deaktivieren der Button-Hervorhebung
    unhighlightButton(toolName) {
        const button = document.getElementById(`tool_${toolName}`);
        if (button) {
            button.classList.remove("active"); // Button-Hervorhebung entfernen
        }
    }
}

export const toolMenue = new ToolMenue();