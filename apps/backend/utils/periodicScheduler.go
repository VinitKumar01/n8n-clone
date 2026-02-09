package utils

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

type TriggerEvent struct {
	WorkflowID    string
	TriggerNodeID string
	Input         map[string]any
}

type TriggerFn func(context.Context, TriggerEvent)

type Scheduler struct {
	mu   sync.Mutex
	jobs map[string]chan struct{}
}

func NewScheduler() *Scheduler {
	return &Scheduler{
		jobs: make(map[string]chan struct{}),
	}
}

func (s *Scheduler) StartSchedule(
	ctx context.Context,
	duration time.Duration,
	event TriggerEvent,
	trigger TriggerFn,
) string {
	s.mu.Lock()
	defer s.mu.Unlock()

	jobID := uuid.New().String()
	stop := make(chan struct{})
	s.jobs[jobID] = stop

	ticker := time.NewTicker(duration)

	go func(id string) {
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				fmt.Println("Scheduler context canceled:", id)
				return

			case <-stop:
				fmt.Println("Stopped scheduled job:", id)
				return

			case t := <-ticker.C:
				fmt.Println("Scheduler firing:", id, "at", t)

				trigger(ctx, event)
			}
		}
	}(jobID)

	return jobID
}

func (s *Scheduler) Stop(jobID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if stop, ok := s.jobs[jobID]; ok {
		close(stop)
		delete(s.jobs, jobID)
	}
}

func (s *Scheduler) StopAll() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for id, stop := range s.jobs {
		close(stop)
		delete(s.jobs, id)
	}
}
