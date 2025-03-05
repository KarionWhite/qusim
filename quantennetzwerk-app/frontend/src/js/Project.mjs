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
        this.created_at = new Date();
        this.updated_at = new Date();
        this.calc_id = null;
    }

    //!Go Funktion!!!!
    updateWindowName(){
        try{
            document.title = "QuantenNetzwerk - " + String(this.name);
        }catch(e){
            console.error("Error updating window name");
        }
    }

    save(){
        const data = {
            name: this.name,
            description: this.description,
            created_at: this.created_at,
            updated_at: this.updated_at,
        }
        return data
    }

    load(json){
        this.name = json.name;
        this.description = json.description;
        this.created_at = json.created_at;
        this.updated_at = json.updated_at;
        this.updateWindowName();
    }

    setCalcId(id){
        this.calc_id = id;
    }

    getCalcId(){
        return this.calc_id;
    }
}

const project = new Project();
export default project;
