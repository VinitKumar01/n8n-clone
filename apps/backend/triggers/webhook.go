package triggers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/utils"
)

func WebhookListener(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		WorkflowId uuid.UUID `json:"workflowId"`
	}

	params := parameters{}

	decoder := json.NewDecoder(r.Body)

	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithError(w, 400, "Invalid request")
	}

	// TODO: get workflow from database and execute
}
