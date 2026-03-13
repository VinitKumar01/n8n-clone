package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/internal/database"
)

type rawEdge struct {
	Source string `json:"source"`
	Target string `json:"target"`
}

type rawNode struct {
	ID   string         `json:"id"`
	Type string         `json:"type"`
	Data map[string]any `json:"data"`
}

var GlobalScheduler = NewScheduler()

var schedulerJobMap sync.Map

func RegisterSchedulers(ctx context.Context, q *database.Queries) error {
	workflows, err := q.GetActiveWorkflows(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch active workflows: %w", err)
	}

	for _, wf := range workflows {
		var nodes []rawNode
		if err := json.Unmarshal(wf.Nodes, &nodes); err != nil {
			fmt.Println("failed parsing nodes for scheduler:", err)
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

			workflowID := wf.ID
			nodeID := node.ID

			event := TriggerEvent{
				WorkflowID:    workflowID.String(),
				TriggerNodeID: nodeID,
				Input:         map[string]any{"triggeredAt": time.Now().UTC()},
			}

			triggerFn := buildTriggerFn(q, workflowID)

			jobID := GlobalScheduler.StartSchedule(ctx, interval, event, triggerFn)

			mapKey := fmt.Sprintf("%s/%s", workflowID, nodeID)
			schedulerJobMap.Store(mapKey, jobID)

			fmt.Printf("registered scheduler: workflow=%s node=%s interval=%s jobID=%s\n",
				workflowID, nodeID, interval, jobID)
		}
	}

	return nil
}

func StopWorkflowSchedulers(workflowID uuid.UUID) {
	schedulerJobMap.Range(func(key, value any) bool {
		k := key.(string)
		prefix := workflowID.String() + "/"
		if len(k) >= len(prefix) && k[:len(prefix)] == prefix {
			jobID := value.(string)
			GlobalScheduler.Stop(jobID)
			schedulerJobMap.Delete(key)
			fmt.Printf("stopped scheduler job %s for workflow %s\n", jobID, workflowID)
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

		var nodes []rawNode
		if err := json.Unmarshal(wf.Nodes, &nodes); err != nil {
			fmt.Printf("scheduler: failed to parse nodes: %v\n", err)
			return
		}

		var edges []rawEdge
		if err := json.Unmarshal(wf.Edges, &edges); err != nil {
			fmt.Printf("scheduler: failed to parse edges: %v\n", err)
			return
		}

		dag := buildDAG(nodes, edges)

		inDegree := make(map[string]int)
		for id := range dag.Nodes {
			inDegree[id] = 0
		}
		for _, children := range dag.Edges {
			for _, child := range children {
				inDegree[child]++
			}
		}

		execCtx := &ExecutionContext{
			WorkflowID: workflowID.String(),
			Results:    make(map[string]any),
			InDegree:   inDegree,
			ReadyQueue: make(chan string, len(dag.Nodes)),
		}

		execCtx.Results[event.TriggerNodeID] = event.Input

		tq := NewTaskQueue(len(dag.Nodes))

		tq.StartWorkers(ctx, 4, func(ctx context.Context, nodeID string) error {
			if err := ExecuteNode(ctx, nodeID, dag, execCtx); err != nil {
				return err
			}

			var mu sync.Mutex
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

		tq.Enqueue(event.TriggerNodeID)
		tq.Wait()

		fmt.Printf("scheduler: workflow %s execution complete\n", workflowID)
	}
}

func buildDAG(nodes []rawNode, edges []rawEdge) *DAG {
	dag := &DAG{
		Nodes: make(map[string]Node),
		Edges: make(map[string][]string),
	}

	for _, n := range nodes {
		dag.Nodes[n.ID] = Node{
			ID:   n.ID,
			Type: n.Type,
			Data: n.Data,
		}
	}

	for _, e := range edges {
		dag.Edges[e.Source] = append(dag.Edges[e.Source], e.Target)
	}

	return dag
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
