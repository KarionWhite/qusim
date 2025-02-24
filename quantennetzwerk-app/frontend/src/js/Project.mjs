/**
 * Allgemeine Klasse zur Definition der Meta-Daten eines Projekts
 */

class Project {

    static instance = null;

    constructor(){
        if (Project.instance) {
            return Project.instance;
        }
        Project.instance = this;
        this.name = "";
        this.description = "";
        this.created_At = new Date();
        this.updated_At = new Date();
        this.Qubits = [];
    }

    //!Go Funktion!!!!
    updateWindowName(){
        try{
            WindowSetTitle(this.name);
        }catch(e){
            console.error("Error updating window name");
        }
    }

    save(){
        const data = {
            name: this.name,
            description: this.description,
            created_At: this.created_At,
            updated_At: this.updated_At,
            Qubits: this.Qubits
        }
        return data
    }

    load(json){
        this.name = json.name;
        this.description = json.description;
        this.created_At = json.created_At;
        this.updated_At = json.updated_At;
        this.Qubits = json.Qubits;
        this.updateWindowName();
    }

}

const project = new Project();
export default project;
