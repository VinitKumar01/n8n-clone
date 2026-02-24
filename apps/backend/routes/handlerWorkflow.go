package routes

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/internal/database"
	"github.com/vinitkumar01/n8n-clone/utils"
)

func (db Db) HandlerCreateWorkflow(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		ID           uuid.UUID            `json:"id"`
		WorkflowName string               `json:"workflow_name"`
		UserId       string               `json:"user_id"`
		Nodes        json.RawMessage      `json:"nodes"`
		Edges        json.RawMessage      `json:"edges"`
		Status       utils.WorkflowStatus `json:"status"`
	}

	decoder := json.NewDecoder(r.Body)

	params := parameters{}
	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error parsing json: %v", err))
		return
	}

	if params.ID == uuid.Nil {
		params.ID = uuid.New()
	}

	workflow, err := db.Queries.CreateWorkflow(r.Context(), database.CreateWorkflowParams{
		ID:           params.ID,
		WorkflowName: params.WorkflowName,
		Nodes:        params.Nodes,
		Edges:        params.Edges,
		Status:       database.WorkflowStatus(params.Status),
		UserID:       params.UserId,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	})
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error creating the workflow: %v", err))
		return
	}

	utils.RespondWithJson(w, 201, utils.DatabaseWorkflowToWorkflow(workflow))
}

func (db Db) HandlerGetWorkflowById(w http.ResponseWriter, r *http.Request) {
	idString := chi.URLParam(r, "workflowId")
	id, err := uuid.Parse(idString)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Invalid workflow id: %v", err))
		return
	}

	workflow, err := db.Queries.GetWorkflowById(r.Context(), id)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error finding the workflow: %v", err))
		return
	}

	utils.RespondWithJson(w, 200, utils.DatabaseWorkflowToWorkflow(workflow))
}

func (db Db) HandlerUpdateWorkflow(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		WorkflowName string               `json:"workflow_name"`
		UserId       string               `json:"user_id"`
		Nodes        json.RawMessage      `json:"nodes"`
		Edges        json.RawMessage      `json:"edges"`
		Status       utils.WorkflowStatus `json:"status"`
		WorkflowId   uuid.UUID            `json:"workflow_id"`
	}

	decoder := json.NewDecoder(r.Body)

	params := parameters{}
	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error parsing json: %v", err))
		return
	}

	var nodes []utils.Node
	if err := json.Unmarshal(params.Nodes, &nodes); err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error parsing nodes: %v", err))
		return
	}

	var edges []utils.Edge
	if err := json.Unmarshal(params.Edges, &edges); err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error parsing edges: %v", err))
		return
	}

	dag := utils.BuildDAG(nodes, edges)

	workflowMetadata := struct {
		Edges      map[string][]string
		InDegree   map[string]int
		StartNodes []string
	}{
		Edges:    dag.Edges,
		InDegree: dag.InDegree,
	}

	for nodeID, deg := range dag.InDegree {
		if deg == 0 {
			workflowMetadata.StartNodes = append(workflowMetadata.StartNodes, nodeID)
		}
	}

	edgesJSON, _ := json.Marshal(workflowMetadata.Edges)
	inDegreeJSON, _ := json.Marshal(workflowMetadata.InDegree)
	startNodesJSON, _ := json.Marshal(workflowMetadata.StartNodes)

	tx, err := db.DB.BeginTx(r.Context(), nil)
	if err != nil {
		utils.RespondWithError(w, 500, "Failed to start transaction")
		return
	}

	qtx := db.Queries.WithTx(tx)

	err = qtx.UpsertWorkflowMetadata(r.Context(), database.UpsertWorkflowMetadataParams{
		WorkflowID: params.WorkflowId,
		Edges:      edgesJSON,
		InDegree:   inDegreeJSON,
		StartNodes: startNodesJSON,
	})
	if err != nil {
		tx.Rollback()
		utils.RespondWithError(w, 500, fmt.Sprintf("Metadata save failed: %v", err))
		return
	}

	workflow, err := qtx.UpdateWorkflowById(r.Context(), database.UpdateWorkflowByIdParams{
		WorkflowName: params.WorkflowName,
		Nodes:        params.Nodes,
		Edges:        params.Edges,
		Status:       database.WorkflowStatus(params.Status),
		ID:           params.WorkflowId,
		UserID:       params.UserId,
		UpdatedAt:    time.Now().UTC(),
	})
	if err != nil {
		tx.Rollback()
		utils.RespondWithError(w, 400, fmt.Sprintf("Error updating the workflow: %v", err))
		return
	}

	if err := tx.Commit(); err != nil {
		utils.RespondWithError(w, 500, "Commit failed")
		return
	}

	utils.RespondWithJson(w, 201, utils.DatabaseWorkflowToWorkflow(workflow))
}

func (db Db) HandlerGetWorkflowsByUserId(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userId")

	workflows, err := db.Queries.GetWorkflowsByUserId(r.Context(), id)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error finding the workflow: %v", err))
		return
	}

	utils.RespondWithJson(w, 200, utils.DatabaseWorkflowsToWorkflows(workflows))
}
