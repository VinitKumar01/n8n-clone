-- +goose Up

CREATE TYPE workflow_status AS ENUM ('active', 'not-active');

CREATE TABLE workflow (
    id UUID PRIMARY KEY,
    workflow_name TEXT NOT NULL,
    user_id TEXT REFERENCES users (clerk_id) ON DELETE CASCADE NOT NULL,
    nodes JSON NOT NULL,
    edges JSON NOT NULL,
    status workflow_status NOT NULL DEFAULT 'not-active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- +goose Down

DROP TABLE IF EXISTS workflow;
DROP TYPE IF EXISTS workflow_status;
