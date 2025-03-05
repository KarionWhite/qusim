package taskhandler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"runtime"
	"time"

	"github.com/labstack/gommon/log"
)

var QSIMRUNS = false
var PyURL = "http://localhost:8000"

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
		trys := 8
		for trys > 0 {
			trys--
			_, err := Request("/health")
			if err != nil {
				log.Warnf("taskhandler::StartPythonAPI-> Python API not ready yet! Retrying in 5 seconds...")
				time.Sleep(5 * time.Second)
				continue
			}
			QSIMRUNS = true
			break
		}
	}
}

// makeRequest ist eine generische Funktion für das Senden von HTTP-Requests.
func makeRequest(method string, endpoint string, contentType string, data []byte) ([]byte, error) {
	// 1. URL vorbereiten (mit Fehlerbehandlung)
	fullURL, err := url.Parse(PyURL + endpoint)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	// 2. Body vorbereiten (kann nil sein)
	var bodyReader io.Reader
	if data != nil {
		bodyReader = bytes.NewBuffer(data)
	}

	// 3. Request erstellen
	req, err := http.NewRequest(method, fullURL.String(), bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// 4. Content-Type Header setzen (wenn angegeben)
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	// 5. Request senden
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// 6. Statuscode prüfen
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// 7. Body lesen
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	return responseBody, nil
}

// Request führt einen GET-Request ohne Datenpaket aus.
func Request(req string) ([]byte, error) {
	//Nutze makeRequest mit GET und nil Body
	return makeRequest("GET", req, "", nil)
}

// jsonRequest führt einen POST-Request mit JSON-Datenpaket aus.
func jsonRequest(req string, data []byte) ([]byte, error) {
	//Nutze makeRequest mit POST und JSON Content-Type
	return makeRequest("POST", req, "application/json", data)
}

type Simulate_Response struct {
	Status  string `json:"status"`
	Calc_id string `json:"calc_id"`
}

func Simulate(data json.RawMessage) ([]byte, error) {
	// Request an Python API senden
	req := "/calculate"
	resp, err1 := jsonRequest(req, data)
	if err1 != nil {
		return nil, err1
	}
	return resp, nil
}

type Poll_Request struct {
	Calc_id string `json:"calc_id"`
}

type Poll_Response struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func PollSimulation(data json.RawMessage) ([]byte, error) {
	req := "/poll"
	resp, err1 := jsonRequest(req, data)
	if err1 != nil {
		return nil, err1
	}
	return resp, nil
}

func GetSimulation(data json.RawMessage) ([]byte, error) {
	// Request an Python API senden
	req := "/get"
	resp, err1 := jsonRequest(req, data)
	if err1 != nil {
		return nil, err1
	}
	return resp, nil
}

func Shutdown() {
	_, err := Request("/shutdown")
	if err != nil {
		log.Fatalf("taskhandler::shutdown-> error while shutting down the Python API: %w", err)
	}
}
