from fastapi import FastAPI
from Logger import Logger
from qusim import QuSimData
from QSim import QSim
from queue import Empty
import multiprocessing as mp
import argparse
import asyncio
import uvicorn
import signal
import json
import uuid
import sys

logger = None

def start_calc(calc_stack:dict, calc_id:str, calc_queue:mp.Queue):
    qsim = QSim(calc_stack,calc_id)
    qsim.j2c()
    calc_stack = qsim.result()
    calc_stack["success"] = True
    calc_queue.put({calc_id: calc_stack})
    print("Calculation finished")
    return
    

if __name__ == "__main__":
    mp.freeze_support()
    # Globale Variablen
    calc_queue = mp.Queue()
    calc_Processes:dict[str,mp.context.Process] = {}
    calc_results = {}
    server = None
    
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
    3. /poll: POST Methode
    4. /get: GET Methode
    5. /pyExport: POST Methode
    6. /shutdown: GET Methode
    health: Gibt eine Nachricht zurück, dass der Service läuft.
    calculate: Nimmt json Daten entgegen und gibt eine Nachricht zurück, dass die Berechnung gestartet wurde. (statet die Berechnung)
    result: Gibt den Status der Berechnung zurück. Wenn result leer ist, ist die Berechnung noch nicht abgeschlossen. Dies ist notwendig, für Polling.
    """

    @app.get("/health")
    async def health():
        return {"status": "Service is running"}

    @app.post("/calculate")
    async def calculate(request_data: dict):
        calc_id = str(uuid.uuid4())
        calc_stack = {}
        calc_stack["status"] = "running"
        calc_stack["data"] = request_data
        calc_stack["result"] = None
        calc_stack["error"] = None
        
        calc_Processes[calc_id] = mp.Process(target=start_calc, name="QSIM_" + calc_id,args=(calc_stack, calc_id, calc_queue))
        calc_Processes[calc_id].start()
        return {"status": "started", "calc_id": calc_id, "message": "Calculation started"}

    @app.post("/poll")
    async def poll(request_data: dict):
        calc_id = request_data["calc_id"]
        if calc_id not in calc_Processes and calc_id not in calc_results:
            return {"status": "error", "message": "Calculation could not be found"}
        alive = calc_Processes[calc_id].is_alive()
        if alive:
            return {"status": "running"}
        else:
            return {"status": "done"}

    @app.post("/get")
    async def get(request_data: dict):
        calc_id = request_data["calc_id"]
        alive = calc_Processes[calc_id].is_alive()
        if alive:
            return {"status": "running"}
        else:
            calc_Processes[calc_id].join()
            if calc_id in calc_results:
                return calc_results[calc_id]
            try:
                possible = calc_queue.get(block=False)
                while calc_id not in possible:
                    calc_results.update(possible)
                    possible = calc_queue.get(block=False)
                calc_results.update(possible)
            except Empty:
                return {"status": "error", "message": "Calculation is not in the queue"}
            if calc_id in calc_results:
                return calc_results[calc_id]
            else:
                return {"status": "error", "message": "Calculation could not be found"}

    @app.post("/pyExport")
    async def pyExport(request_data: dict):
        #TODO: Implement a way to export Calq as a Python Module
        pass


    async def shutdown_server():
        logger.info("Shutting down server")
        await asyncio.sleep(5)
        if server:
            server.should_exit = True
            await server.shutdown()
        logger.info("Server shutdown complete")
        

    @app.get("/shutdown")
    async def shutdown():
        logger.info("Shutting down")
        asyncio.create_task(shutdown_server())
        return {"status": "shutdown"}

    def handle_sigterm(*args):
        logger.info("Received SIGTERM")
        asyncio.create_task(shutdown_server())
    signal.signal(signal.SIGTERM, handle_sigterm)
    signal.signal(signal.SIGINT, handle_sigterm)
    
    with open('uvicorn.log', 'w') as f:
        sys.stdout = f
        uvi_config = uvicorn.Config(app, host=args.host, port=args.port, workers=1) # Korrigiert: uvicorn.run nach der Initialisierung der app Instanz aufrufen.
        server = uvicorn.Server(uvi_config)
        asyncio.run(server.serve())