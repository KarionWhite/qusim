package taskhandler

import (
	"time"
)

type Project_Space struct {
	PHeader     ProjectHeader          `json:"project_header"`
	Blocks      map[string]Block       `json:"blocks"`
	WireSession map[string]WireSession `json:"wire_session"`
	Qubits      map[string]Qubit       `json:"qubits"`
}

type ProjectHeader struct {
	Name        string    `json:"name"`
	Created_At  time.Time `json:"created_at"`
	Updated_At  time.Time `json:"updated_at"`
	Description string    `json:"description"`
}

type Block struct {
	Type          string `json:"kind"`
	X             int    `json:"x"`
	Y             int    `json:"y"`
	InputWireIDs  []int  `json:"inputWireIds"`
	OutputWireIDs []int  `json:"outputWireIds"`
}

type WireSession struct {
	QbitStart string `json:"qbit_start"`
	QbitEnd   string `json:"qbit_end"`
	Wires     []Wire `json:"wires"`
}

type Wire struct {
	ID        int    `json:"id"`
	X         int    `json:"x"`
	Y         int    `json:"y"`
	Direction [2]int `json:"direction"`
}

type Qubit struct {
	ID           string       `json:"id"`
	Zustand      []complex128 `json:"zustand"`
	Beschreibung string       `json:"beschreibung,omitempty"`
}
