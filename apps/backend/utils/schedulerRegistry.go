package utils

import (
	"context"
	"fmt"
	"maps"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/internal/database"
)

var GlobalScheduler = NewScheduler()

var schedulerJobMap sync.Map

func RegisterSchedulers(ctx context.Context, q database.Querier) error {
	workflows, err := q.GetActiveWorkflows(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch active workflows: %w", err)
	}

	for _, wf := range workflows {
		var nodes []Node
		if err := UnmarshalAny(wf.Nodes, &nodes); err != nil {
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

func RegisterSchedulersForWorkflow(ctx context.Context, q database.Querier, workflowID uuid.UUID, nodesJSON any, status database.WorkflowStatus) error {
	if status != database.WorkflowStatusActive {
		return nil
	}

	var nodes []Node
	if err := UnmarshalAny(nodesJSON, &nodes); err != nil {
		return fmt.Errorf("failed to parse nodes: %w", err)
	}

	for _, node := range nodes {
		if node.Type != "schedulerNode" {
			continue
		}

		interval, err := parseInterval(node.Data)
		if err != nil {
			fmt.Printf("schedulerNode %s in workflow %s: %v\n", node.ID, workflowID, err)
			continue
		}

		event := TriggerEvent{
			WorkflowID:    workflowID.String(),
			TriggerNodeID: node.ID,
			Input:         map[string]any{"triggeredAt": time.Now().UTC()},
		}

		jobID := GlobalScheduler.StartSchedule(ctx, interval, event, buildTriggerFn(q, workflowID))

		mapKey := fmt.Sprintf("%s/%s", workflowID, node.ID)
		schedulerJobMap.Store(mapKey, jobID)

		fmt.Printf("registered scheduler: workflow=%s node=%s interval=%s jobID=%s\n",
			workflowID, node.ID, interval, jobID)
	}

	return nil
}

func buildTriggerFn(q database.Querier, workflowID uuid.UUID) TriggerFn {
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

		dag, err := LoadDAG(wf.Nodes, meta.Edges, meta.InDegree)
		if err != nil {
			fmt.Printf("scheduler: failed to load DAG for workflow %s: %v\n", workflowID, err)
			return
		}

		inputCopy := make(map[string]any)
		if event.Input != nil {
			maps.Copy(inputCopy, event.Input)
		}
		inputCopy["triggeredAt"] = time.Now().UTC()

		initialResults := map[string]any{
			event.TriggerNodeID: inputCopy,
		}

		_, err = ExecuteWorkflow(ctx, workflowID.String(), dag, event.TriggerNodeID, initialResults)
		if err != nil {
			fmt.Printf("scheduler: workflow %s execution failed: %v\n", workflowID, err)
			return
		}

		fmt.Printf("scheduler: workflow %s execution complete\n", workflowID)
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
