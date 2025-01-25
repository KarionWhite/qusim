from pydantic import BaseModel
import tensorflow as tf
import numpy as np
import cirq as cq


class QuSimBlock(BaseModel):
    block: str
    x : int
    y : int

class QuSimWireNode(BaseModel):
    type: str   # input, output, wire
    id: str     # id des Blocks
    port: str   # port des Blocks
    x : int
    y : int

class QuSimData(BaseModel):
    #Das erste Element ist die ID des Blocks und ist einzigartig
    blocks: dict[str, QuSimBlock]
    wire_nodes: dict[str, QuSimWireNode]

class qusim:

    class I(cq.Gate):           # Identitäts-Gatter
        def _num_qubits_(self):
            return 1

        def _unitary_(self):
            return np.array([[1, 0], [0, 1]])
        
        def _circuit_diagram_info_(self, args):
            return "I"

    class Custom_gate(cq.Gate):          # Vorbereitet aber noch nicht implementiert!

        def __init__(self, qubit_num:int=1, array:np.ndarray=np.array([[1,0],[0,1]]), name:str="XX"):
            self.qubit_num = qubit_num
            self.array = array
            self.name = name

        def _num_qubits_(self):
            return self.qubit_num
        
        def _unitary_(self):
            return self.array
        
        def _circuit_diagram_info_(self, args):
            return self.name

    H = cq.H            # Hadamard-Gatter
    CNOT = cq.CNOT      # CNOT-Gatter
    X = cq.X            # Pauli-X-Gatter
    Y = cq.Y            # Pauli-Y-Gatter
    Z = cq.Z            # Pauli-Z-Gatter
    SWAP = cq.SWAP      # SWAP-Gatter
    CCX = cq.CCX        # Toffoli-Gatter
    CSWAP = cq.CSWAP    # Fredkin-Gatter

    def __init__(self, quSimData: QuSimData):
        """
        Initialisiert die QuSim Instanz.
        @param quSimData: Die Daten, die für die Simulation benötigt werden.
        """
        self.quSimData = quSimData

    def check_data(self)->bool:
        """
        Überprüft die Daten, die für die Simulation benötigt werden.
        Zudem lesen wir es gleich in eine cirq System ein.
        @return: True, wenn die Daten korrekt sind, sonst False.
        """


        

    