package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vinitkumar01/n8n-clone/internal/database"
	"github.com/vinitkumar01/n8n-clone/utils"
)

func (db Db) HandlerCreateWorkflow(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		ID           uuid.UUID            `json:"id"`
		WorkflowName string               `json:"workflow_name"`
		UserId       string               `json:"user_id"`
		Nodes        json.RawMessage      `json:"nodes"`
		Edges        json.RawMessage      `json:"edges"`
		Status       utils.WorkflowStatus `json:"status"`
	}

	decoder := json.NewDecoder(r.Body)

	params := parameters{}
	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error parsing json: %v", err))
		return
	}

	if params.ID == uuid.Nil {
		params.ID = uuid.New()
	}

	workflow, err := db.Queries.CreateWorkflow(r.Context(), database.CreateWorkflowParams{
		ID:           params.ID,
		WorkflowName: params.WorkflowName,
		Nodes:        params.Nodes,
		Edges:        params.Edges,
		Status:       database.WorkflowStatus(params.Status),
		UserID:       params.UserId,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	})
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error creating the workflow: %v", err))
		return
	}

	utils.RespondWithJson(w, 201, utils.DatabaseWorkflowToWorkflow(workflow))
}

func (db Db) HandlerGetWorkflowById(w http.ResponseWriter, r *http.Request) {
	idString := chi.URLParam(r, "workflowId")
	id, err := uuid.Parse(idString)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Invalid workflow id: %v", err))
		return
	}

	workflow, err := db.Queries.GetWorkflowById(r.Context(), id)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error finding the workflow: %v", err))
		return
	}

	utils.RespondWithJson(w, 200, utils.DatabaseWorkflowToWorkflow(workflow))
}

type workflowUpdateParams struct {
	WorkflowName string               `json:"workflow_name"`
	UserId       string               `json:"user_id"`
	Nodes        json.RawMessage      `json:"nodes"`
	Edges        json.RawMessage      `json:"edges"`
	Status       utils.WorkflowStatus `json:"status"`
	WorkflowId   uuid.UUID            `json:"workflow_id"`
}

func parseWorkflowUpdateParams(r *http.Request) (*workflowUpdateParams, error) {
	var params workflowUpdateParams
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		return nil, fmt.Errorf("error parsing json: %w", err)
	}
	return &params, nil
}

func calculateWorkflowMetadata(nodesJSON, edgesJSON json.RawMessage) (edgesJSONRaw, inDegreeJSONRaw, startNodesJSONRaw []byte, err error) {
	var nodes []utils.Node
	if err = json.Unmarshal(nodesJSON, &nodes); err != nil {
		return nil, nil, nil, fmt.Errorf("error parsing nodes: %w", err)
	}

	var edges []utils.Edge
	if err = json.Unmarshal(edgesJSON, &edges); err != nil {
		return nil, nil, nil, fmt.Errorf("error parsing edges: %w", err)
	}

	dag := utils.BuildDAG(nodes, edges)

	workflowMetadata := struct {
		Edges      map[string][]string
		InDegree   map[string]int
		StartNodes []string
	}{
		Edges:    dag.Edges,
		InDegree: dag.InDegree,
	}

	for nodeID, deg := range dag.InDegree {
		if deg == 0 {
			workflowMetadata.StartNodes = append(workflowMetadata.StartNodes, nodeID)
		}
	}

	edgesJSONRaw, _ = json.Marshal(workflowMetadata.Edges)
	inDegreeJSONRaw, _ = json.Marshal(workflowMetadata.InDegree)
	startNodesJSONRaw, _ = json.Marshal(workflowMetadata.StartNodes)
	return edgesJSONRaw, inDegreeJSONRaw, startNodesJSONRaw, nil
}

func (db Db) dbUpdateWorkflowTx(ctx context.Context, params *workflowUpdateParams, edgesJSON, inDegreeJSON, startNodesJSON []byte) (database.Workflow, error) {
	tx, err := db.DB.BeginTx(ctx, nil)
	if err != nil {
		return database.Workflow{}, fmt.Errorf("failed to start transaction: %w", err)
	}

	qtx := db.Queries
	if concreteQueries, ok := db.Queries.(*database.Queries); ok {
		qtx = concreteQueries.WithTx(tx)
	}

	err = qtx.UpsertWorkflowMetadata(ctx, database.UpsertWorkflowMetadataParams{
		WorkflowID: params.WorkflowId,
		Edges:      edgesJSON,
		InDegree:   inDegreeJSON,
		StartNodes: startNodesJSON,
	})
	if err != nil {
		rollbackErr := tx.Rollback()
		return database.Workflow{}, fmt.Errorf("metadata save failed: %v %v", err, rollbackErr)
	}

	workflow, err := qtx.UpdateWorkflowById(ctx, database.UpdateWorkflowByIdParams{
		WorkflowName: params.WorkflowName,
		Nodes:        params.Nodes,
		Edges:        params.Edges,
		Status:       database.WorkflowStatus(params.Status),
		ID:           params.WorkflowId,
		UserID:       params.UserId,
		UpdatedAt:    time.Now().UTC(),
	})
	if err != nil {
		rollbackErr := tx.Rollback()
		return database.Workflow{}, fmt.Errorf("error updating the workflow: %v %v", err, rollbackErr)
	}

	if err := tx.Commit(); err != nil {
		return database.Workflow{}, fmt.Errorf("commit failed")
	}

	return workflow, nil
}

func refreshWorkflowTriggers(ctx context.Context, q database.Querier, workflow database.Workflow) {
	utils.UnregisterWebhooksForWorkflow(workflow.ID)
	utils.StopWorkflowSchedulers(workflow.ID)

	if workflow.Status == database.WorkflowStatusActive {
		if err := utils.RegisterWebhooksForWorkflow(workflow.ID, workflow.Nodes); err != nil {
			fmt.Printf("failed to re-register webhooks for active workflow %s: %v\n", workflow.ID, err)
		}
		if err := utils.RegisterSchedulersForWorkflow(ctx, q, workflow.ID, workflow.Nodes, workflow.Status); err != nil {
			fmt.Printf("failed to re-register schedulers for active workflow %s: %v\n", workflow.ID, err)
		}
	}
}

func (db Db) HandlerUpdateWorkflow(w http.ResponseWriter, r *http.Request) {
	params, err := parseWorkflowUpdateParams(r)
	if err != nil {
		utils.RespondWithError(w, 400, err.Error())
		return
	}

	edgesJSON, inDegreeJSON, startNodesJSON, err := calculateWorkflowMetadata(params.Nodes, params.Edges)
	if err != nil {
		utils.RespondWithError(w, 400, err.Error())
		return
	}

	workflow, err := db.dbUpdateWorkflowTx(r.Context(), params, edgesJSON, inDegreeJSON, startNodesJSON)
	if err != nil {
		utils.RespondWithError(w, 500, err.Error())
		return
	}

	refreshWorkflowTriggers(context.Background(), db.Queries, workflow)

	utils.RespondWithJson(w, 201, utils.DatabaseWorkflowToWorkflow(workflow))
}

func (db Db) HandlerGetWorkflowsByUserId(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "userId")

	workflows, err := db.Queries.GetWorkflowsByUserId(r.Context(), id)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error finding the workflow: %v", err))
		return
	}

	utils.RespondWithJson(w, 200, utils.DatabaseWorkflowsToWorkflows(workflows))
}

func (db Db) HandlerDeleteWorkflow(w http.ResponseWriter, r *http.Request) {
	workflowIdString := chi.URLParam(r, "workflowId")
	workflowId, err := uuid.Parse(workflowIdString)
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Invalid workflow id: %v", err))
		return
	}

	userId := r.URL.Query().Get("userId")
	if userId == "" {
		utils.RespondWithError(w, 400, "Missing userId query parameter")
		return
	}

	// De-register active webhooks and schedulers to avoid run attempts on deleted resources
	utils.UnregisterWebhooksForWorkflow(workflowId)
	utils.StopWorkflowSchedulers(workflowId)

	err = db.Queries.DeleteWorkflowById(r.Context(), database.DeleteWorkflowByIdParams{
		ID:     workflowId,
		UserID: userId,
	})
	if err != nil {
		utils.RespondWithError(w, 400, fmt.Sprintf("Error deleting workflow: %v", err))
		return
	}

	utils.RespondWithJson(w, 200, map[string]string{"message": "Workflow deleted successfully"})
}
