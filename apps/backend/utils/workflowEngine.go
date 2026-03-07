package utils

import (
	"context"
	"fmt"
	"maps"
)

func CollectInputs(
	nodeID string,
	dag *DAG,
	execCtx *ExecutionContext,
) map[string]any {
	inputs := make(map[string]any)

	for parentID, children := range dag.Edges {
		for _, child := range children {
			if child == nodeID {
				inputs[parentID] = execCtx.Results[parentID]
			}
		}
	}

	return inputs
}

func ExecuteNode(
	ctx context.Context,
	nodeID string,
	dag *DAG,
	execCtx *ExecutionContext,
) error {
	node := dag.Nodes[nodeID]

	inputs := CollectInputs(nodeID, dag, execCtx)

	// preloading inputs for start nodes
	if existing, ok := execCtx.Results[nodeID]; ok {
		if m, ok := existing.(map[string]any); ok {
			maps.Copy(inputs, m)
		}
	}

	executor := NodeRegistry[node.Type]
	if executor == nil {
		return fmt.Errorf("no executor registered for node type %q", node.Type)
	}

	fmt.Println("[executeNode] running", nodeID, "type", node.Type, "inputs:", inputs)
	output, err := executor(ctx, node, inputs)
	if err != nil {
		return err
	}

	execCtx.Results[nodeID] = output
	fmt.Println("[executeNode] finished", nodeID, "output:", output)
	return nil
}
