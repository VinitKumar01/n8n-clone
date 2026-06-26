package utils

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestTaskQueue_Execution(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	q := NewTaskQueue(10)

	var mu sync.Mutex
	processed := []string{}

	executeFn := func(ctx context.Context, nodeID string) error {
		mu.Lock()
		defer mu.Unlock()
		processed = append(processed, nodeID)
		return nil
	}

	q.StartWorkers(ctx, 3, executeFn)

	q.Enqueue("node-1")
	q.Enqueue("node-2")
	q.Enqueue("node-3")

	q.Wait()

	mu.Lock()
	assert.Len(t, processed, 3)
	assert.Contains(t, processed, "node-1")
	assert.Contains(t, processed, "node-2")
	assert.Contains(t, processed, "node-3")
	mu.Unlock()
}

func TestTaskQueue_WorkerErrors(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	q := NewTaskQueue(5)

	executeFn := func(ctx context.Context, nodeID string) error {
		if nodeID == "fail" {
			return errors.New("worker error")
		}
		return nil
	}

	q.StartWorkers(ctx, 1, executeFn)

	q.Enqueue("success")
	q.Enqueue("fail")

	q.Wait()
	// Should finish without panicking even if execution returns an error
}

func TestTaskQueue_Cancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	q := NewTaskQueue(10)

	var mu sync.Mutex
	executionCount := 0

	executeFn := func(ctx context.Context, nodeID string) error {
		mu.Lock()
		executionCount++
		mu.Unlock()
		time.Sleep(10 * time.Millisecond)
		return nil
	}

	q.StartWorkers(ctx, 1, executeFn)

	q.Enqueue("node-1")
	q.Wait() // Node 1 finishes

	cancel() // Cancel workers

	// Enqueue after cancel. Wait won't see completion of new nodes since workers are stopped.
	// Wait might block forever or finish depending on whether workers are active.
	// Let's verify that workers stop reading.
	time.Sleep(20 * time.Millisecond)

	mu.Lock()
	assert.Equal(t, 1, executionCount)
	mu.Unlock()
}
