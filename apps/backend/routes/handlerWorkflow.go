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

	workflow, err := db.Queries.CreateWorkflow(r.Context(), database.CreateWorkflowParams{
		ID:           uuid.New(),
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

	workflow, err := db.Queries.UpdateWorkflowById(r.Context(), database.UpdateWorkflowByIdParams{
		WorkflowName: params.WorkflowName,
		Nodes:        params.Nodes,
		Edges:        params.Edges,
		Status:       database.WorkflowStatus(params.Status),
		ID:           params.WorkflowId,
		UserID:       params.UserId,
		UpdatedAt:    time.Now().UTC(),
	})
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error updating the workflow: %v", err))
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
