package main

import (
	"embed"
	"io"
	"os"
	"strconv"

	"github.com/labstack/gommon/log"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

var constant_for_history = 10 //The number of history logs that are saved

//go:embed all:frontend/src
var assets embed.FS

func main() {
	//Set logger
	log.SetLevel(log.DEBUG)

	//Erstelle ein Multi-Writer, um die Ausgabe in eine Datei zu schreiben
	check_log_dir()
	create_log_file()
	logFile, ferr := os.OpenFile("log/quantennetzwerk-app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if ferr != nil {
		log.Fatal(ferr)
	}
	defer logFile.Close()
	multiWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(multiWriter)

	// Create an instance of the app structure
	app := NewApp()
	// Create application with options
	err := wails.Run(&options.App{
		Title:            "quantennetzwerk-app",
		Width:            1024,
		Height:           768,
		WindowStartState: options.Maximised,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

func check_log_dir() {
	//Check if the log directory exists
	if _, err := os.Stat("log"); os.IsNotExist(err) {
		//Create the log directory
		err := os.Mkdir("log", 0755)
		if err != nil {
			log.Error(err)
		}
		//Create history log directory
		err = os.Mkdir("log/history", 0755)
		if err != nil {
			log.Error(err)
		}
	}
}

func create_log_file() {
	//Check if a log file exists
	if _, err := os.Stat("log/quantennetzwerk-app.log"); os.IsNotExist(err) {
		//Create the log file
		file, err := os.Create("log/quantennetzwerk-app.log")
		if err != nil {
			log.Fatal(err)
		} else {
			file.Close()
			//Wir müssen die history log IDs verschieben 1 wird zu 2, 2 wird zu 3, usw.
			entries, err := os.ReadDir("log/history")
			if err != nil {
				log.Error(err)
			}
			if len(entries) >= constant_for_history {
				for i := len(entries) - 1; i >= constant_for_history-1; i-- {
					err := os.Remove("log/history/" + entries[i].Name())
					if err != nil {
						log.Error(err)
					}
				}
			}
			for i := len(entries) - 1; i >= 0; i-- {
				err := os.Rename("log/history/"+entries[i].Name(), "log/history/"+strconv.Itoa(i+2)+".log")
				if err != nil {
					log.Error(err)
				}
			}
			//Copy the log file to the history log directory
			err = os.Rename("log/quantennetzwerk-app.log", "log/history/1.log")
			if err != nil {
				log.Error(err)
			}
			//Create a new log file
			filelogger, err := os.Create("log/quantennetzwerk-app.log")
			if err != nil {
				log.Fatal(err)
			}
			defer filelogger.Close()
		}
		defer file.Close()
	}
}
