package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"maps"
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/utils"
)

func (db Db) HandlerWorkflowExecute(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		StartNode string `json:"startNode"`
		UserId    string `json:"userId"`
	}

	var params parameters
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error while parsing parameters: %v", err))
		return
	}

	workflowIdString := chi.URLParam(r, "workflowId")
	workflowId, err := uuid.Parse(workflowIdString)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error while parsing workflow id: %v", err))
		return
	}

	workflow, err := db.Queries.GetWorkflowById(r.Context(), workflowId)
	if err != nil {
		utils.RespondWithError(w, 401, fmt.Sprintf("Failed to fetch workflow: %v", err))
		return
	}

	meta, err := db.Queries.GetWorkflowMetadataByWorkflowId(r.Context(), workflowId)
	if err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Failed to fetch workflow metadata: %v", err))
		return
	}

	unmarshalAny := func(raw any, dest any) error {
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

	var edges map[string][]string
	var inDegree map[string]int

	if err := unmarshalAny(meta.Edges, &edges); err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Failed to parse edges metadata: %v", err))
		return
	}

	if err := unmarshalAny(meta.InDegree, &inDegree); err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Failed to parse inDegree metadata: %v", err))
		return
	}

	type rawNode struct {
		ID   string         `json:"id"`
		Type string         `json:"type"`
		Data map[string]any `json:"data"`
	}

	var rawNodes []rawNode
	if err := unmarshalAny(workflow.Nodes, &rawNodes); err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Failed to parse workflow nodes: %v", err))
		return
	}

	dag := &utils.DAG{
		Nodes:    make(map[string]utils.Node),
		Edges:    edges,
		InDegree: make(map[string]int),
	}

	maps.Copy(dag.InDegree, inDegree)

	for _, n := range rawNodes {
		dag.Nodes[n.ID] = utils.Node{
			ID:   n.ID,
			Type: n.Type,
			Data: n.Data,
		}
	}

	if _, ok := dag.Nodes[params.StartNode]; !ok {
		utils.RespondWithError(w, 400, "Invalid start node")
		return
	}

	execCtx := &utils.ExecutionContext{
		Results:  make(map[string]any),
		InDegree: make(map[string]int),
	}

	maps.Copy(execCtx.InDegree, dag.InDegree)

	execCtx.Results[params.StartNode] = map[string]any{
		"triggeredBy": params.UserId,
	}

	if err := utils.ExecuteNode(r.Context(), params.StartNode, dag, execCtx); err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Failed to execute start node: %v", err))
		return
	}
	fmt.Println("[handler] executed start node:", params.StartNode, "output:", execCtx.Results[params.StartNode])

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	var mu sync.Mutex
	errCh := make(chan error, 1)

	queue := utils.NewTaskQueue(100)

	queue.StartWorkers(ctx, 4, func(ctx context.Context, nodeID string) error {
		fmt.Println("[worker-wrapper] received job:", nodeID)
		if err := utils.ExecuteNode(ctx, nodeID, dag, execCtx); err != nil {
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

	for _, child := range dag.Edges[params.StartNode] {
		execCtx.InDegree[child]--
		if execCtx.InDegree[child] == 0 {
			queue.Enqueue(child)
		}
	}

	done := make(chan struct{})
	go func() {
		queue.Wait()
		close(done)
	}()

	select {
	case <-done:
		utils.RespondWithJson(w, 200, map[string]any{
			"workflowId": workflowId,
			"results":    execCtx.Results,
		})
		return

	case err := <-errCh:
		utils.RespondWithError(w, 500, fmt.Sprintf("Workflow execution failed: %v", err))
		return
	}
}
