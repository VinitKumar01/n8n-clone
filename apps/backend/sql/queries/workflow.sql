-- name: CreateWorkflow :one
INSERT INTO workflow (id, workflow_name, user_id, nodes, edges, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;

-- name: GetWorkflowsByUserId :many
SELECT * FROM workflow WHERE user_id = $1;

-- name: GetWorkflowById :one
SELECT * FROM workflow WHERE id = $1;

-- name: UpdateWorkflowById :one
UPDATE workflow SET nodes = $1, edges = $2, workflow_name = $3, status = $4, updated_at = $5 WHERE id = $6 AND user_id = $7 RETURNING *;
