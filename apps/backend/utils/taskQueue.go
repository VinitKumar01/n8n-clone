package utils

import (
	"context"
	"fmt"
	"sync"
)

type TaskQueue struct {
	jobs chan string
	wg   sync.WaitGroup
}

func NewTaskQueue(buffer int) *TaskQueue {
	return &TaskQueue{
		jobs: make(chan string, buffer),
	}
}

func (q *TaskQueue) StartWorkers(
	ctx context.Context,
	workerCount int,
	execute func(context.Context, string) error,
) {
	for i := range workerCount {
		workerID := i
		go func() {
			fmt.Printf("[taskqueue] worker %d started\n", workerID)
			for {
				select {
				case <-ctx.Done():
					fmt.Printf("[taskqueue] worker %d stopping: ctx done\n", workerID)
					return
				case nodeID, ok := <-q.jobs:
					if !ok {
						fmt.Printf("[taskqueue] worker %d stopping: jobs channel closed\n", workerID)
						return
					}

					if err := execute(ctx, nodeID); err != nil {
						fmt.Println("[taskqueue] node execution error:", err)
					}
					q.wg.Done()
				}
			}
		}()
	}
}

func (q *TaskQueue) Enqueue(nodeID string) {
	q.wg.Add(1)
	q.jobs <- nodeID
}

func (q *TaskQueue) Wait() {
	q.wg.Wait()
}
