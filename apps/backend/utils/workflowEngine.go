package utils

import "context"

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
	nodeID string,
	dag *DAG,
	execCtx *ExecutionContext,
) error {
	node := dag.Nodes[nodeID]

	inputs := CollectInputs(nodeID, dag, execCtx)

	executor := NodeRegistry[node.Type]
	output, err := executor(context.Background(), node, inputs)
	if err != nil {
		return err
	}

	execCtx.Results[nodeID] = output
	return nil
}
