-- name: CreateWorkflow :one
INSERT INTO workflow (id, workflow_name, user_id, nodes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: GetWorkflowsByUserId :many
SELECT * FROM workflow WHERE user_id = $1;

-- name: GetWorkflowById :one
SELECT * FROM workflow WHERE id = $1;

-- name: UpdateWorkflowById :one
UPDATE workflow SET nodes = $1, workflow_name = $2, updated_at = $3 WHERE id = $4 RETURNING *;
