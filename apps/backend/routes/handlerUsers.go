package routes

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/utils"
)

func (db Db) HandlerGetUserById(w http.ResponseWriter, r *http.Request) {
	idString := chi.URLParam(r, "userId")
	id, err := uuid.Parse(idString)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Invalid user id: %v", err))
		return
	}

	user, err := db.Queries.GetUserById(r.Context(), id)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error finding the user: %v", err))
		return
	}

	utils.RespondWithJson(w, 200, utils.DatabaseUserToUser(user))
}
