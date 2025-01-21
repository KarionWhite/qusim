from fastapi import FastAPI
from Logger import Logger
import argparse
import uvicorn

# Globale Variablen sollten, wenn möglich, vermieden werden, aber für Logger und App ist es oft üblich.
logger = None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Start the QuSimPY API')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode', default=False)
    parser.add_argument('-p', '--port', type=int, help='Port to run the API on', default=8000)
    parser.add_argument('-H', '--host', type=str, help='Host to run the API on', default='127.0.0.1')  # Korrigiere -h zu -H, um Konflikte mit --help zu vermeiden
    args = parser.parse_args()  # Korrigiert: parse_args() auf dem parser-Objekt aufrufen.
    debug_api = args.debug

    logger = Logger(log_file="app.log", log_level=Logger.DEBUG if debug_api else Logger.INFO)

    logger.debug("QuSim Api startet on host: " + args.host + " and port: " + str(args.port))
    logger.debug("Debug mode is: " + str(debug_api))
    
    app = FastAPI(
        openapi_url=None,  # Deaktiviert die OpenAPI-Spezifikation
        docs_url=None,     # Deaktiviert die Swagger UI Dokumentation
        redoc_url=None     # Deaktiviert die ReDoc Dokumentation
    )
    uvicorn.run(app, host=args.host, port=args.port) # Korrigiert: uvicorn.run nach der Initialisierung der app Instanz aufrufen.