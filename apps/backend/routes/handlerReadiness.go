package routes

import (
	"net/http"

	"github.com/vinitkumar01/n8n-clone/utils"
)

func HandlerReadiness(w http.ResponseWriter, r *http.Request) {
	utils.RespondWithJson(w, 200, struct{}{})
}
