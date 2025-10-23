package utils

import (
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Callback func()

type Scheduler struct {
	mu   sync.Mutex
	jobs map[string]chan bool
}

func NewScheduler() *Scheduler {
	return &Scheduler{
		jobs: make(map[string]chan bool),
	}
}

func (s *Scheduler) Start(duration time.Duration, fn Callback) string {
	s.mu.Lock()
	defer s.mu.Unlock()

	jobID := uuid.New().String()
	done := make(chan bool)
	s.jobs[jobID] = done

	ticker := time.NewTicker(duration)

	go func(id string, stop chan bool) {
		defer ticker.Stop()
		for {
			select {
			case <-stop:
				fmt.Println("Stopped job:", id)
				return
			case t := <-ticker.C:
				fn()
				fmt.Println("Periodic job executed:", id, "at", t)
			}
		}
	}(jobID, done)

	return jobID
}

func (s *Scheduler) Stop(jobID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if done, exists := s.jobs[jobID]; exists {
		close(done)
		delete(s.jobs, jobID)
	}
}

func (s *Scheduler) StopAll() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for id, done := range s.jobs {
		close(done)
		delete(s.jobs, id)
	}
}
