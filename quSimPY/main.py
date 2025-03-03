from fastapi import FastAPI
from Logger import Logger
from qusim import QuSimData
import argparse
import asyncio
import uvicorn
import uuid

# Globale Variablen
logger = None
calc_stack = {}


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
    


    """
    Wir Kommunizieren über json Format.
    Wir haben 3 Endpunkte:
    1. /health: GET Methode
    2. /calculate: POST Methode
    3. /result: GET Methode

    health: Gibt eine Nachricht zurück, dass der Service läuft.
    calculate: Nimmt json Daten entgegen und gibt eine Nachricht zurück, dass die Berechnung gestartet wurde. (statet die Berechnung)
    result: Gibt den Status der Berechnung zurück. Wenn result leer ist, ist die Berechnung noch nicht abgeschlossen. Dies ist notwendig, für Polling.
    """

    @app.get("/health")
    async def health():
        return {"status": "Service is running"}


    async def start_calculation():
        pass

    @app.post("/calculate")
    async def calculate(request_data: dict):
        calc_id = str(uuid.uuid4())
        calc_stack[calc_id] = request_data
        # start_calculation()
        return {"status": "started", "calc_id": calc_id}

    @app.get("/result")
    async def result():
        return {"status": "done", "result": "42"}
    
    import sys
    with open('uvicorn.log', 'w') as f:
        sys.stdout = f
        uvicorn.run(app, host=args.host, port=args.port) # Korrigiert: uvicorn.run nach der Initialisierung der app Instanz aufrufen.