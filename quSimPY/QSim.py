import multiprocessing as mp
from typing import Any, Dict, List
import cirq


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
        """Erstellt eine cirq.Operation aus den Blockdaten.

        Args:
            block_data: Ein Dictionary mit den Daten des Blocks (aus dem JSON).
            input_qubits: Eine Liste der cirq.Qid-Objekte, die die Eingangs-Qubits
                für diesen Block darstellen.
            block_id: Die ID des Blocks (für Fehlermeldungen und Mess-Keys).

        Returns:
            Eine cirq.Operation oder None, wenn der Block ein qinput ist.

        Raises:
            ValueError: Wenn die Blockdaten ungültig sind (z.B. falsche Anzahl
                von Eingängen, unbekannter Gattertyp).
        """
        kind = block_data["kind"]

        if kind == "qinput":
            return None  # qinput-Blöcke erzeugen keine Operationen in Cirq.

        # Stelle sicher, dass es Eingangs-Qubits gibt (außer bei qinput).
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
            # block_id als Mess-Key
            return cirq.measure(input_qubits[0], key=block_id)

        elif kind == "pauli_x":  # Oder "X"
            if len(input_qubits) != 1:
                raise ValueError(
                    f"Pauli-X gate (block {block_id}) must have exactly one input.")
            return cirq.X(input_qubits[0])

        elif kind == "pauli_y":  # Oder "Y"
            if len(input_qubits) != 1:
                raise ValueError(
                    f"Pauli-Y gate (block {block_id}) must have exactly one input.")
            return cirq.Y(input_qubits[0])

        elif kind == "pauli_z":  # Oder "Z"
            if len(input_qubits) != 1:
                raise ValueError(
                    f"Pauli-Z gate (block {block_id}) must have exactly one input.")
            return cirq.Z(input_qubits[0])

        elif kind == "cnot":
            if len(input_qubits) != 2:
                raise ValueError(
                    f"CNOT gate (block {block_id}) must have exactly two inputs.")
            # control, target
            return cirq.CNOT(input_qubits[0], input_qubits[1])

        elif kind == "swap":
            if len(input_qubits) != 2:
                raise ValueError(
                    f"SWAP gate (block {block_id}) must have exactly two inputs.")
            return cirq.SWAP(input_qubits[0], input_qubits[1])

        elif kind == "toffoli":  # Oder "CCNOT"
            if len(input_qubits) != 3:
                raise ValueError(
                    f"Toffoli gate (block {block_id}) must have exactly three inputs.")
            # control1, control2, target
            return cirq.CCNOT(input_qubits[0], input_qubits[1], input_qubits[2])

        elif kind == "fredkin":  # Oder "CSWAP"
            if len(input_qubits) != 3:
                raise ValueError(
                    f"Fredkin gate (block {block_id}) must have exactly three inputs.")
            # control, target1, target2
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

    def j2c(self):
        # Wir erstellen hier das Circuit-Objekt
        self.my_inputs = self.get_inputs()
        self.qInput = cirq.LineQubit.range(len(self.my_inputs))
        #bind qInput to qinput
        for i in range(len(self.my_inputs)):
            self.calc_stack["data"]["blocks"][self.my_inputs[i]]["qbit"] = self.qInput[i]
        
        jumper = 0
        runner = self.my_inputs
        waiters:list[wait_for_input] = []
        operator:list[cirq.Operation] = []
        operator_block_id = [] 
        while len(runner) > 0:
            my_runner = runner.pop(0)
            runner_block = self.calc_stack["data"]["blocks"][my_runner]
            next_runner_blocks = self.get_next_blocks(runner_block, my_runner)
            for next_runner in next_runner_blocks:
                self.calc_stack["data"]["blocks"][next_runner.split('_')[1]]["qbit"] = self.calc_stack["data"]["blocks"][my_runner]["qbit"]
                for waiter in waiters:
                    if waiter.is_qblock(next_runner):
                        waiter.add_input(self.calc_stack["data"]["blocks"][next_runner.split('_')[1]]["qbit"])
                        if waiter.complete():
                            operation, err = waiter.get_cirq_operation()
                            if err is not None:
                                self.calc_stack[self.calc_id]["error"] = err
                                exit(1)
                            operator.append(operation)
                            operator_block_id.append(waiter.block_id)
                            waiters.remove(waiter)
                            if len(next_runner.split('_')) == 3:
                                runner.append(next_runner.split('_')[1])
                            else:
                                runner.append(next_runner)
                            jumper = 1
                        break
                if jumper == 1:
                    jumper = 0
                    continue
                new_waiter = wait_for_input(self.calc_stack["data"]["blocks"][next_runner.split('_')[1]]["kind"], next_runner, self.calc_stack["data"]["blocks"][next_runner.split('_')[1]]["qbit"])
                if new_waiter.complete():
                    operation, err = new_waiter.get_cirq_operation()
                    if err is not None:
                        self.calc_stack["error"] = err
                        exit(1)
                    operator.append(operation)
                    operator_block_id.append(new_waiter.block_id)
                    if len(next_runner.split('_')) == 3:
                        runner.append(next_runner.split('_')[1])
                        break
                    runner.append(next_runner)
                    break
                waiters.append(new_waiter)
        self.calc_stack["cirquit"] = cirq.Circuit(operator)
        
        
        
    def get_inputs(self):
        ret = []
        for key in self.calc_stack["data"]["blocks"]:
            if self.calc_stack["data"]["blocks"][key]["kind"] == "qinput":
                ret.append(key)
        return ret


    def get_next_blocks(self, block: Dict[str, Any], block_id: str) -> list[str]:
        rets = []
        outputs = block["outputWireIds"]
        for output in outputs:
            if output == 0:
                continue # 0 keine Ahnung warum, aber passiert halt.
            wireSession = self.findWireSession(output)
            if wireSession is None:
                self.calc_stack["error"] = "WireSession not found on Block: " + block["id"]
                exit(1)
            qbit_start:str = self.calc_stack["data"]["wire_session"][wireSession]["qbit_start"]
            qbit_end:str = self.calc_stack["data"]["wire_session"][wireSession]["qbit_end"]
            if qbit_start == qbit_end:
                self.calc_stack["error"] = "Circel Wire Session at: " + block["id"]
                exit(1)
            splitted_end = qbit_end.split("_")
            splitted_start = qbit_start.split("_")
            if splitted_start[0] == splitted_end[0]:
                self.calc_stack["error"] = splitted_start[0] + " on " + splitted_end[0] + " at: " + block["id"] + " is not allowed"
                exit(1)
            if splitted_start[1] == block_id:
                rets.append(qbit_end)
                continue
            rets.append(qbit_start)
        return rets

                


    def findWireSession(self, wireId)->str:
        for key in self.calc_stack["data"]["wire_session"]:
            val = self.calc_stack["data"]["wire_session"][key]
            for wire in val["wires"]:
                if wire["id"] == wireId:
                    return key
        return None


class wait_for_input:
    def __init__(self, kind, block_id, qbit):
        self.kind = kind
        self.block_id = block_id
        self.qbits = []
        self.qbits.append(qbit)

    def is_qblock(self, block_id):
        return block_id.split("_")[1] == self.block_id.split("_")[1]

    def has_qbit(self, qbit):
        return qbit in self.qbits

    def add_input(self, qbit):
        self.qbits.append(qbit)
        
    def complete(self):
        return len(self.qbits) == inoutRatio[self.kind][0]
    
    def get_cirq_operation(self)->tuple[cirq.Operation, str]:
        """
        Erstellt eine cirq.Operation aus den Blockdaten.
        Returns:
            tuple[cirq.Operation | None, str]: Eine cirq.Operation oder None, wenn der Block ein qinput ist oder ein Fehler auftritt.
            Der String ist eine Error Message und sollte None sein, wenn kein Fehler auftritt.
        """
        ret = None
        err = None
        if self.kind == "qinput":
            return None # qinput-Blöcke erzeugen keine Operationen in Cirq. Allerdings muss man sich auch wundern, warum wir hier sind.
        try:
            if self.kind == "hadamard":
                ret = cirq.H(self.qbits[0])
            elif self.kind == "measure":
                ret = cirq.measure(self.qbits[0], key=self.block_id)
            elif self.kind == "pauli_x":
                ret = cirq.X(self.qbits[0])
            elif self.kind == "pauli_y":
                ret = cirq.Y(self.qbits[0])
            elif self.kind == "pauli_z":
                ret =  cirq.Z(self.qbits[0])
            elif self.kind == "cnot":
                ret =  cirq.CNOT(self.qbits[0], self.qbits[1])
            elif self.kind == "swap":
                ret = cirq.SWAP(self.qbits[0], self.qbits[1])
            elif self.kind == "toffoli":
                ret = cirq.CCNOT(self.qbits[0], self.qbits[1], self.qbits[2])
            elif self.kind == "fredkin":
                ret = cirq.CSWAP(self.qbits[0], self.qbits[1], self.qbits[2])
            elif self.kind == "identity":
                ret = cirq.I(self.qbits[0])
            else:
                raise ValueError(f"Unknown gate kind: {self.kind} in block {self.block_id}")
        except Exception as e:
            err = str(e)
        return ret, err