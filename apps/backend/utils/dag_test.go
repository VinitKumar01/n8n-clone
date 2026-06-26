package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuildDAG(t *testing.T) {
	nodes := []Node{
		{ID: "node-1", Type: "triggerManually"},
		{ID: "node-2", Type: "showOutput"},
		{ID: "node-3", Type: "mergeNode"},
	}
	edges := []Edge{
		{From: "node-1", To: "node-2"},
		{From: "node-2", To: "node-3"},
	}

	dag := BuildDAG(nodes, edges)

	// Verify Nodes
	assert.Len(t, dag.Nodes, 3)
	assert.Equal(t, "triggerManually", dag.Nodes["node-1"].Type)
	assert.Equal(t, "showOutput", dag.Nodes["node-2"].Type)
	assert.Equal(t, "mergeNode", dag.Nodes["node-3"].Type)

	// Verify Edges
	assert.Len(t, dag.Edges, 2)
	assert.Equal(t, []string{"node-2"}, dag.Edges["node-1"])
	assert.Equal(t, []string{"node-3"}, dag.Edges["node-2"])

	// Verify InDegree
	assert.Equal(t, 0, dag.InDegree["node-1"])
	assert.Equal(t, 1, dag.InDegree["node-2"])
	assert.Equal(t, 1, dag.InDegree["node-3"])
}

func TestHasCycle(t *testing.T) {
	t.Run("Acyclic graph", func(t *testing.T) {
		nodes := []Node{
			{ID: "A"}, {ID: "B"}, {ID: "C"},
		}
		edges := []Edge{
			{From: "A", To: "B"},
			{From: "B", To: "C"},
		}
		dag := BuildDAG(nodes, edges)
		assert.False(t, HasCycle(&dag))
	})

	t.Run("Graph with self-cycle", func(t *testing.T) {
		nodes := []Node{
			{ID: "A"},
		}
		edges := []Edge{
			{From: "A", To: "A"},
		}
		dag := BuildDAG(nodes, edges)
		assert.True(t, HasCycle(&dag))
	})

	t.Run("Graph with multi-node cycle", func(t *testing.T) {
		nodes := []Node{
			{ID: "A"}, {ID: "B"}, {ID: "C"},
		}
		edges := []Edge{
			{From: "A", To: "B"},
			{From: "B", To: "C"},
			{From: "C", To: "A"},
		}
		dag := BuildDAG(nodes, edges)
		assert.True(t, HasCycle(&dag))
	})

	t.Run("Disconnected acyclic graph", func(t *testing.T) {
		nodes := []Node{
			{ID: "A"}, {ID: "B"}, {ID: "C"}, {ID: "D"},
		}
		edges := []Edge{
			{From: "A", To: "B"},
			{From: "C", To: "D"},
		}
		dag := BuildDAG(nodes, edges)
		assert.False(t, HasCycle(&dag))
	})
}

func TestTopologicalSort(t *testing.T) {
	t.Run("Successful topological sort", func(t *testing.T) {
		nodes := []Node{
			{ID: "A"}, {ID: "B"}, {ID: "C"}, {ID: "D"},
		}
		edges := []Edge{
			{From: "A", To: "B"},
			{From: "A", To: "C"},
			{From: "B", To: "D"},
			{From: "C", To: "D"},
		}
		dag := BuildDAG(nodes, edges)
		order, err := TopologicalSort(&dag)
		assert.NoError(t, err)
		assert.Len(t, order, 4)

		// A must be first
		assert.Equal(t, "A", order[0])
		// D must be last
		assert.Equal(t, "D", order[3])
		// Middle elements should be B and C in some order
		assert.Contains(t, []string{"B", "C"}, order[1])
		assert.Contains(t, []string{"B", "C"}, order[2])
	})

	t.Run("Topological sort fails due to cycle", func(t *testing.T) {
		nodes := []Node{
			{ID: "A"}, {ID: "B"}, {ID: "C"},
		}
		edges := []Edge{
			{From: "A", To: "B"},
			{From: "B", To: "C"},
			{From: "C", To: "A"},
		}
		dag := BuildDAG(nodes, edges)
		order, err := TopologicalSort(&dag)
		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "cycle detected")
	})
}
