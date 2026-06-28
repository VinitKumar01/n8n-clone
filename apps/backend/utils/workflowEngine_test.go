package utils

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExecuteWorkflow(t *testing.T) {
	// Register mock executors to NodeRegistry for our testing nodes
	NodeRegistry["testTrigger"] = func(ctx context.Context, node Node, inputs map[string]any) (any, error) {
		return map[string]any{"triggered": true}, nil
	}
	NodeRegistry["testOutput"] = func(ctx context.Context, node Node, inputs map[string]any) (any, error) {
		return inputs, nil
	}

	t.Run("simple flow", func(t *testing.T) {
		nodes := []Node{
			{ID: "node-1", Type: "testTrigger"},
			{ID: "node-2", Type: "testOutput"},
		}
		edges := []Edge{
			{From: "node-1", To: "node-2"},
		}
		dag := BuildDAG(nodes, edges)

		results, err := ExecuteWorkflow(context.Background(), "w-1", &dag, "node-1", nil)
		assert.NoError(t, err)
		assert.NotNil(t, results)

		// check node-1 result
		res1, ok := results["node-1"].(map[string]any)
		assert.True(t, ok)
		assert.True(t, res1["triggered"].(bool))

		// check node-2 result (which should contain output of node-1 under the key "node-1")
		res2, ok := results["node-2"].(map[string]any)
		assert.True(t, ok)
		assert.Equal(t, res1, res2["node-1"])
	})

	t.Run("flow with unreachable node", func(t *testing.T) {
		// A (startNode, testTrigger) -> B (testOutput)
		// C (unreachable, testTrigger) -> B (testOutput)
		// This tests the user's fix. InDegree initialization should handle the fact that
		// C is unreachable, so B should execute once A finishes.
		nodes := []Node{
			{ID: "A", Type: "testTrigger"},
			{ID: "B", Type: "testOutput"},
			{ID: "C", Type: "testTrigger"},
		}
		edges := []Edge{
			{From: "A", To: "B"},
			{From: "C", To: "B"},
		}
		dag := BuildDAG(nodes, edges)

		// Before the user's change:
		// dag.InDegree["B"] is 2.
		// If we run ExecuteWorkflow from "A", B's indegree would only drop to 1 when A finished,
		// and B would never run because C was never executed.
		// With the user's change:
		// B's initial indegree in execCtx is 1 (only A is reachable).
		// When A finishes, B's indegree drops to 0, and B runs successfully.
		results, err := ExecuteWorkflow(context.Background(), "w-2", &dag, "A", nil)
		assert.NoError(t, err)
		assert.NotNil(t, results)

		assert.Contains(t, results, "A")
		assert.Contains(t, results, "B")
		assert.NotContains(t, results, "C") // C was unreachable and should not run
	})
}
