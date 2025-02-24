import { go_post_event, go_get_event} from './go_com.mjs';
import globalEvents from './EventEmitter.mjs';
import project from './Project.mjs';

class Navbar {

    static instance = null;

    constructor() { 
        if (Navbar.instance) {
            return Navbar.instance;
        }else{
            Navbar.instance = this;
        }
        this.main_container = document.getElementById("main-container");
        this.create_Project = document.getElementById("create_project");
        this.open_Project = document.getElementById("open_project");
        
        this.create_Project.setAttribute("hidden", true);
        this.open_Project.setAttribute("hidden", true);

        document.getElementById("return_from_create").addEventListener("click", this.return_to_main);
        document.getElementById("return_from_open").addEventListener("click", this.return_to_main);

        document.getElementById("newproject").addEventListener("click", this.createProject);
        document.getElementById("openproject").addEventListener("click", this.openProject);
        document.getElementById("saveproject").addEventListener("click", this.saveProject);

        globalEvents.on("load-project", this.server_load_project);
        globalEvents.on("save-project", this.server_save_project);
        globalEvents.on("get-projects", this.server_get_projects);
        globalEvents.on("save-project-failed", this.save_project_failed);
    }

    server_load_project = () => {};

    server_save_project = (event) => {
        console.log("navbar:server_save_project -> save project" + event);
    };


    createFormulaProject = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = {};
        data["task"] = "create_project";
        data["success"] = true;
        data["data"] = {};
        for (let [key, value] of formData.entries()) {
            data["data"][key] = value;
        }
        project.name = data["data"]["project_name"];
        project.description = data["data"]["project_description"];
        go_post_event(data, (data) => {
            if(data.success){
                console.log("Project created");
                window.alert(data.data);
                this.loadProject();
                this.return_to_main();
            }else{
                console.error("Project creation failed");
            }
        });
    };

    createProject = () => {
        this.main_container.setAttribute("hidden", true);
        this.open_Project.setAttribute("hidden", true);
        this.create_Project.removeAttribute("hidden");
        document.getElementById("create_projectForm").addEventListener("submit", this.createFormulaProject);
    };

    server_get_projects = () => {
        const data = {};
        data["task"] = "get_projects";
        go_get_event(data, this.fillProjects);
    };

    fillProjects = (data) => {
        const projectLists = data[0].projects;
        console.log(projectLists);
    };

    openProject = () => {
        globalEvents.emit('get-projects');
        this.main_container.setAttribute("hidden", true);
        this.create_Project.setAttribute("hidden",true);
        this.open_Project.removeAttribute("hidden");
    };

    saveProject = () => { // Save Project to local storage (frontend only)
        if(project.name === ""){
            window.alert("Bitte erstellen Sie ein Projekt bevor Sie es speichern");
            this.createProject();
            return;
        }
        globalEvents.emit('save-project');
    };

    save_project_failed = (data) => {
        if((data.data === "create_project")){
            //Es wurde zwar versucht ein Projekt zu speichern, aber keines war bekannt
            window.alert("Bitte erstellen Sie ein Projekt bevor Sie es speichern");
            //Wir wechseln zur create Projekt Seite
            this.createProject();
        }
        //default
        window.alert("Fehler beim Speichern des Projekts");
    };

    return_to_main = () => {
        this.create_Project.setAttribute("hidden", true);
        this.open_Project.setAttribute("hidden", true);
        this.main_container.removeAttribute("hidden");
    };

    static getInstance = () => { return Navbar.instance; }
}

const navbar = new Navbar();
export default navbar;