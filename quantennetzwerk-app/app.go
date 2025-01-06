package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/nikolalohinski/gonja/v2"
	"github.com/nikolalohinski/gonja/v2/exec"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after front-end resources have been loaded
func (a App) domReady(ctx context.Context) {
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
