-- name: UpsertWorkflowMetadata :exec
INSERT INTO workflow_metadata (
    workflow_id,
    edges,
    in_degree,
    start_nodes,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, NOW(), NOW()
)
ON CONFLICT (workflow_id)
DO UPDATE SET
    edges = EXCLUDED.edges,
    in_degree = EXCLUDED.in_degree,
    start_nodes = EXCLUDED.start_nodes,
    updated_at = NOW();

-- name: GetWorkflowMetadataByWorkflowId :one
SELECT * FROM workflow_metadata WHERE workflow_id = $1;
