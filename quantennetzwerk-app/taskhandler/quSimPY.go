package taskhandler

import (
	"os"
	"os/exec"
	"runtime"

	"github.com/labstack/gommon/log"
)

func StartPythonAPI(python_path string) {
	//Start the Python API
	if runtime.GOOS == "windows" {
		cmd := exec.Command(python_path)

		// Log-Datei für Fehlerausgabe erstellen
		logFile, err := os.Create("error_log.txt")
		if err != nil {
			log.Fatalf("Fehler beim Erstellen der Log-Datei: %v", err)
		}
		defer logFile.Close()

		// Standardausgabe und Fehlerausgabe umleiten

		cmd.Stderr = logFile

		// Prozess starten
		if err := cmd.Run(); err != nil {
			log.Fatalf("taskhandler::StartPythonAPI-> process exited with error: %v", err)
		}
	}
}
