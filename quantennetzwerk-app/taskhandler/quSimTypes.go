package taskhandler

import "time"

type Project_Space struct {
	Name       string           `json:"name"`
	Created_At time.Time        `json:"created_at"`
	Updated_At time.Time        `json:"updated_at"`
	Blocks     map[string]Block `json:"blocks"`
	Wire       map[string]Wire  `json:"wire_nodes"`
	Qubits     map[string]Qubit `json:"qubits"`
}

type Block struct {
	Type string `json:"type"`
	X    int    `json:"x"`
	Y    int    `json:"y"`
}

type WireNode interface {
	IsWireNode()
}

type InputNode struct {
	Type string  `json:"type"`
	ID   string  `json:"id"`
	Port int     `json:"port"`
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
}

func (InputNode) IsWireNode() {}

type OutputNode struct {
	Type string  `json:"type"`
	ID   string  `json:"id"`
	Port int     `json:"port"`
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
}

func (OutputNode) IsWireNode() {}

type Node struct {
	Type string  `json:"type"`
	ID   string  `json:"id"`
	Port int     `json:"port"`
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
}

func (Node) IsWireNode() {}

type Wire map[string][]WireNode

type Qubit struct {
	ID           string       `json:"id"`
	Zustand      []complex128 `json:"zustand"`
	Beschreibung string       `json:"beschreibung,omitempty"`
}
