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
		WorkflowName string          `json:"workflow_name"`
		UserId       uuid.UUID       `json:"user_id"`
		Nodes        json.RawMessage `json:"nodes"`
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
