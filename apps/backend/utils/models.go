package utils

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/internal/database"
)

type user struct {
	ID         uuid.UUID `json:"id"`
	Username   string    `json:"username"`
	Created_at time.Time `json:"created_at"`
	Updated_at time.Time `json:"updated_at"`
}

type workflow struct {
	ID           uuid.UUID       `json:"id"`
	UserID       uuid.UUID       `json:"user_id"`
	WorkflowName string          `json:"workflow_name"`
	Nodes        json.RawMessage `json:"nodes"`
	Created_at   time.Time       `json:"created_at"`
	Updated_at   time.Time       `json:"updated_at"`
}

func DatabaseUserToUser(dbUser database.User) user {
	return user{
		ID:         dbUser.ID,
		Username:   dbUser.Username,
		Created_at: dbUser.CreatedAt,
		Updated_at: dbUser.UpdatedAt,
	}
}

func DatabaseWorkflowToWorkflow(dbWorkflow database.Workflow) workflow {
	return workflow{
		ID:           dbWorkflow.ID,
		UserID:       dbWorkflow.UserID,
		WorkflowName: dbWorkflow.WorkflowName,
		Nodes:        dbWorkflow.Nodes,
		Created_at:   dbWorkflow.CreatedAt,
		Updated_at:   dbWorkflow.UpdatedAt,
	}
}
