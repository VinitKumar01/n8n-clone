package routes

import (
	"encoding/json"
	"fmt"
	"net/http"

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

	dag, err := utils.LoadDAG(workflow.Nodes, meta.Edges, meta.InDegree)
	if err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Failed to load DAG: %v", err))
		return
	}

	if _, ok := dag.Nodes[params.StartNode]; !ok {
		utils.RespondWithError(w, 400, "Invalid start node")
		return
	}

	initialResults := map[string]any{
		params.StartNode: map[string]any{
			"triggeredBy": params.UserId,
		},
	}

	results, err := utils.ExecuteWorkflow(r.Context(), workflowId.String(), dag, params.StartNode, initialResults)
	if err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Workflow execution failed: %v", err))
		return
	}

	utils.RespondWithJson(w, 200, map[string]any{
		"workflowId": workflowId,
		"results":    results,
	})
}
