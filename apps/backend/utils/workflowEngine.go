package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"maps"
	"sync"
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

// UnmarshalAny decodes raw workflow data into Go types.
func UnmarshalAny(raw any, dest any) error {
	switch v := raw.(type) {
	case string:
		return json.Unmarshal([]byte(v), dest)
	case []byte:
		return json.Unmarshal(v, dest)
	default:
		b, err := json.Marshal(v)
		if err != nil {
			return err
		}
		return json.Unmarshal(b, dest)
	}
}

// LoadDAG deserializes workflow nodes, edges, and in-degree metadata and builds a DAG.
func LoadDAG(nodesJSON, edgesJSON, inDegreeJSON any) (*DAG, error) {
	var edges map[string][]string
	var inDegree map[string]int
	var nodes []Node

	if err := UnmarshalAny(edgesJSON, &edges); err != nil {
		return nil, fmt.Errorf("failed to parse edges metadata: %w", err)
	}

	if err := UnmarshalAny(inDegreeJSON, &inDegree); err != nil {
		return nil, fmt.Errorf("failed to parse inDegree metadata: %w", err)
	}

	if err := UnmarshalAny(nodesJSON, &nodes); err != nil {
		return nil, fmt.Errorf("failed to parse nodes: %w", err)
	}

	dag := &DAG{
		Nodes:    make(map[string]Node),
		Edges:    edges,
		InDegree: make(map[string]int),
	}

	maps.Copy(dag.InDegree, inDegree)

	for _, n := range nodes {
		dag.Nodes[n.ID] = n
	}

	return dag, nil
}

func ExecuteWorkflow(
	ctx context.Context,
	workflowID string,
	dag *DAG,
	startNode string,
	initialResults map[string]any,
) (map[string]any, error) {
	execCtx := &ExecutionContext{
		WorkflowID: workflowID,
		Results:    make(map[string]any),
		InDegree:   make(map[string]int),
	}

	maps.Copy(execCtx.InDegree, dag.InDegree)

	maps.Copy(execCtx.Results, initialResults)

	ctxCancel, cancel := context.WithCancel(ctx)
	defer cancel()

	var mu sync.Mutex
	errCh := make(chan error, 1)

	queue := NewTaskQueue(100)

	queue.StartWorkers(ctxCancel, 4, func(ctx context.Context, nodeID string) error {
		fmt.Println("[worker-wrapper] received job:", nodeID)
		if err := ExecuteNode(ctx, nodeID, dag, execCtx); err != nil {
			errCh <- err
			cancel()
			return err
		}

		mu.Lock()
		defer mu.Unlock()

		for _, child := range dag.Edges[nodeID] {
			execCtx.InDegree[child]--
			fmt.Printf("[worker-wrapper] decremented indegree of %s -> %d\n", child, execCtx.InDegree[child])
			if execCtx.InDegree[child] == 0 {
				fmt.Printf("[worker-wrapper] enqueueing child %s\n", child)
				queue.Enqueue(child)
			}
		}

		return nil
	})

	queue.Enqueue(startNode)

	done := make(chan struct{})
	go func() {
		queue.Wait()
		close(done)
	}()

	select {
	case <-done:
		return execCtx.Results, nil
	case err := <-errCh:
		return nil, err
	}
}
