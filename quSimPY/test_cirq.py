import cirq

# Definiere zwei Qubits
qubit1 = cirq.GridQubit(0, 0)
qubit2 = cirq.GridQubit(0, 1)

# Erstelle eine Schaltung
circuit = cirq.Circuit(
    cirq.H(qubit1),  # Hadamard-Gatter auf qubit1
    cirq.CNOT(qubit1, qubit2),  # CNOT-Gatter auf qubit1 und qubit2
    cirq.measure(qubit1, qubit2, key='result')  # Messung der Qubits
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