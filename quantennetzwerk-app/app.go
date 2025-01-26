package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

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
func (a *App) PostRequest(data []byte) (string, error) {
	//Unmarshal the data
	log.Debug("app.go::PostRequest-> data: " + string(data))
	var response GetJsonData
	var jsonData PostJSONData
	err := json.Unmarshal(data, &jsonData)
	if err != nil {
		jsonData.Task = "error" //Set the task to error so it will be go into the default case
		log.Error("app.go::PostRequest-> error while unmarshalling the data: %w", err)
	}
	//Switch for the different tasks
	switch jsonData.Task {
	case "example":
		//Do something
	case "hasChanged":
		taskhandler.SetHasChanged(jsonData.Data)
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
func (a *App) GetRequest(data []byte) (string, error) {
	//Switch for the different tasks
	log.Debug("app.go::GetRequest-> data: " + string(data))
	//Unmarshal the data
	var jsonData GetJsonData
	err := json.Unmarshal(data, &jsonData)
	if err != nil {
		jsonData.Task = "error" //Set the task to error so it will be go into the default case
		log.Error("app.go::GetRequest-> error while unmarshalling the data: %w", err)
	}

	var response GetJsonData

	switch jsonData.Task {
	case "example":
		//Do something
	case "error":
		response.Success = false
		response.Task = "unmarshalling_error"
		response.Data = "Error while unmarshalling the data! Please check the data!"
	default:
		log.Error("app.go::GetRequest-> Task not found")
		response.Success = false
		response.Task = "Task not found"
		response.Data = nil
	}
	//Marshal the response
	jsonResponse, err := json.Marshal(response)
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

// domReady is called after front-end resources have been loaded
func (a *App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
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
