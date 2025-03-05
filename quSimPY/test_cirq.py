import cirq
from typing import List

def modular_exponentiation_4qubit(input_qubits: List[cirq.Qid], output_qubits: List[cirq.Qid]) -> List[cirq.Operation]:
    """
    Erstellt eine Schaltung für die modulare Exponentiation a^x mod N für a=7,
    N=15, mit 4 Eingangs- und 4 Ausgangsqubits. Verwendet CNOT und einzelne
    Qubit-Gatter.  Diese Implementierung ist immer noch VEREINFACHT und
    NICHT für die allgemeine Faktorisierung geeignet.

    Args:
        input_qubits:  Liste der Eingangs-Qubits (Kontrollregister, x).
        output_qubits: Liste der Ausgangs-Qubits (Zielregister, a^x mod N).

    Returns:
        Eine Liste von Cirq-Operationen, die die modulare Exponentiation
        (vereinfacht) implementieren.
    """

    if len(input_qubits) != 4 or len(output_qubits) != 4:
        raise ValueError("This function requires 4 input and 4 output qubits.")

    ops = []

    # Initialisiere das Ausgaberegister mit |0001⟩, da 7^0 mod 15 = 1.
    # Dies geschieht außerhalb der kontrollierten Operationen.  Wenn der
    # Eingang 0 ist, bleibt das Ausgaberegister unverändert.
    # ops.append(cirq.X(output_qubits[0])) # Wird schon im initial state gemacht

    # Kontrollierte Operationen für a=7, N=15:
    #  7^1 mod 15 = 7  (|0111⟩)
    #  7^2 mod 15 = 4  (|0100⟩)
    #  7^4 mod 15 = 1  (|0001⟩)
    #  7^8 mod 15 = 1  (|0001⟩)
    # ... und so weiter, die Periode ist 4.

    # Kontrolliert von input_qubits[0] (2^0 = 1):  7^1 mod 15 = 7
    ops.append(cirq.CNOT(input_qubits[0], output_qubits[0]))  # |0⟩ -> |1⟩
    ops.append(cirq.CNOT(input_qubits[0], output_qubits[1]))  # |0⟩ -> |1⟩
    ops.append(cirq.CNOT(input_qubits[0], output_qubits[2]))  # |0⟩ -> |1⟩

    # Kontrolliert von input_qubits[1] (2^1 = 2):  7^2 mod 15 = 4
    ops.append(cirq.CNOT(input_qubits[1], output_qubits[2]))  # |0⟩ -> |1⟩


    # Kontrolliert von input_qubits[2] (2^2 = 4):  7^4 mod 15 = 1
    # Keine Operationen nötig, da das Ergebnis 1 ist (Ausgangsregister bleibt |0001⟩).

    # Kontrolliert von input_qubits[3] (2^3 = 8): 7^8 mod 15 = 1
    # Keine Operationen nötig.

    return ops

# Definiere zwei Qubits
input_qubits = cirq.LineQubit.range(4)
output_qubits = cirq.LineQubit.range(4, 8)
all_qubits = input_qubits + output_qubits

N=15
a=7

# Erstelle eine Schaltung
circuit = cirq.Circuit(
       # 1. Superposition im Eingangsregister.
        cirq.H.on_each(*input_qubits),

        # 2. Modulare Exponentiation (VEREINFACHT!).
        modular_exponentiation_4qubit(input_qubits, output_qubits),

        # 3. Inverse QFT auf dem Eingangsregister.
        cirq.qft(*input_qubits, inverse=True),

        # 4. Messung des Eingangsregisters.
        cirq.measure(*input_qubits, key='result')
    )
print(circuit)

# Simuliere die Schaltung
simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions=100)

# Gib die Ergebnisse aus
print(result)

# Zähle die Häufigkeiten der Messergebnisse
counts = result.histogram(key='result')

# Berechne die Wahrscheinlichkeiten
probabilities = {
    outcome: count / result.repetitions for outcome, count in counts.items()
}

# Gib die Wahrscheinlichkeiten aus
print(probabilities)