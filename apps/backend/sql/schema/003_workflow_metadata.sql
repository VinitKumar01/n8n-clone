-- +goose Up

CREATE TABLE workflow_metadata (
    workflow_id UUID PRIMARY KEY REFERENCES workflow (id) ON DELETE CASCADE NOT NULL,
    edges JSON NOT NULL,
    in_degree JSON NOT NULL,
    start_nodes JSON NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- +goose Down

DROP TABLE IF EXISTS workflow_metadata;
