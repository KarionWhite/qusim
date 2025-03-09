import { go_post_event, go_get_event} from './go_com.mjs';
import globalEvents from './EventEmitter.mjs';
import actionHandler from './ActionHandler.mjs';
import project from './Project.mjs';
import infoHandler from './infoHandler.mjs';
import actionWatcher from './ActionWatcher.mjs';

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

        this.edit_undo = document.getElementById("edit_undo");
        this.edit_redo = document.getElementById("edit_redo");

        document.getElementById("return_from_create").addEventListener("click", this.return_to_main);
        document.getElementById("return_from_open").addEventListener("click", this.return_to_main);

        document.getElementById("newproject").addEventListener("click", this.createProject);
        document.getElementById("openproject").addEventListener("click", this.openProject);
        document.getElementById("saveproject").addEventListener("click", this.saveProject);
        document.getElementById("run_simulation").addEventListener("click", this.runSimulation);

        this.edit_undo.addEventListener("click", this.undoClicked);
        this.edit_redo.addEventListener("click", this.redoClicked);
        this.edit_undo.disabled = true;
        this.edit_redo.disabled = true;

        //Registriere Navbar Events
        globalEvents.on("load-project", this.server_load_project);
        globalEvents.on("save-project", this.server_save_project);
        globalEvents.on("get-projects", this.server_get_projects);
        globalEvents.on("save-project-failed", this.save_project_failed);
        document.addEventListener('keydown', this.keydown);

        //Registriere ActionWatcher Events
        globalEvents.on(actionWatcher.EMMITED_ACTIONS.ActionRegistered, this.actionRegistered);
        globalEvents.on(actionWatcher.EMMITED_ACTIONS.UndoAction, this.undoAction);
        globalEvents.on(actionWatcher.EMMITED_ACTIONS.RedoAction, this.redoAction);


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
                window.alert(data.message);
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
            }else if(data.status === 'done'){
                console.log("Simulation done");
                window.alert("Simulation erfolgreich abgeschlossen");
                this.main_fieldset.disabled = !this.main_fieldset.disabled;
                this.main_waiter.setAttribute("hidden", true);
                this.getCalculationResults();
            }else if(data.status === 'error'){
                console.error("Simulation poll failed");
                window.alert("Simulation fehlgeschlagen" + data.message);
                this.main_fieldset.disabled = !this.main_fieldset.disabled;
                this.main_waiter.setAttribute("hidden", true);
            }
            else{
                console.error("Simulation poll failed");
            }
        });
    };

    getCalculationResults = () => {
        const data = {};
        data["task"] = "get_simulation";
        data["success"] = true;
        data["data"] = {};
        data["data"]["calc_id"] = project.getCalcId();
        go_get_event(data, (data) => {
            if(data.success){
                console.log("Simulation results successful");
                console.log(data);
                infoHandler.setData(data);
            }else{
                console.error("Simulation results failed");
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
        const listHead_ProjectDelete = document.createElement("th");
        listHead_ProjectName.innerText = "Project Name";
        listHead_ProjectCreationDate.innerText = "Creation Date";
        listHead_ProjectLastChange.innerText = "Last Change";
        listHead_ProjectDescription.innerText = "Description";
        listHead_ProjectDelete.innerText = "Delete";
        listHead.appendChild(listHead_ProjectName);
        listHead.appendChild(listHead_ProjectCreationDate);
        listHead.appendChild(listHead_ProjectLastChange);
        listHead.appendChild(listHead_ProjectDescription);
        listHead.appendChild(listHead_ProjectDelete);
        listThead.appendChild(listHead);
        listContainer.appendChild(listThead);
        const listTbody = document.createElement("tbody");
        listTbody.classList.add("scrollable-tbody");
        listTbody.id = "open_project_list_tbody";
        for(const pproject of data){
            const listRow = document.createElement("tr");
            listRow.id = pproject.name + "_row";
            listRow.addEventListener("click", () => {
                this.loadProject(pproject.name);
            });
            const listRow_ProjectName = document.createElement("td");
            const listRow_ProjectCreationDate = document.createElement("td");
            const listRow_ProjectLastChange = document.createElement("td");
            const listRow_ProjectDescription = document.createElement("td");
            const listRow_ProjectDelete = document.createElement("td");
            listRow_ProjectName.innerText = pproject.name;
            listRow_ProjectCreationDate.innerText = this.__beautifyDate(pproject.created_at);
            listRow_ProjectLastChange.innerText = this.__beautifyDate(pproject.updated_at);
            listRow_ProjectDescription.innerText = pproject.description;

            const deleteButton = document.createElement("button");
            deleteButton.classList.add("btn", "btn-danger", "btn-sm", "delete-button");
            deleteButton.type = "button";
            deleteButton.id = pproject.name + "_delete";

            const deleteIcon = document.createElement("img");
            deleteIcon.src = "/Bootstrap/bootstrap-icons/trash3.svg"
            deleteIcon.alt = "delete Project";
            deleteButton.appendChild(deleteIcon);
            deleteButton.addEventListener("click", (event) => {
                event.stopPropagation();
                this.deleteProject(pproject.name);
            });
            listRow_ProjectDelete.appendChild(deleteButton);

            listRow.appendChild(listRow_ProjectName);
            listRow.appendChild(listRow_ProjectCreationDate);
            listRow.appendChild(listRow_ProjectLastChange);
            listRow.appendChild(listRow_ProjectDescription);
            listRow.appendChild(listRow_ProjectDelete);
            listTbody.appendChild(listRow);
        }
        listContainer.appendChild(listTbody);
        projectList.prepend(listContainer);
    };

    deleteProject = (project_name) => {
        if(!confirm(`Wollen Sie das Projekt ${project_name} wirklich löschen?`)){
            return;
        }
        const data = {};
        data["task"] = "delete_project";
        data["success"] = true;
        data["data"] = {};
        data["data"]["project_name"] = project_name;
        go_post_event(data, (data) => {
            if(data.success){
                console.log("Project deleted");
                window.alert(data.data);
                const projectRow = document.getElementById(project_name + "_row");
                if(projectRow !== null){
                    projectRow.remove();
                }
            }else{
                console.error("Project deletion failed");
            }
        });
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
            window.alert("Bitte erstellen Sie ein Projekt zum speichern");
            this.createProject();
            return;
        }
        globalEvents.emit('save-project');
    };

    save_project_failed = (data) => {
        if((data.data === "create_project")){
            //Es wurde zwar versucht ein Projekt zu speichern, aber keines war bekannt
            window.alert("Bitte erstellen Sie ein Projekt zum speichern");
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

    undoClicked = () => {
        globalEvents.emit(actionWatcher.REGISTERED_ACTIONS.GetUndo);
    };

    redoClicked = () => {
        globalEvents.emit(actionWatcher.REGISTERED_ACTIONS.GetRedo);
    };

    keydown = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
            globalEvents.emit(actionWatcher.REGISTERED_ACTIONS.GetUndo);
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
            globalEvents.emit(actionWatcher.REGISTERED_ACTIONS.GetRedo);
        }
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') {
            globalEvents.emit(actionWatcher.REGISTERED_ACTIONS.GetRedo);
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            this.saveProject();
        }
    };

    actionRegistered = (action) => {
        if(actionWatcher.canUndo()){
            this.edit_undo.disabled = false;
        }else{
            this.edit_undo.disabled = true;
        }
        if(actionWatcher.canRedo()){
            this.edit_redo.disabled = false;
        }else{
            this.edit_redo.disabled = true;
        }
    };

    undoAction = (action) => {
        this.actionRegistered(action);
    };

    redoAction = (action) => {
        this.actionRegistered(action);
    };

    static getInstance = () => { return Navbar.instance; }
}

const navbar = new Navbar();
export default navbar;