package utils

import (
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

func DatabaseUserToUser(dbUser database.User) user {
	return user{
		ID:         dbUser.ID,
		Username:   dbUser.Username,
		Created_at: dbUser.CreatedAt,
		Updated_at: dbUser.UpdatedAt,
	}
}
