package routes

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/vinitkumar01/n8n-clone/nodes"
	"github.com/vinitkumar01/n8n-clone/utils"
)

func HandlerGemini(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		Prompt string `json:"prompt"`
		ApiKey string `json:"apiKey"`
		Model  string `json:"model"`
	}

	decoder := json.NewDecoder(r.Body)

	params := parameters{}
	decoder.Decode(&params)

	result, err := nodes.GetGeminiResponse(r.Context(), params.Prompt, params.ApiKey, params.Model)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Failed to fetch response from gemini: %v", err))
		return
	}

	type response struct {
		Result string `json:"result"`
	}

	utils.RespondWithJson(w, 200, response{Result: result})
}
