package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/KarionWhite/qusim/quantennetzwerk-app/taskhandler"

	"github.com/labstack/gommon/log"
	"github.com/nikolalohinski/gonja/v2"
	"github.com/nikolalohinski/gonja/v2/exec"
)

// App struct
type App struct {
	ctx context.Context
}

// json type for the response
type PostJSONData struct {
	Task string          `json:"task"`
	Data json.RawMessage `json:"data"` //Will be interpreted depending on the task
}

// GetJsonData represents the data that is sent to the frontend
type GetJsonData struct {
	Task    string      `json:"task"`
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
}

// function for POST requests from the frontend
func (a *App) PostRequest(data PostJSONData) (string, error) {
	var response GetJsonData
	jsonData := PostJSONData(data)
	//Switch for the different tasks
	switch strings.TrimSpace(jsonData.Task) {
	case "example":
		//Do something
	case "has_changed":
		taskhandler.SetHasChanged(jsonData.Data)
	case "set_project":
		//taskhandler.SetProject()
	case "save_project":
		var success, awnser = taskhandler.SaveProject(jsonData.Data)
		response.Success = success
		response.Task = "save_project"
		response.Data = awnser
	case "create_project":
		var success, awnser = taskhandler.CreateProject(jsonData.Data)
		response.Success = success
		response.Task = "create_project"
		response.Data = awnser
	case "error":
		response.Success = false
		response.Task = "unmarshalling_error"
		response.Data = "Error while unmarshalling the data! Please check the data!"
	default:
		response.Success = false
		response.Task = "Task not found"
		response.Data = nil
	}
	//Marshal the response
	jsonResponse, err := json.Marshal(response)
	if err != nil {
		log.Error("app.go::PostRequest-> error while marshalling the response: %w", err)
	}
	return string(jsonResponse), nil
}

// function for GET requests from the frontend
func (a *App) GetRequest(data GetJsonData) (string, error) {
	var response GetJsonData
	var jsonResponse []byte
	response.Success = false
	response.Task = "Task not found"
	response.Data = nil
	jsonResponse, err := json.Marshal(response)
	jsonData := GetJsonData(data)
	switch strings.TrimSpace(jsonData.Task) {
	case "example":
		//Do something
	case "get_projects":
		jsonResponse, err = taskhandler.GetProjects()
	case "load":
		//taskhandler.Load(data.Data)
	case "get_quSim_data":
		//taskhandler.GetQuSimData()
	default:
		log.Error("app.go::GetRequest-> Task not found")
	}
	//Marshal the response
	if err != nil {
		log.Error("app.go::GetRequest-> error while marshalling the response: %w", err)
	}
	return string(jsonResponse), nil
}

// NewApp creates a new App application struct
func NewApp() *App {
	log.Info("app.go::NewApp-> Creating a new App")
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx

}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(_ context.Context) (prevent bool) {
	if taskhandler.GetHasChanged() {
		//save the changes
		//TODO
	}
	//Shutdown Python-API
	return false
}

func (a *App) RenderTemplate(templateName string, ctx *exec.Context) (string, error) {
	// Pfad zum Template-Verzeichnis
	ex, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("ein Fehler beim Ermitteln des Executables: %w", err)
	}
	templateDir := filepath.Join(ex, "frontend", "src", "views", templateName)
	// Erstelle ein neues Template-Set
	template, err := gonja.FromFile(templateDir)
	if err != nil {
		return "", fmt.Errorf("ein Fehler beim Erstellen des Template-Sets: %w", err)
	}
	// Rendere das Template
	output, err := template.ExecuteToString(ctx)
	if err != nil {
		return "", fmt.Errorf("ein Fehler beim Rendern des Templates: %w", err)
	}
	return output, nil
}
