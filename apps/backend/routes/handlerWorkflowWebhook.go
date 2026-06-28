package routes

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/vinitkumar01/n8n-clone/utils"
)

func (db Db) HandlerWorkflowWebhook(w http.ResponseWriter, r *http.Request) {
	workflowID := chi.URLParam(r, "workflowID")
	nodeID := chi.URLParam(r, "nodeID")

	path := fmt.Sprintf("/webhook/%s/%s", workflowID, nodeID)

	route, ok := utils.WebhookRegistry[path]

	if !ok {
		http.NotFound(w, r)
		return
	}

	workflow, err := db.Queries.GetWorkflowById(r.Context(), route.WorkflowID)
	if err != nil {
		utils.RespondWithError(w, 401, fmt.Sprintf("Failed to fetch workflow: %v", err))
		return
	}

	meta, err := db.Queries.GetWorkflowMetadataByWorkflowId(r.Context(), route.WorkflowID)
	if err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Failed to fetch workflow metadata: %v", err))
		return
	}

	dag, err := utils.LoadDAG(workflow.Nodes, meta.Edges, meta.InDegree)
	if err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Failed to load DAG: %v", err))
		return
	}

	if _, ok := dag.Nodes[route.NodeID]; !ok {
		utils.RespondWithError(w, 400, "Invalid start node")
		return
	}

	var payload map[string]any
	err = json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Failed to parse payload: %v", err))
		return
	}

	initialResults := map[string]any{
		route.NodeID: map[string]any{
			"payload": payload,
		},
	}

	results, err := utils.ExecuteWorkflow(r.Context(), route.WorkflowID.String(), dag, route.NodeID, initialResults)
	if err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Workflow execution failed: %v", err))
		return
	}

	utils.RespondWithJson(w, 200, map[string]any{
		"workflowId": route.WorkflowID,
		"results":    results,
	})
}
