package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	svix "github.com/svix/svix-webhooks/go"
	"github.com/vinitkumar01/n8n-clone/internal/database"
	"github.com/vinitkumar01/n8n-clone/utils"
)

func (db Db) HandlerClerkWebhook(w http.ResponseWriter, r *http.Request) {
	secret := os.Getenv("CLERK_WEBHOOK_SECRET")
	if secret == "" {
		utils.RespondWithError(w, http.StatusInternalServerError, "missing secret")
		fmt.Println("secret")
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "bad request")
		fmt.Println("bad req")
		return
	}

	wh, err := svix.NewWebhook(secret)
	if err != nil {
		utils.RespondWithError(w, http.StatusInternalServerError, "verification init failed")
		fmt.Println("verification init failed")
		return
	}

	if err := wh.Verify(body, r.Header); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "signature mismatch")
		fmt.Println("signature miamatch")
		return
	}

	var event struct {
		Type string          `json:"type"`
		Data json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(body, &event); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "invalid event")
		fmt.Println("invalid event")
		return
	}

	type ClerkUserCreated struct {
		ClerkID        string `json:"id"`
		EmailAddresses []struct {
			Email string `json:"email_address"`
		} `json:"email_addresses"`
	}

	var clerkUser ClerkUserCreated

	if event.Type == "user.created" {
		if err := json.Unmarshal(event.Data, &clerkUser); err != nil {
			utils.RespondWithError(w, http.StatusBadRequest, "invalid user payload")
			fmt.Println("invalid user payload")
			return
		}
	}

	user, err := db.Queries.CreateUser(r.Context(), database.CreateUserParams{
		ID:        uuid.New(),
		ClerkID:   clerkUser.ClerkID,
		Email:     clerkUser.EmailAddresses[0].Email,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error creating the user: %v", err))
		fmt.Println("Error creating the user")
		return
	}

	utils.RespondWithJson(w, 201, utils.DatabaseUserToUser(user))
}
