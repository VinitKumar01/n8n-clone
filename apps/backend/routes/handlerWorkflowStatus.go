package routes

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/internal/database"
	"github.com/vinitkumar01/n8n-clone/utils"
)

func (db Db) HandlerWorkflowStatus(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		WorkflowID uuid.UUID            `json:"workflow_id"`
		UserID     string               `json:"user_id"`
		Status     utils.WorkflowStatus `json:"status"`
	}

	var params parameters
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Invalid JSON: %v", err))
		return
	}

	workflow, err := db.Queries.GetWorkflowById(r.Context(), params.WorkflowID)
	if err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Workflow fetch failed: %v", err))
		return
	}

	if workflow.UserID != params.UserID {
		utils.RespondWithError(w, 401, "Unauthorized user")
		return
	}

	tx, err := db.DB.BeginTx(r.Context(), nil)
	if err != nil {
		utils.RespondWithError(w, 500, "Failed to start transaction")
		return
	}

	committed := false
	defer func() {
		if !committed {
			if rbErr := tx.Rollback(); rbErr != nil && rbErr != sql.ErrTxDone {
				fmt.Println("rollback failed:", rbErr)
			}
		}
	}()

	qtx := db.Queries.WithTx(tx)

	_, err = qtx.UpdateWorkflowStatusById(r.Context(), database.UpdateWorkflowStatusByIdParams{
		ID:        workflow.ID,
		Status:    database.WorkflowStatus(params.Status),
		UpdatedAt: time.Now(),
		UserID:    workflow.UserID,
	})
	if err != nil {
		utils.RespondWithError(w, 500, fmt.Sprintf("Status update failed: %v", err))
		return
	}

	if err := tx.Commit(); err != nil {
		utils.RespondWithError(w, 500, "Commit failed")
		return
	}

	committed = true

	err = utils.RegisterWebhooks(context.Background(), db.Queries)
	if err != nil {
		utils.RespondWithError(w, 500, "Webhook registration failed")
		return
	}

	utils.RespondWithJson(w, 200, "workflow status updated")
}
