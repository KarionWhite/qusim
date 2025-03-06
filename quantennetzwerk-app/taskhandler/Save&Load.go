package taskhandler

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/labstack/gommon/log"
)

var projectsPath string = ""
var projectsPathonce sync.Once

var currentProject string = "" //Path zu dem aktuellem Projekt
var project_space Project_Space = Project_Space{}

/*
Ermittelt den Pfad für den Ordner "projects" in dem die Projekte gespeichert werden.
@return string - Pfad zu den Projekten.
*/
func getProjectsPath() string {
	exePath, err := os.Executable()
	if err != nil {
		log.Fatalf("fehler beim Ermitteln des Pfades der ausführbaren Datei: %v", err)
	}
	exeDir := filepath.Dir(exePath)
	baseDir := filepath.Clean(filepath.Join(exeDir, "..", "..", ".."))
	projects_Path := filepath.Join(baseDir, "Projects")
	absProjectsPath, err := filepath.Abs(projects_Path)
	if err != nil {
		log.Fatalf("fehler beim Erstellen des Pfades für den Projects-Ordner: %v", err)
	}
	projectsPath = absProjectsPath
	return absProjectsPath
}

/*
Liefert den Pfad zu den Projekten.
@return string - Pfad zu den Projekten.
*/
func GetProjectsPath() string {
	projectsPathonce.Do(func() {
		projectsPath = getProjectsPath()
	})
	return projectsPath
}

/*
Speichert das Projekt in einem File.
@param fileName string - Name des Files, in dem das Projekt gespeichert werden soll.
@param project Project_Space - Projekt, das gespeichert werden soll.
@param overwrite bool - Gibt an, ob das Projekt überschrieben werden soll, wenn es bereits existiert.
@return error - Fehler-Wert, wenn das Projekt nicht gespeichert werden konnte.
*/
func Save(fileName string, project Project_Space, overwrite bool) error {
	//check if fileName is already in use
	var exist bool = false
	files, err1 := os.ReadDir(GetProjectsPath())
	if err1 != nil {
		log.Error("Save&Load->save(): Fehler beim Lesen der Projekte:  " + GetProjectsPath() + ":  " + err1.Error())
	}
	for _, file := range files {
		if filepath.Ext(file.Name()) == ".qusim" && file.Name() == fileName {
			exist = true
		}
	}
	if !overwrite && exist {
		//throw error
		log.Error("Save&Load->save(): Fehler beim Speichern des Projekts:  " + fileName + ":  Projekt existiert bereits.")
		return os.ErrExist
	} else if overwrite && exist {
		//delete the file
		err2 := os.Remove(filepath.Join(GetProjectsPath(), fileName))
		if err2 != nil {
			log.Error("Save&Load->save(): Fehler beim Löschen des Projekts:  " + fileName + ":  " + err2.Error())
			return err2
		}
	}
	//save the file
	file, err1 := os.Create(filepath.Join(GetProjectsPath(), fileName))
	if err1 != nil {
		log.Error("Save&Load->save(): Fehler beim Erstellen des Projekt-Files:  " + GetProjectsPath() + "/" + fileName + ".qusim :   " + err1.Error())
		return err1
	}
	defer file.Close()
	data, err2 := json.MarshalIndent(project, "", "    ")
	if err2 != nil {
		log.Error("Save&Load->save(): Fehler beim Serialisieren des Projekt-Files:  " + GetProjectsPath() + "/" + fileName + ".qusim :   " + err2.Error())
		return err2
	}
	_, err3 := file.Write(data)
	if err3 != nil {
		log.Error("Save&Load->save(): Fehler beim Schreiben der Daten in das Projekt: " + fileName + ":  " + err3.Error())
		return err3
	}
	return nil
}
func load(filename string) (Project_Space, error) {
	var project Project_Space
	file, err1 := os.ReadFile(filepath.Join(GetProjectsPath(), filename))
	if err1 != nil {
		log.Error("Save&Load->load(): Fehler beim Öffnen des Projekt-Files:  " + filename + ": " + err1.Error())
		return project, err1
	}
	err3 := json.Unmarshal(file, &project)
	if err3 != nil {
		log.Error("Save&Load->load(): Fehler beim Lesen des Projekt-Files:  " + filename + " : " + err3.Error())
		return project, err3
	}
	return project, nil
}

func load_global(filename string) error {
	file, err1 := os.ReadFile(filepath.Join(GetProjectsPath(), filename))
	project_space = Project_Space{}
	if err1 != nil {
		log.Error("Save&Load->load(): Fehler beim Öffnen des Projekt-Files:  " + filename + ": " + err1.Error())
		return err1
	}
	err3 := json.Unmarshal(file, &project_space)
	if err3 != nil {
		log.Error("Save&Load->load(): Fehler beim Lesen des Projekt-Files:  " + filename + " : " + err3.Error())
		return err3
	}
	return nil
}

/*
Struktur für das Erstellen eines Projekts.
*/
type ProjectCreate struct {
	Project_name        string                 `json:"project_name"`
	Project_description string                 `json:"project_description"`
	Blocks              map[string]Block       `json:"blocks"`
	WireSession         map[string]WireSession `json:"wire_session"`
}

func CreateProject(data json.RawMessage) (bool, string) {
	var projectData ProjectCreate
	var awnser string
	err := json.Unmarshal(data, &projectData)
	if err != nil {
		log.Error("Save&Load->CreateProject(): Fehler beim Erstellen des Projekts: " + err.Error())
		return false, "Fehler beim Erstellen des Projekts: " + err.Error()
	}
	project_space.PHeader.Name = projectData.Project_name
	project_space.PHeader.Created_At = time.Now()
	project_space.PHeader.Updated_At = time.Now()
	project_space.PHeader.Description = projectData.Project_description
	project_space.Blocks = projectData.Blocks
	project_space.WireSession = projectData.WireSession
	project_space.Qubits = make(map[string]Qubit)

	var project_path_name string = projectData.Project_name
	if !strings.HasSuffix(project_path_name, ".qusim") {
		project_path_name = project_path_name + ".qusim"
	}

	err = Save(project_path_name, project_space, false)
	if err != nil {
		log.Error("Save&Load->CreateProject(): Fehler beim Erstellen des Projekts: " + err.Error())
		return false, "Fehler beim Erstellen des Projekts: " + err.Error()
	}
	awnser = "Projekt " + projectData.Project_name + " wurde erfolgreich erstellt."
	Select_Project(projectData.Project_name)
	return true, awnser
}

func SaveProject(data json.RawMessage) (bool, string) {
	var awnser string
	var saving_space Project_Space
	err := json.Unmarshal(data, &saving_space)
	if err != nil {
		log.Error("Save&Load->SaveProject(): Fehler beim Speichern des Projekts: " + err.Error())
		return false, "Fehler beim Speichern des Projekts: " + err.Error()
	}
	if saving_space.PHeader.Name == "" {
		log.Error("Save&Load->SaveProject(): Fehler beim Speichern des Projekts: Projektname fehlt.")
		return false, "create_project"
	}
	err = Save(GetCurrentProject(), saving_space, true)
	if err != nil {
		log.Error("Save&Load->SaveProject(): Fehler beim Speichern des Projekts: " + err.Error())
		return false, "Fehler beim Speichern des Projekts: " + err.Error()
	}
	awnser = "Projekt " + GetCurrentProject() + " wurde erfolgreich gespeichert."
	return true, awnser
}

type GetProjectsJ struct {
	Projects []ProjectHeader `json:"projects"`
}

func GetProjects() ([]byte, error) {
	var projects []ProjectHeader
	var projectList, err = Get_Projects()
	if err != nil {
		log.Error("Save&Load->GetProjects(): Fehler beim Lesen der Projekte: " + err.Error())
		return nil, err
	}
	for _, project := range projectList {
		jproject, err := load(project)
		if err != nil {
			log.Error("Save&Load->GetProjects(): Fehler beim Laden des Projekts: " + err.Error())
			return nil, err
		}
		projects = append(projects, jproject.PHeader)
	}
	return json.Marshal(projects)
}

/*
*
Load Project für das Frontend
*/
type LoadProjectJ struct {
	Name string `json:"project_name"`
}

type LoadedProjectJ struct {
	Project  Project_Space `json:"project"`
	Succes   bool          `json:"success"`
	ErrorMsg string        `json:"error_msg"`
}

func LoadProject(data json.RawMessage) ([]byte, error) {
	var loadedProject LoadedProjectJ
	loadedProject.Succes = true
	var reterr error = nil
	var projectData LoadProjectJ
	err := json.Unmarshal(data, &projectData)
	if err != nil {
		log.Error("Save&Load->LoadProject(): Fehler beim Laden des Projekts: " + err.Error())
		loadedProject.Succes = false
		loadedProject.ErrorMsg = "Fehler beim Laden des Projekts: " + err.Error()
		reterr = err
	}
	err1 := Select_Project(projectData.Name)
	if err1 != nil && loadedProject.Succes {
		log.Error("Save&Load->Select_Project(): Fehler beim Laden des Projekts: " + err.Error())
		loadedProject.Succes = false
		loadedProject.ErrorMsg = "Fehler beim Laden des Projekts: " + err.Error()
		reterr = err1
	}
	loadedProject.Project = GetProject()
	rett, err2 := json.Marshal(loadedProject)
	if err2 != nil {
		log.Error("Save&Load->LoadProject(): Fehler beim Laden des Projekts: " + err.Error())
		loadedProject.Succes = false
		loadedProject.ErrorMsg = "Fehler beim Laden des Projekts: " + err.Error()
		reterr = err2
	}
	return rett, reterr
}

/*
Liefert ein Array mit den Namen aller Projekte als sting Array.
@return []string - Array mit den Namen aller Projekte
@return error - Fehler-Wert, wenn das Projekt nicht gefunden wurde.
*/
func Get_Projects() ([]string, error) {
	projectsPath := GetProjectsPath()
	projectFiles, err := os.ReadDir(projectsPath)
	if err != nil {
		log.Error("Save&Load->Get_Projects(): Fehler beim Lesen der Projekte: " + err.Error())
		return []string{}, nil
	}
	projectNames := []string{}
	for _, file := range projectFiles {
		if !file.IsDir() && filepath.Ext(file.Name()) == ".qusim" {
			projectNames = append(projectNames, file.Name())
		}
	}
	return projectNames, nil
}

/*
Wählt das Projekt aus und lädt das Projekt in PROJECT.
@param projectName string - Name des Projekts, das geladen werden soll.
@return error - Fehler-Wert, wenn das Projekt nicht gefunden wurde.
*/
func Select_Project(projectName string) error {
	prjects, err1 := Get_Projects()
	if err1 != nil {
		log.Error("Save&Load->Select_Project(): Fehler beim Lesen der Projekte: " + err1.Error())
		return err1
	}
	for _, project := range prjects {
		if project == projectName || project == projectName+".qusim" {
			err2 := load_global(project)
			if err2 != nil {
				log.Error("Save&Load->Select_Project(): Fehler beim Laden des Projekts: " + err2.Error())
				return err2
			}
			currentProject = project
			break
		}
	}
	return nil
}

func DeleteProject(data json.RawMessage) (bool, string) {
	var toDelete LoadProjectJ
	err := json.Unmarshal(data, &toDelete)
	if err != nil {
		log.Error("Save&Load->DeleteProject(): Fehler beim Löschen des Projekts: " + err.Error())
		return false, "Fehler beim Löschen des Projekts: " + err.Error()
	}
	if !strings.HasSuffix(toDelete.Name, ".qusim") {
		toDelete.Name = toDelete.Name + ".qusim"
	}
	err1 := os.Remove(filepath.Join(GetProjectsPath(), toDelete.Name))
	if err1 != nil {
		log.Error("Save&Load->DeleteProject(): Fehler beim Löschen des Projekts: " + err1.Error())
		return false, "Fehler beim Löschen des Projekts: " + err1.Error()
	}
	return true, "Projekt " + toDelete.Name + " wurde erfolgreich gelöscht."
}

/*
Gibt den aktuellen Projektpfad zurück.
@return string - Pfad zum aktuellen Projekt.
*/
func GetCurrentProject() string {
	return currentProject
}

/*
Gibt das aktuelle Projekt zurück.
@return Project_Space - Aktuelles Projekt.
*/
func GetProject() Project_Space {
	return project_space
}
