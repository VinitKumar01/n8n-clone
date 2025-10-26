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

func (db Db) HandlerCreateUser(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		Username string `json:"username"`
	}

	decoder := json.NewDecoder(r.Body)

	params := parameters{}
	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error parsing json: %v", err))
		return
	}

	user, err := db.Queries.CreateUser(r.Context(), database.CreateUserParams{
		ID:        uuid.New(),
		Username:  params.Username,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error creating the user: %v", err))
		return
	}

	utils.RespondWithJson(w, 201, utils.DatabaseUserToUser(user))
}

func (db Db) HandlerGetUserById(w http.ResponseWriter, r *http.Request) {
	idString := chi.URLParam(r, "userId")
	id, err := uuid.Parse(idString)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Invalid feed follow id: %v", err))
		return
	}

	user, err := db.Queries.GetUserById(r.Context(), id)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error finding the user: %v", err))
		return
	}

	utils.RespondWithJson(w, 200, utils.DatabaseUserToUser(user))
}
