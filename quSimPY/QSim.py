import multiprocessing as mp
from typing import Any, Dict, List
import cirq
import numpy as np
import os


def dict2strEnds(d: dict) -> dict:
    # Wir haben das Problem, dass manchmal komische Wertetypen in den Dictionaries sind,
    # die nicht in json serialisiert werden können. Deshalb wandeln wir alle Werte in Strings um.
    new_dict = {}
    stack = [(d,())]
    while stack:
        current, pfad = stack.pop()
        if isinstance(current, dict):
            for key, value in current.items():
                stack.append((value, pfad + (str(key),))) # Keys müssen Strings sein, da sonst die Pfadverfolgung in append2NestedDict ein Albtraum wird.
        elif isinstance(current, list):
            for i, value in enumerate(current):
                stack.append((value, pfad + (i,)))
        else:
            new_dict = append2NestedDict(new_dict, pfad, str(current))
    return new_dict
    
def append2NestedDict(d: dict, keypath: tuple, value: Any) -> dict:
    # Fügt einen Wert in ein verschachteltes Dictionary ein.
    for key in keypath[:-1]:
        if key not in d:
            if isinstance(key, int):
                d[key] = []
            else:
                d[key] = {}
        d = d[key]
    if type(value) not in [bool, int, float, str] and value is not None:
        value = str(value) 
    if isinstance(keypath[-1], int):
        d.append(str(value))
    else:
        d[keypath[-1]] = str(value)
    return d
            
        



inoutRatio = {
    "qinput": (0, 1),
    "hadamard": (1, 1),
    "measure": (1, 0),
    "pauli_x": (1, 1),
    "pauli_y": (1, 1),
    "pauli_z": (1, 1),
    "cnot": (2, 2),
    "swap": (2, 2),
    "toffoli": (3, 3),
    "fredkin": (3, 3),
    "identity": (1, 1)
}


def create_operation(block_data: Dict[str, Any], input_qubits: List[cirq.Qid], block_id: str) -> cirq.Operation:
    """Erstellt eine cirq.Operation aus den Blockdaten."""
    kind = block_data["kind"]

    if kind == "qinput":
        return None

    if len(input_qubits) == 0:
        raise ValueError(f"Block {block_id} ({kind}) has no input qubits.")

    if kind == "hadamard":
        if len(input_qubits) != 1:
            raise ValueError(
                f"Hadamard gate (block {block_id}) must have exactly one input.")
        return cirq.H(input_qubits[0])

    elif kind == "measure":
        if len(input_qubits) != 1:
            raise ValueError(
                f"Measurement gate (block {block_id}) must have exactly one input.")
        return cirq.measure(input_qubits[0], key=block_id)

    elif kind == "pauli_x":
        if len(input_qubits) != 1:
            raise ValueError(
                f"Pauli-X gate (block {block_id}) must have exactly one input.")
        return cirq.X(input_qubits[0])

    elif kind == "pauli_y":
        if len(input_qubits) != 1:
            raise ValueError(
                f"Pauli-Y gate (block {block_id}) must have exactly one input.")
        return cirq.Y(input_qubits[0])

    elif kind == "pauli_z":
        if len(input_qubits) != 1:
            raise ValueError(
                f"Pauli-Z gate (block {block_id}) must have exactly one input.")
        return cirq.Z(input_qubits[0])

    elif kind == "cnot":
        if len(input_qubits) != 2:
            raise ValueError(
                f"CNOT gate (block {block_id}) must have exactly two inputs.")
        return cirq.CNOT(input_qubits[0], input_qubits[1])

    elif kind == "swap":
        if len(input_qubits) != 2:
            raise ValueError(
                f"SWAP gate (block {block_id}) must have exactly two inputs.")
        return cirq.SWAP(input_qubits[0], input_qubits[1])

    elif kind == "toffoli":
        if len(input_qubits) != 3:
            raise ValueError(
                f"Toffoli gate (block {block_id}) must have exactly three inputs.")
        return cirq.CCNOT(input_qubits[0], input_qubits[1], input_qubits[2])

    elif kind == "fredkin":
        if len(input_qubits) != 3:
            raise ValueError(
                f"Fredkin gate (block {block_id}) must have exactly three inputs.")
        return cirq.CSWAP(input_qubits[0], input_qubits[1], input_qubits[2])

    elif kind == "identity":
        if len(input_qubits) != 1:
            raise ValueError(
                f"Identity gate (block {block_id}) must have exactly one input")
        return cirq.I(input_qubits[0])

    else:
        raise ValueError(f"Unknown gate kind: {kind} in block {block_id}")


class QSim:

    def __init__(self, calc_stack, calc_id):
        self.calc_stack = calc_stack
        self.calc_id = calc_id
        self.calc_stack["result"] = {}
        self.wavefunctions = {}  # Speichert Wellenfunktionen nach Block-ID

    def j2c(self):
        self.my_inputs = self.get_inputs()
        self.qInput = cirq.LineQubit.range(len(self.my_inputs))

        # qInput den qinput-Blöcken zuweisen
        for i, input_block_id in enumerate(self.my_inputs):
            self.calc_stack["data"]["blocks"][input_block_id]["qbit"] = self.qInput[i]

        runner = self.my_inputs[:]  # Kopie erstellen
        waiters: List[wait_for_input] = []
        operators: List[cirq.Operation] = []
        operator_block_ids: List[str] = []

        while runner:
            my_runner = runner.pop(0)
            runner_block = self.calc_stack["data"]["blocks"][my_runner]
            next_runner_blocks = self.get_next_blocks(runner_block, my_runner)

            for next_runner in next_runner_blocks:
                next_block_id = next_runner.split('_')[1]
                self.calc_stack["data"]["blocks"][next_block_id]["qbit"] = self.calc_stack["data"]["blocks"][my_runner]["qbit"]

                # Überprüfen, ob next_runner in waiters wartet
                for waiter in waiters:
                    if waiter.is_qblock(next_runner):
                        waiter.add_input(
                            self.calc_stack["data"]["blocks"][next_block_id]["qbit"])
                        if waiter.complete():
                            operation, err = waiter.get_cirq_operation()
                            if err:
                                self.calc_stack[self.calc_id]["error"] = err
                                return  # Beende bei Fehler.

                            operators.append(operation)
                            operator_block_ids.append(waiter.block_id)

                            # Berechne und speichere Wellenfunktion
                            self.calculate_and_store_wavefunction(
                                operators, operator_block_ids[-1])
                            waiters.remove(waiter)
                            # Füge den nächsten Block zur Warteschlange hinzu, wenn er nicht vom Typ 'measure' ist
                            if self.calc_stack["data"]["blocks"][next_block_id]["kind"] != "measure":
                                if len(next_runner.split('_')) == 3:
                                    runner.append(next_runner.split('_')[1])
                                else:
                                    runner.append(next_runner)
                            break  # Innere Schleife verlassen, da waiter entfernt wurde

                else:  # Wird ausgeführt, wenn die innere Schleife nicht mit break beendet wurde.
                    new_waiter = wait_for_input(
                        self.calc_stack["data"]["blocks"][next_block_id]["kind"], next_runner, self.calc_stack["data"]["blocks"][next_block_id]["qbit"])
                    if new_waiter.complete():
                        operation, err = new_waiter.get_cirq_operation()
                        if err:
                            self.calc_stack["error"] = err
                            return

                        operators.append(operation)
                        operator_block_ids.append(new_waiter.block_id)

                        # Berechne und speichere Wellenfunktion
                        self.calculate_and_store_wavefunction(
                            operators, operator_block_ids[-1])
                        # Füge den nächsten Block zur Warteschlange hinzu, wenn er nicht vom Typ 'measure' ist
                        if self.calc_stack["data"]["blocks"][next_block_id]["kind"] != "measure":
                            if len(next_runner.split('_')) == 3:
                                runner.append(next_runner.split('_')[1])
                            else:
                                runner.append(next_runner)

                    else:
                        waiters.append(new_waiter)
        # Circuit erstellen
        self.calc_stack["result"]["cirquit"] = cirq.Circuit(operators)
        # Speichere die Wellenfunktionen im calc_stack
        self.calc_stack["result"]["wavefunctions"] = self.wavefunctions
        # Endergebnisse berechnen
        self.calculate_final_results()

    def get_inputs(self):
        return [key for key in self.calc_stack["data"]["blocks"] if self.calc_stack["data"]["blocks"][key]["kind"] == "qinput"]

    def get_next_blocks(self, block: Dict[str, Any], block_id: str) -> List[str]:
        rets = []
        outputs = block["outputWireIds"]
        for output in outputs:
            if output == 0 or output == None:
                continue
            wireSession = self.findWireSession(output)
            if wireSession is None:
                self.calc_stack["error"] = "WireSession not found on Block: " + str(block["id"])
                return []  # Fehlerfall: Gib leere Liste zurück

            qbit_start: str = self.calc_stack["data"]["wire_session"][wireSession]["qbit_start"]
            qbit_end: str = self.calc_stack["data"]["wire_session"][wireSession]["qbit_end"]

            if qbit_start == qbit_end:
                self.calc_stack["error"] = "Circel Wire Session at: " + block["id"]
                return []

            splitted_end = qbit_end.split("_")
            splitted_start = qbit_start.split("_")

            if splitted_start[0] == splitted_end[0]:
                self.calc_stack["error"] = f"{splitted_start[0]} on {splitted_end[0]} at: {block['id']} is not allowed"
                return []

            if splitted_start[1] == block_id:
                rets.append(qbit_end)
            else:
                rets.append(qbit_start)
        return rets

    def findWireSession(self, wireId) -> str:
        for key, val in self.calc_stack["data"]["wire_session"].items():
            for wire in val["wires"]:
                if wire["id"] == wireId:
                    return key
        return None

    def calculate_and_store_wavefunction(self, operators: List[cirq.Operation], block_id: str):
        """Berechnet die Wellenfunktion nach Anwendung einer Liste von Operationen."""
        circuit = cirq.Circuit(operators)
        simulator = cirq.Simulator()
        try:
            result = simulator.simulate(circuit)
            # In Liste konvertieren
            self.wavefunctions[block_id] = result.final_state_vector.tolist()
        except Exception as e:
            # Fehler als String speichern
            self.wavefunctions[block_id] = [str(e)]

    def calculate_final_results(self):
        """Berechnet die Endergebnisse (Wellenfunktion und Messwahrscheinlichkeiten)."""
        simulator = cirq.Simulator()
        try:
            # Überprüfen, ob Messgatter vorhanden sind
            has_measurements = any(isinstance(op.gate, cirq.MeasurementGate) for op in self.calc_stack["result"]["cirquit"].all_operations())

            if has_measurements:
                # Circuit mit Wiederholungen ausführen, um Messstatistiken zu erhalten
                result = simulator.run(self.calc_stack["result"]["cirquit"], repetitions=1000)  # Oder eine andere Anzahl von Wiederholungen

                keys = [key for key in result.records.keys()]
                if len(keys) == 0:
                    raise ValueError("No measurement results found.")
                measurement_Counts = {}
                for key in keys:
                    try:
                        counts = result.histogram(key=key)
                        measurement_Counts[key] = counts
                    except Exception as e:
                        pass    # Ignoriere Fehler bei der Zählung
                self.calc_stack["result"]["measurement_counts"] = measurement_Counts


                # Nach der Messung gibt es keine eindeutige Wellenfunktion mehr.
                self.calc_stack["result"]["final_wavefunction"] = None
                self.calc_stack["result"]["probabilities"] = []

            else:
                # Circuit ohne Messungen -> Wellenfunktion berechnen
                result = simulator.simulate(self.calc_stack["result"]["cirquit"])
                self.calc_stack["result"]["final_wavefunction"] = result.final_state_vector.tolist()

                # Messwahrscheinlichkeiten berechnen (nur sinnvoll, wenn keine Messgatter)
                num_qubits = len(self.qInput)
                probabilities = cirq.qis.bloch_vector_from_state_vector(result.final_state_vector, num_qubits - 1 if num_qubits > 0 else 0)
                self.calc_stack["result"]["probabilities"] = probabilities.tolist()
                self.calc_stack["result"]["measurement_counts"] = "" # Keine Messungen, leere counts.

        except Exception as e:
            self.calc_stack["result"]["final_wavefunction"] = [str(e)]
            self.calc_stack["result"]["probabilities"] = []
            self.calc_stack["result"]["measurement_counts"] = str(e)

    def result(self):
        return dict2strEnds(self.calc_stack["result"])       
    
    def export_cirq(self,path,name):
        """Exportiert den Circuit als Cirq-Objekt."""
        os.path.exists(path) or os.makedirs(path)
        with open(os.path.join(path,name+".cirq"), "w") as f:
            jsonCirq = self.calc_stack["result"]["cirquit"].to_json()
            f.write(jsonCirq)

class wait_for_input:
    def __init__(self, kind, block_id, qbit):
        self.kind = kind
        self.block_id = block_id
        self.qbits = [qbit]

    def is_qblock(self, block_id):
        return block_id.split("_")[1] == self.block_id.split("_")[1]

    def has_qbit(self, qbit):
        return qbit in self.qbits

    def add_input(self, qbit):
        self.qbits.append(qbit)

    def complete(self):
        return len(self.qbits) == inoutRatio[self.kind][0]

    def get_cirq_operation(self) -> tuple[cirq.Operation, str]:
        ret = None
        err = None
        try:
            if self.kind == "qinput":
                return None, None  # qinput erzeugt keine Operation.

            if self.kind == "hadamard":
                ret = cirq.H(self.qbits[0])
            elif self.kind == "measure":
                ret = cirq.measure(self.qbits[0], key=self.block_id)
            elif self.kind == "pauli_x":
                ret = cirq.X(self.qbits[0])
            elif self.kind == "pauli_y":
                ret = cirq.Y(self.qbits[0])
            elif self.kind == "pauli_z":
                ret = cirq.Z(self.qbits[0])
            elif self.kind == "cnot":
                ret = cirq.CNOT(self.qbits[0], self.qbits[1])
            elif self.kind == "swap":
                ret = cirq.SWAP(self.qbits[0], self.qbits[1])
            elif self.kind == "toffoli":
                ret = cirq.CCNOT(self.qbits[0], self.qbits[1], self.qbits[2])
            elif self.kind == "fredkin":
                ret = cirq.CSWAP(self.qbits[0], self.qbits[1], self.qbits[2])
            elif self.kind == "identity":
                ret = cirq.I(self.qbits[0])
            else:
                raise ValueError(
                    f"Unknown gate kind: {self.kind} in block {self.block_id}")
        except Exception as e:
            err = str(e)
        return ret, err
