package utils

import (
	"context"
)

type TaskParams map[string]any

type TaskFn func(context.Context, map[string]any, any) (any, error)

type taskQueue struct {
	taskFns    []TaskFn
	taskParams []TaskParams
	Results    map[int]any
}

func CreateTaskQueue() *taskQueue {
	return &taskQueue{
		taskFns:    make([]TaskFn, 0),
		taskParams: make([]TaskParams, 0),
		Results:    make(map[int]any),
	}
}

func (q *taskQueue) EnqueueTask(taskFn TaskFn, params TaskParams) {
	q.taskFns = append(q.taskFns, taskFn)
	q.taskParams = append(q.taskParams, params)
}

func (q *taskQueue) Execute(ctx context.Context) error {
	for id, task := range q.taskFns {
		var prevResult any
		if id >= 1 {
			prevResult = q.Results[id-1]
		}
		result, err := task(ctx, q.taskParams[id], prevResult)
		if err != nil {
			return err
		}
		q.Results[id] = result
	}

	return nil
}
