package utils

import (
	"fmt"
	"maps"
)

type Node struct {
	ID   string         `json:"id"`
	Type string         `json:"type"`
	Data map[string]any `json:"data"`
}

type Edge struct {
	From string `json:"source"`
	To   string `json:"target"`
}

type DAG struct {
	Nodes    map[string]Node
	Edges    map[string][]string
	InDegree map[string]int
}

func BuildDAG(nodes []Node, edges []Edge) DAG {
	dag := DAG{
		Nodes:    make(map[string]Node),
		Edges:    make(map[string][]string),
		InDegree: make(map[string]int),
	}

	for _, node := range nodes {
		dag.Nodes[node.ID] = node
		dag.InDegree[node.ID] = 0
	}

	for _, edge := range edges {
		dag.Edges[edge.From] = append(dag.Edges[edge.From], edge.To)
		dag.InDegree[edge.To]++
	}

	return dag
}

func HasCycle(dag *DAG) bool {
	queue := []string{}

	inDeg := make(map[string]int)
	maps.Copy(inDeg, dag.InDegree)

	for nodeId, deg := range inDeg {
		if deg == 0 {
			queue = append(queue, nodeId)
		}
	}

	visited := 0

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		visited++

		for _, neighbour := range dag.Edges[current] {
			inDeg[neighbour]--
			if inDeg[neighbour] == 0 {
				queue = append(queue, neighbour)
			}
		}
	}

	return visited != len(dag.Nodes)
}

func TopologicalSort(dag *DAG) ([]string, error) {
	queue := []string{}
	order := []string{}

	inDeg := make(map[string]int)
	maps.Copy(inDeg, dag.InDegree)

	for nodeId, deg := range inDeg {
		if deg == 0 {
			queue = append(queue, nodeId)
		}
	}

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]

		order = append(order, current)

		for _, neighbour := range dag.Edges[current] {
			inDeg[neighbour]--
			if inDeg[neighbour] == 0 {
				queue = append(queue, neighbour)
			}
		}
	}

	if len(order) != len(dag.Nodes) {
		return nil, fmt.Errorf("cycle detected, can't topological sort")
	}

	return order, nil
}
