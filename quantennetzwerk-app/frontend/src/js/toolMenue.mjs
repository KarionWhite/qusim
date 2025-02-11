import { toolState } from "./toolState.mjs";

class ToolMenue {

    constructor() {
        console.log("Creating new instance of class: " + this);
        this.buttons = Array.from(toolState.gettoolElements()).map(element => document.getElementById(element.id));
        this.buttons.forEach(button => button.addEventListener('click', this.click.bind(this)));
        toolState.gettools().forEach(tool => toolState.addEventListener(tool, this.highlightButton.bind(this)));
        toolState.gettools().forEach(tool => toolState.addEventListener(tool, this.unhighlightButton.bind(this), true));
        for (let button of this.buttons){
            if (button.id === "tool_select"){
                button.click();
                break;
            }
        }
    }

    click(event) {
        const button = event.target;
        const tool = button.id.slice(5);
        toolState[`to${tool.charAt(0).toUpperCase() + tool.slice(1)}`]();
    }

    highlightButton(toolName) {
        const button = document.getElementById(`tool_${toolName}`);
        if (button) {
            button.classList.add("active");
        }
    }

    unhighlightButton(toolName) {
        const button = document.getElementById(`tool_${toolName}`);
        if (button) {
            button.classList.remove("active");
        }
    }
}

export const toolMenue = new ToolMenue();