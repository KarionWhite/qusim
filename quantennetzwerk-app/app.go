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
	Task    string `json:"task"`
	Success bool   `json:"success"`
	Data    any    `json:"data"`
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
func (a *App) GetRequest(data PostJSONData) (string, error) {
	var response GetJsonData
	var jsonResponse []byte
	response.Success = false
	response.Task = "Task not found"
	response.Data = nil
	jsonResponse, err := json.Marshal(response)
	jsonData := PostJSONData(data)
	switch strings.TrimSpace(jsonData.Task) {
	case "example":
		//Do something
	case "get_projects":
		jsonResponse, err = taskhandler.GetProjects()
	case "load":
		jsonResponse, err = taskhandler.LoadProject(jsonData.Data)
	case "simulate":
		jsonResponse, err = taskhandler.Simulate(jsonData.Data)
	case "pollSimulation":
		jsonResponse, err = taskhandler.PollSimulation(jsonData.Data)
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

// shutdown is called at application shutdown
func (a *App) shutdown(ctx context.Context) {
	taskhandler.Shutdown()
	a.ctx = ctx
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	exePath, err := os.Executable()
	if err != nil {
		log.Error("app.go::startup-> error while getting the executable path: %w", err)
	}
	print(exePath)
	log.Debug("app.go::startup-> Application is starting with executable path: " + exePath)
	python_path := filepath.Dir(exePath)    //bin
	python_path = filepath.Dir(python_path) //build
	python_path = filepath.Dir(python_path) //quantennetzwerk-app
	python_path = filepath.Dir(python_path) //Qusim
	python_path = filepath.Join(python_path, "quSimPy")
	python_path = filepath.Join(python_path, "dist")
	python_path = filepath.Join(python_path, "main.exe")
	log.Debug("app.go::startup-> Python path: " + python_path)
	//Start Python-API: Zu Test Zwecken auskommentiert
	//go taskhandler.StartPythonAPI(python_path)

	a.ctx = ctx

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
