package routes

import (
	"database/sql"

	"github.com/vinitkumar01/n8n-clone/internal/database"
)

type Db struct {
	DB      *sql.DB
	Queries database.Querier
}
