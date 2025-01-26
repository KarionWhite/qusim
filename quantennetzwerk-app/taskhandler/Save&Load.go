package taskhandler

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

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
		if filepath.Ext(file.Name()) == ".qusim" && file.Name() != fileName {
			exist = true
		}
	}
	if overwrite == false && exist {
		//throw error
		log.Error("Save&Load->save(): Fehler beim Speichern des Projekts:  " + fileName + ":  Projekt existiert bereits.")
		return os.ErrExist
	} else if overwrite == true && exist {
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
	data, err2 := json.Marshal(project_space)
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

func load(filename string) error {
	file, err1 := os.Open(filepath.Join(GetProjectsPath(), filename))
	if err1 != nil {
		log.Error("Save&Load->load(): Fehler beim Öffnen des Projekt-Files:  " + filename + ": " + err1.Error())
		return err1
	}
	defer file.Close()
	data, err2 := os.ReadFile(filename)
	if err2 != nil {
		log.Error("Save&Load->load(): Fehler beim Lesen des Projekt-Files:  " + filename + " : " + err2.Error())
		return err2
	}
	err3 := json.Unmarshal(data, &project_space)
	if err3 != nil {
		log.Error("Save&Load->load(): Fehler beim Lesen des Projekt-Files:  " + filename + " : " + err3.Error())
		return err3
	}
	return nil
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
		if file.IsDir() == false && filepath.Ext(file.Name()) == ".qusim" {
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
		if project == projectName {
			err2 := load(project)
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
