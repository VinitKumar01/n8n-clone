-- name: CreateUser :one
INSERT INTO users (id, username, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING *;

-- name: GetUserById :one
SELECT * FROM users WHERE id = $1;
