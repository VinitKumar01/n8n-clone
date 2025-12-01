package utils

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/internal/database"
)

type user struct {
	ID         uuid.UUID `json:"id"`
	ClerkID    string    `json:"clerk_id"`
	Email      string    `json:"email"`
	Created_at time.Time `json:"created_at"`
	Updated_at time.Time `json:"updated_at"`
}

type WorkflowStatus string

const (
	WorkflowStatusActive    WorkflowStatus = "active"
	WorkflowStatusNotActive WorkflowStatus = "not-active"
)

type workflow struct {
	ID           uuid.UUID       `json:"id"`
	UserID       string          `json:"user_id"`
	WorkflowName string          `json:"workflow_name"`
	Nodes        json.RawMessage `json:"nodes"`
	Edges        json.RawMessage `json:"edges"`
	Status       WorkflowStatus  `json:"status"`
	Created_at   time.Time       `json:"created_at"`
	Updated_at   time.Time       `json:"updated_at"`
}

func DatabaseUserToUser(dbUser database.User) user {
	return user{
		ID:         dbUser.ID,
		ClerkID:    dbUser.ClerkID,
		Email:      dbUser.Email,
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
		Edges:        dbWorkflow.Edges,
		Status:       WorkflowStatus(dbWorkflow.Status),
		Created_at:   dbWorkflow.CreatedAt,
		Updated_at:   dbWorkflow.UpdatedAt,
	}
}

func DatabaseWorkflowsToWorkflows(dbWorkflows []database.Workflow) []workflow {
	workflows := []workflow{}
	for _, dbWorkflow := range dbWorkflows {
		workflows = append(workflows, DatabaseWorkflowToWorkflow(dbWorkflow))
	}
	return workflows
}
