package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"maps"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/internal/database"
)

var GlobalScheduler = NewScheduler()

var schedulerJobMap sync.Map

func unmarshalAny(raw any, dest any) error {
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

func RegisterSchedulers(ctx context.Context, q *database.Queries) error {
	workflows, err := q.GetActiveWorkflows(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch active workflows: %w", err)
	}

	for _, wf := range workflows {
		var nodes []Node
		if err := unmarshalAny(wf.Nodes, &nodes); err != nil {
			fmt.Printf("scheduler: failed to parse nodes for workflow %s: %v\n", wf.ID, err)
			continue
		}

		for _, node := range nodes {
			if node.Type != "schedulerNode" {
				continue
			}

			interval, err := parseInterval(node.Data)
			if err != nil {
				fmt.Printf("schedulerNode %s in workflow %s: %v\n", node.ID, wf.ID, err)
				continue
			}

			event := TriggerEvent{
				WorkflowID:    wf.ID.String(),
				TriggerNodeID: node.ID,
				Input:         map[string]any{"triggeredAt": time.Now().UTC()},
			}

			jobID := GlobalScheduler.StartSchedule(ctx, interval, event, buildTriggerFn(q, wf.ID))

			mapKey := fmt.Sprintf("%s/%s", wf.ID, node.ID)
			schedulerJobMap.Store(mapKey, jobID)

			fmt.Printf("registered scheduler: workflow=%s node=%s interval=%s jobID=%s\n",
				wf.ID, node.ID, interval, jobID)
		}
	}

	return nil
}

func StopWorkflowSchedulers(workflowID uuid.UUID) {
	prefix := workflowID.String() + "/"
	schedulerJobMap.Range(func(key, value any) bool {
		k := key.(string)
		if len(k) >= len(prefix) && k[:len(prefix)] == prefix {
			GlobalScheduler.Stop(value.(string))
			schedulerJobMap.Delete(key)
			fmt.Printf("stopped scheduler job %s for workflow %s\n", value.(string), workflowID)
		}
		return true
	})
}

func buildTriggerFn(q *database.Queries, workflowID uuid.UUID) TriggerFn {
	return func(ctx context.Context, event TriggerEvent) {
		wf, err := q.GetWorkflowById(ctx, workflowID)
		if err != nil {
			fmt.Printf("scheduler: failed to fetch workflow %s: %v\n", workflowID, err)
			return
		}

		meta, err := q.GetWorkflowMetadataByWorkflowId(ctx, workflowID)
		if err != nil {
			fmt.Printf("scheduler: failed to fetch metadata for workflow %s: %v\n", workflowID, err)
			return
		}

		var edges map[string][]string
		var inDegree map[string]int

		if err := unmarshalAny(meta.Edges, &edges); err != nil {
			fmt.Printf("scheduler: failed to parse edges: %v\n", err)
			return
		}

		if err := unmarshalAny(meta.InDegree, &inDegree); err != nil {
			fmt.Printf("scheduler: failed to parse in_degree: %v\n", err)
			return
		}

		var rawNodes []Node
		if err := unmarshalAny(wf.Nodes, &rawNodes); err != nil {
			fmt.Printf("scheduler: failed to parse nodes: %v\n", err)
			return
		}

		dag := &DAG{
			Nodes:    make(map[string]Node),
			Edges:    edges,
			InDegree: make(map[string]int),
		}
		maps.Copy(dag.InDegree, inDegree)
		for _, n := range rawNodes {
			dag.Nodes[n.ID] = n
		}

		execCtx := &ExecutionContext{
			WorkflowID: workflowID.String(),
			Results:    make(map[string]any),
			InDegree:   make(map[string]int),
		}
		maps.Copy(execCtx.InDegree, inDegree)

		execCtx.Results[event.TriggerNodeID] = event.Input

		if err := ExecuteNode(ctx, event.TriggerNodeID, dag, execCtx); err != nil {
			fmt.Printf("scheduler: failed to execute start node %s: %v\n", event.TriggerNodeID, err)
			return
		}

		ctx, cancel := context.WithCancel(ctx)
		defer cancel()

		var mu sync.Mutex
		errCh := make(chan error, 1)
		tq := NewTaskQueue(100)

		tq.StartWorkers(ctx, 4, func(ctx context.Context, nodeID string) error {
			if err := ExecuteNode(ctx, nodeID, dag, execCtx); err != nil {
				errCh <- err
				cancel()
				return err
			}

			mu.Lock()
			defer mu.Unlock()

			for _, child := range dag.Edges[nodeID] {
				execCtx.InDegree[child]--
				if execCtx.InDegree[child] == 0 {
					tq.Enqueue(child)
				}
			}
			return nil
		})

		for _, child := range dag.Edges[event.TriggerNodeID] {
			execCtx.InDegree[child]--
			if execCtx.InDegree[child] == 0 {
				tq.Enqueue(child)
			}
		}

		done := make(chan struct{})
		go func() {
			tq.Wait()
			close(done)
		}()

		select {
		case <-done:
			fmt.Printf("scheduler: workflow %s execution complete\n", workflowID)
		case err := <-errCh:
			fmt.Printf("scheduler: workflow %s execution failed: %v\n", workflowID, err)
		}
	}
}

func parseInterval(data map[string]any) (time.Duration, error) {
	inputs, ok := data["inputs"].(map[string]any)
	if !ok {
		return 0, fmt.Errorf("missing inputs field")
	}

	raw, ok := inputs["interval"].(string)
	if !ok || raw == "" {
		return 0, fmt.Errorf("missing or empty interval")
	}

	d, err := time.ParseDuration(raw)
	if err != nil {
		return 0, fmt.Errorf("invalid interval %q: %w", raw, err)
	}

	return d, nil
}
