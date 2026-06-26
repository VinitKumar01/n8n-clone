package routes

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/vinitkumar01/n8n-clone/internal/database"
)

// MockQuerier implements database.Querier
type MockQuerier struct {
	CreateUserFn                      func(ctx context.Context, arg database.CreateUserParams) (database.User, error)
	CreateWorkflowFn                  func(ctx context.Context, arg database.CreateWorkflowParams) (database.Workflow, error)
	GetActiveWorkflowsFn              func(ctx context.Context) ([]database.Workflow, error)
	GetUserByIdFn                     func(ctx context.Context, id uuid.UUID) (database.User, error)
	GetWorkflowByIdFn                 func(ctx context.Context, id uuid.UUID) (database.Workflow, error)
	GetWorkflowMetadataByWorkflowIdFn func(ctx context.Context, workflowID uuid.UUID) (database.WorkflowMetadatum, error)
	GetWorkflowsByUserIdFn            func(ctx context.Context, userID string) ([]database.Workflow, error)
	UpdateWorkflowByIdFn              func(ctx context.Context, arg database.UpdateWorkflowByIdParams) (database.Workflow, error)
	UpdateWorkflowStatusByIdFn        func(ctx context.Context, arg database.UpdateWorkflowStatusByIdParams) (database.Workflow, error)
	UpsertWorkflowMetadataFn          func(ctx context.Context, arg database.UpsertWorkflowMetadataParams) error
}

func (m *MockQuerier) CreateUser(ctx context.Context, arg database.CreateUserParams) (database.User, error) {
	if m.CreateUserFn != nil {
		return m.CreateUserFn(ctx, arg)
	}
	return database.User{}, nil
}

func (m *MockQuerier) CreateWorkflow(ctx context.Context, arg database.CreateWorkflowParams) (database.Workflow, error) {
	if m.CreateWorkflowFn != nil {
		return m.CreateWorkflowFn(ctx, arg)
	}
	return database.Workflow{}, nil
}

func (m *MockQuerier) GetActiveWorkflows(ctx context.Context) ([]database.Workflow, error) {
	if m.GetActiveWorkflowsFn != nil {
		return m.GetActiveWorkflowsFn(ctx)
	}
	return nil, nil
}

func (m *MockQuerier) GetUserById(ctx context.Context, id uuid.UUID) (database.User, error) {
	if m.GetUserByIdFn != nil {
		return m.GetUserByIdFn(ctx, id)
	}
	return database.User{}, nil
}

func (m *MockQuerier) GetWorkflowById(ctx context.Context, id uuid.UUID) (database.Workflow, error) {
	if m.GetWorkflowByIdFn != nil {
		return m.GetWorkflowByIdFn(ctx, id)
	}
	return database.Workflow{}, nil
}

func (m *MockQuerier) GetWorkflowMetadataByWorkflowId(ctx context.Context, workflowID uuid.UUID) (database.WorkflowMetadatum, error) {
	if m.GetWorkflowMetadataByWorkflowIdFn != nil {
		return m.GetWorkflowMetadataByWorkflowIdFn(ctx, workflowID)
	}
	return database.WorkflowMetadatum{}, nil
}

func (m *MockQuerier) GetWorkflowsByUserId(ctx context.Context, userID string) ([]database.Workflow, error) {
	if m.GetWorkflowsByUserIdFn != nil {
		return m.GetWorkflowsByUserIdFn(ctx, userID)
	}
	return nil, nil
}

func (m *MockQuerier) UpdateWorkflowById(ctx context.Context, arg database.UpdateWorkflowByIdParams) (database.Workflow, error) {
	if m.UpdateWorkflowByIdFn != nil {
		return m.UpdateWorkflowByIdFn(ctx, arg)
	}
	return database.Workflow{}, nil
}

func (m *MockQuerier) UpdateWorkflowStatusById(ctx context.Context, arg database.UpdateWorkflowStatusByIdParams) (database.Workflow, error) {
	if m.UpdateWorkflowStatusByIdFn != nil {
		return m.UpdateWorkflowStatusByIdFn(ctx, arg)
	}
	return database.Workflow{}, nil
}

func (m *MockQuerier) UpsertWorkflowMetadata(ctx context.Context, arg database.UpsertWorkflowMetadataParams) error {
	if m.UpsertWorkflowMetadataFn != nil {
		return m.UpsertWorkflowMetadataFn(ctx, arg)
	}
	return nil
}

func addRouteParam(r *http.Request, key, val string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, val)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

func TestHandlerReadiness(t *testing.T) {
	req := httptest.NewRequest("GET", "/health", nil)
	rec := httptest.NewRecorder()

	HandlerReadiness(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, `{}`, rec.Body.String())
}

func TestHandlerGetUserById(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		mockQ := &MockQuerier{
			GetUserByIdFn: func(ctx context.Context, id uuid.UUID) (database.User, error) {
				assert.Equal(t, userID, id)
				return database.User{
					ID:        userID,
					ClerkID:   "clerk_123",
					Email:     "user@example.com",
					CreatedAt: time.Unix(1000, 0).UTC(),
					UpdatedAt: time.Unix(2000, 0).UTC(),
				}, nil
			},
		}

		db := Db{Queries: mockQ}
		req := httptest.NewRequest("GET", "/v1/users/"+userID.String(), nil)
		req = addRouteParam(req, "userId", userID.String())
		rec := httptest.NewRecorder()

		db.HandlerGetUserById(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Contains(t, rec.Body.String(), `"email":"user@example.com"`)
		assert.Contains(t, rec.Body.String(), `"clerk_id":"clerk_123"`)
	})

	t.Run("invalid UUID parameter", func(t *testing.T) {
		db := Db{}
		req := httptest.NewRequest("GET", "/v1/users/bad-uuid", nil)
		req = addRouteParam(req, "userId", "bad-uuid")
		rec := httptest.NewRecorder()

		db.HandlerGetUserById(rec, req)

		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "Invalid user id")
	})

	t.Run("user not found", func(t *testing.T) {
		userID := uuid.New()
		mockQ := &MockQuerier{
			GetUserByIdFn: func(ctx context.Context, id uuid.UUID) (database.User, error) {
				return database.User{}, errors.New("sql: no rows in result set")
			},
		}

		db := Db{Queries: mockQ}
		req := httptest.NewRequest("GET", "/v1/users/"+userID.String(), nil)
		req = addRouteParam(req, "userId", userID.String())
		rec := httptest.NewRecorder()

		db.HandlerGetUserById(rec, req)

		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "Error finding the user")
	})
}

func TestHandlerCreateWorkflow(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		workflowID := uuid.New()
		mockQ := &MockQuerier{
			CreateWorkflowFn: func(ctx context.Context, arg database.CreateWorkflowParams) (database.Workflow, error) {
				assert.Equal(t, workflowID, arg.ID)
				assert.Equal(t, "My Workflow", arg.WorkflowName)
				assert.Equal(t, "user_123", arg.UserID)
				return database.Workflow{
					ID:           arg.ID,
					UserID:       arg.UserID,
					WorkflowName: arg.WorkflowName,
					Nodes:        arg.Nodes,
					Edges:        arg.Edges,
					Status:       arg.Status,
				}, nil
			},
		}

		db := Db{Queries: mockQ}
		body := map[string]any{
			"id":            workflowID.String(),
			"workflow_name": "My Workflow",
			"user_id":       "user_123",
			"nodes":         []any{},
			"edges":         []any{},
			"status":        "not-active",
		}
		bodyBytes, _ := json.Marshal(body)

		req := httptest.NewRequest("POST", "/v1/workflow", bytes.NewBuffer(bodyBytes))
		rec := httptest.NewRecorder()

		db.HandlerCreateWorkflow(rec, req)

		assert.Equal(t, http.StatusCreated, rec.Code)
		assert.Contains(t, rec.Body.String(), `"workflow_name":"My Workflow"`)
	})

	t.Run("bad json body", func(t *testing.T) {
		db := Db{}
		req := httptest.NewRequest("POST", "/v1/workflow", bytes.NewBufferString("{invalid json"))
		rec := httptest.NewRecorder()

		db.HandlerCreateWorkflow(rec, req)

		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "Error parsing json")
	})
}

func TestHandlerGetWorkflowById(t *testing.T) {
	workflowID := uuid.New()
	mockQ := &MockQuerier{
		GetWorkflowByIdFn: func(ctx context.Context, id uuid.UUID) (database.Workflow, error) {
			assert.Equal(t, workflowID, id)
			return database.Workflow{
				ID:           workflowID,
				WorkflowName: "Test Workflow",
				UserID:       "user_1",
			}, nil
		},
	}

	db := Db{Queries: mockQ}
	req := httptest.NewRequest("GET", "/v1/workflow/"+workflowID.String(), nil)
	req = addRouteParam(req, "workflowId", workflowID.String())
	rec := httptest.NewRecorder()

	db.HandlerGetWorkflowById(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), `"workflow_name":"Test Workflow"`)
}

func TestHandlerGetWorkflowsByUserId(t *testing.T) {
	mockQ := &MockQuerier{
		GetWorkflowsByUserIdFn: func(ctx context.Context, userID string) ([]database.Workflow, error) {
			assert.Equal(t, "user_123", userID)
			return []database.Workflow{
				{ID: uuid.New(), WorkflowName: "W1", UserID: userID},
				{ID: uuid.New(), WorkflowName: "W2", UserID: userID},
			}, nil
		},
	}

	db := Db{Queries: mockQ}
	req := httptest.NewRequest("GET", "/v1/workflows/user_123", nil)
	req = addRouteParam(req, "userId", "user_123")
	rec := httptest.NewRecorder()

	db.HandlerGetWorkflowsByUserId(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), `"workflow_name":"W1"`)
	assert.Contains(t, rec.Body.String(), `"workflow_name":"W2"`)
}

func TestHandlerUpdateWorkflow(t *testing.T) {
	workflowID := uuid.New()
	nodesJSON := `[{"id":"n1","type":"triggerManually"}]`
	edgesJSON := `[]`

	t.Run("successful transaction commit", func(t *testing.T) {
		sqlDB, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer sqlDB.Close()

		mock.ExpectBegin()
		mock.ExpectCommit()

		mockQ := &MockQuerier{
			UpsertWorkflowMetadataFn: func(ctx context.Context, arg database.UpsertWorkflowMetadataParams) error {
				assert.Equal(t, workflowID, arg.WorkflowID)
				return nil
			},
			UpdateWorkflowByIdFn: func(ctx context.Context, arg database.UpdateWorkflowByIdParams) (database.Workflow, error) {
				assert.Equal(t, workflowID, arg.ID)
				assert.Equal(t, "Updated Name", arg.WorkflowName)
				return database.Workflow{
					ID:           arg.ID,
					WorkflowName: arg.WorkflowName,
					UserID:       arg.UserID,
					Nodes:        arg.Nodes,
					Edges:        arg.Edges,
				}, nil
			},
		}

		db := Db{
			DB:      sqlDB,
			Queries: mockQ,
		}

		body := map[string]any{
			"workflow_id":   workflowID.String(),
			"workflow_name": "Updated Name",
			"user_id":       "user_123",
			"nodes":         json.RawMessage(nodesJSON),
			"edges":         json.RawMessage(edgesJSON),
			"status":        "active",
		}
		bodyBytes, _ := json.Marshal(body)

		req := httptest.NewRequest("PUT", "/v1/workflow", bytes.NewBuffer(bodyBytes))
		rec := httptest.NewRecorder()

		db.HandlerUpdateWorkflow(rec, req)

		assert.Equal(t, http.StatusCreated, rec.Code)
		assert.Contains(t, rec.Body.String(), `"workflow_name":"Updated Name"`)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("upsert metadata failure triggers rollback", func(t *testing.T) {
		sqlDB, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer sqlDB.Close()

		mock.ExpectBegin()
		mock.ExpectRollback()

		mockQ := &MockQuerier{
			UpsertWorkflowMetadataFn: func(ctx context.Context, arg database.UpsertWorkflowMetadataParams) error {
				return errors.New("db error")
			},
		}

		db := Db{
			DB:      sqlDB,
			Queries: mockQ,
		}

		body := map[string]any{
			"workflow_id":   workflowID.String(),
			"workflow_name": "Updated Name",
			"user_id":       "user_123",
			"nodes":         json.RawMessage(nodesJSON),
			"edges":         json.RawMessage(edgesJSON),
			"status":        "active",
		}
		bodyBytes, _ := json.Marshal(body)

		req := httptest.NewRequest("PUT", "/v1/workflow", bytes.NewBuffer(bodyBytes))
		rec := httptest.NewRecorder()

		db.HandlerUpdateWorkflow(rec, req)

		assert.Equal(t, http.StatusInternalServerError, rec.Code)
		assert.Contains(t, rec.Body.String(), "Metadata save failed")
		assert.NoError(t, mock.ExpectationsWereMet())
	})
}

func TestHandlerWorkflowStatus(t *testing.T) {
	workflowID := uuid.New()

	t.Run("success active status", func(t *testing.T) {
		sqlDB, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer sqlDB.Close()

		mock.ExpectBegin()
		mock.ExpectCommit()

		mockQ := &MockQuerier{
			GetWorkflowByIdFn: func(ctx context.Context, id uuid.UUID) (database.Workflow, error) {
				assert.Equal(t, workflowID, id)
				return database.Workflow{
					ID:     workflowID,
					UserID: "user_123",
					Nodes:  json.RawMessage(`[]`),
				}, nil
			},
			UpdateWorkflowStatusByIdFn: func(ctx context.Context, arg database.UpdateWorkflowStatusByIdParams) (database.Workflow, error) {
				assert.Equal(t, workflowID, arg.ID)
				assert.Equal(t, database.WorkflowStatus("active"), arg.Status)
				return database.Workflow{ID: workflowID}, nil
			},
			// Mocking active workflows queries triggered by RegisterWebhooks / RegisterSchedulers
			GetActiveWorkflowsFn: func(ctx context.Context) ([]database.Workflow, error) {
				return nil, nil
			},
		}

		db := Db{
			DB:      sqlDB,
			Queries: mockQ,
		}

		body := map[string]any{
			"workflow_id": workflowID.String(),
			"user_id":     "user_123",
			"status":      "active",
		}
		bodyBytes, _ := json.Marshal(body)

		req := httptest.NewRequest("POST", "/v1/workflow/status", bytes.NewBuffer(bodyBytes))
		rec := httptest.NewRecorder()

		db.HandlerWorkflowStatus(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.JSONEq(t, `"workflow status updated"`, rec.Body.String())
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("unauthorized user", func(t *testing.T) {
		mockQ := &MockQuerier{
			GetWorkflowByIdFn: func(ctx context.Context, id uuid.UUID) (database.Workflow, error) {
				return database.Workflow{
					ID:     workflowID,
					UserID: "owner_id",
				}, nil
			},
		}

		db := Db{
			Queries: mockQ,
		}

		body := map[string]any{
			"workflow_id": workflowID.String(),
			"user_id":     "unauthorized_id",
			"status":      "active",
		}
		bodyBytes, _ := json.Marshal(body)

		req := httptest.NewRequest("POST", "/v1/workflow/status", bytes.NewBuffer(bodyBytes))
		rec := httptest.NewRecorder()

		db.HandlerWorkflowStatus(rec, req)

		assert.Equal(t, http.StatusUnauthorized, rec.Code)
		assert.Contains(t, rec.Body.String(), "Unauthorized user")
	})
}
