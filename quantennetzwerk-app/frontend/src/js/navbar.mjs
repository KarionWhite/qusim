import { go_post_event, go_get_event} from './go_com.mjs';
import globalEvents from './EventEmitter.mjs';
import actionHandler from './ActionHandler.mjs';
import project from './Project.mjs';

class Navbar {

    static instance = null;

    constructor() { 
        if (Navbar.instance) {
            return Navbar.instance;
        }else{
            Navbar.instance = this;
        }
        this.main_fieldset = document.getElementById("main-fieldset");
        this.main_container = document.getElementById("main-container");
        this.main_waiter = document.getElementById("waiting");
        this.create_Project = document.getElementById("create_project");
        this.open_Project = document.getElementById("open_project");
        
        this.create_Project.setAttribute("hidden", true);
        this.open_Project.setAttribute("hidden", true);

        document.getElementById("return_from_create").addEventListener("click", this.return_to_main);
        document.getElementById("return_from_open").addEventListener("click", this.return_to_main);

        document.getElementById("newproject").addEventListener("click", this.createProject);
        document.getElementById("openproject").addEventListener("click", this.openProject);
        document.getElementById("saveproject").addEventListener("click", this.saveProject);
        document.getElementById("run_simulation").addEventListener("click", this.runSimulation);

        globalEvents.on("load-project", this.server_load_project);
        globalEvents.on("save-project", this.server_save_project);
        globalEvents.on("get-projects", this.server_get_projects);
        globalEvents.on("save-project-failed", this.save_project_failed);
    }

    runSimulation = () => {
        const data = {};
        data["task"] = "simulate";
        data["success"] = true;
        data["data"] = actionHandler.getQCircuit();
        data["data"]["project_header"] = project.save();
        go_get_event(data, (data) => {
            if(data.status === 'started'){
                console.log("Simulation successfuly started");
                this.main_fieldset.disabled = !this.main_fieldset.disabled;
                this.main_waiter.removeAttribute("hidden");
                project.setCalcId(data.calc_id);
                window.alert(data.data);
                this.pollSimulation();
            }else{
                console.error("Simulation failed");
            }
        });
    };

    pollSimulation = () => {
        const data = {};
        data["task"] = "pollSimulation";
        data["success"] = true;
        data["data"] = {};
        data["data"]["calc_id"] = project.getCalcId();
        go_get_event(data, (data) => {
            if(data.status === 'running'){
                console.log("Simulation poll successful");
                if(data.data === "done"){
                    console.log("Simulation done");
                    window.alert("Simulation erfolgreich abgeschlossen");
                    this.main_fieldset.disabled = !this.main_fieldset.disabled;
                    this.main_waiter.setAttribute("hidden", true);
                }else{
                    console.log("Simulation still running");
                    setTimeout(this.pollSimulation, 10000);
                }
            }else{
                console.error("Simulation poll failed");
            }
        });
    };

    server_load_project = (pproject) => {
        console.log("navbar:server_load_project -> load project");
        console.log(pproject);
    };

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
        const qCirquit = actionHandler.getQCircuit();
        for(const key in qCirquit){
            data["data"][key] = qCirquit[key];
        }

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

    loadProject = (project_name) => {
        actionHandler.clearQCircuit();
        const data = {};
        data["task"] = "load";
        data["data"] = {};
        data["data"]["project_name"] = project_name;
        go_get_event(data, (data) => {
            if(data.success){
                console.log("Project loaded");
                actionHandler.loadQCircuit(data.project);
                const projectList = document.getElementById("open_project_list_table");
                if(projectList !== null){
                    projectList.remove();
                }
                this.return_to_main();
                project.load(data.project.project_header);
            }else{
                console.error("Project loading failed");
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
        const projectList = document.getElementById("open_project_list");
        const listContainer = document.createElement("table");
        listContainer.classList.add("table", "table-striped", "table-bordered", "table-hover", "table-responsive");
        listContainer.id = "open_project_list_table";
        const listThead = document.createElement("thead");
        const listHead = document.createElement("tr");
        const listHead_ProjectName = document.createElement("th");
        const listHead_ProjectCreationDate = document.createElement("th");
        const listHead_ProjectLastChange = document.createElement("th");
        const listHead_ProjectDescription = document.createElement("th");
        listHead_ProjectName.innerText = "Project Name";
        listHead_ProjectCreationDate.innerText = "Creation Date";
        listHead_ProjectLastChange.innerText = "Last Change";
        listHead_ProjectDescription.innerText = "Description";
        listHead.appendChild(listHead_ProjectName);
        listHead.appendChild(listHead_ProjectCreationDate);
        listHead.appendChild(listHead_ProjectLastChange);
        listHead.appendChild(listHead_ProjectDescription);
        listThead.appendChild(listHead);
        listContainer.appendChild(listThead);
        const listTbody = document.createElement("tbody");
        listTbody.classList.add("scrollable-tbody");
        listTbody.id = "open_project_list_tbody";
        for(const pproject of data){
            const listRow = document.createElement("tr");
            listRow.addEventListener("click", () => {
                this.loadProject(pproject.name);
            });
            const listRow_ProjectName = document.createElement("td");
            const listRow_ProjectCreationDate = document.createElement("td");
            const listRow_ProjectLastChange = document.createElement("td");
            const listRow_ProjectDescription = document.createElement("td");
            listRow_ProjectName.innerText = pproject.name;
            listRow_ProjectCreationDate.innerText = this.__beautifyDate(pproject.created_at);
            listRow_ProjectLastChange.innerText = this.__beautifyDate(pproject.updated_at);
            listRow_ProjectDescription.innerText = pproject.description;
            listRow.appendChild(listRow_ProjectName);
            listRow.appendChild(listRow_ProjectCreationDate);
            listRow.appendChild(listRow_ProjectLastChange);
            listRow.appendChild(listRow_ProjectDescription);
            listTbody.appendChild(listRow);
        }
        listContainer.appendChild(listTbody);
        projectList.prepend(listContainer);
    };

    __beautifyDate = (date) => {
        const dateObj = new Date(date);
        const dateString = [dateObj.getDate(), (dateObj.getMonth())+1, dateObj.getFullYear()].join(".");
        return dateString;
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