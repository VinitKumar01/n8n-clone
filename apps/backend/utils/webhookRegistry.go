package utils

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/internal/database"
)

type WebhookRoute struct {
	WorkflowID uuid.UUID
	NodeID     string
}

var WebhookRegistry = map[string]WebhookRoute{}

func RegisterWebhooks(ctx context.Context, q database.Querier) error {
	type rawNode struct {
		ID   string         `json:"id"`
		Type string         `json:"type"`
		Data map[string]any `json:"data"`
	}

	workflows, err := q.GetActiveWorkflows(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch active workflows: %w", err)
	}

	for _, wf := range workflows {

		var nodes []rawNode
		if err := json.Unmarshal(wf.Nodes, &nodes); err != nil {
			fmt.Println("failed parsing nodes:", err)
			continue
		}

		for _, node := range nodes {

			if node.Type != "webhookNode" {
				continue
			}

			path := fmt.Sprintf("/webhook/%s/%s", wf.ID, node.ID)

			WebhookRegistry[path] = WebhookRoute{
				WorkflowID: wf.ID,
				NodeID:     node.ID,
			}

			fmt.Println("registered webhook:", path)
		}
	}

	return nil
}
