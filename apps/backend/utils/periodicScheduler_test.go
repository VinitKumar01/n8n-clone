package utils

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestScheduler_StartScheduleAndStop(t *testing.T) {
	s := NewScheduler()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var mu sync.Mutex
	eventsReceived := []TriggerEvent{}

	event := TriggerEvent{
		WorkflowID:    "wf-1",
		TriggerNodeID: "node-1",
		Input:         map[string]any{"data": "test"},
	}

	// Trigger callback that records the event
	trigger := func(ctx context.Context, ev TriggerEvent) {
		mu.Lock()
		defer mu.Unlock()
		eventsReceived = append(eventsReceived, ev)
	}

	// Run with 10ms interval
	jobID := s.StartSchedule(ctx, 10*time.Millisecond, event, trigger)
	assert.NotEmpty(t, jobID)

	// Wait for ticker to fire a few times
	time.Sleep(35 * time.Millisecond)

	s.Stop(jobID)

	mu.Lock()
	countBeforeStop := len(eventsReceived)
	assert.GreaterOrEqual(t, countBeforeStop, 2)
	mu.Unlock()

	// Wait more and ensure no more events are fired
	time.Sleep(25 * time.Millisecond)

	mu.Lock()
	assert.Equal(t, countBeforeStop, len(eventsReceived))
	mu.Unlock()
}

func TestScheduler_StopAll(t *testing.T) {
	s := NewScheduler()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	trigger := func(ctx context.Context, ev TriggerEvent) {}

	job1 := s.StartSchedule(ctx, 50*time.Millisecond, TriggerEvent{}, trigger)
	job2 := s.StartSchedule(ctx, 50*time.Millisecond, TriggerEvent{}, trigger)

	assert.Len(t, s.jobs, 2)

	s.StopAll()

	assert.Len(t, s.jobs, 0)
	s.Stop(job1) // Stopping again shouldn't panic
	s.Stop(job2)
}

func TestScheduler_ContextCancel(t *testing.T) {
	s := NewScheduler()
	ctx, cancel := context.WithCancel(context.Background())

	var mu sync.Mutex
	triggerCount := 0
	trigger := func(ctx context.Context, ev TriggerEvent) {
		mu.Lock()
		triggerCount++
		mu.Unlock()
	}

	s.StartSchedule(ctx, 10*time.Millisecond, TriggerEvent{}, trigger)

	time.Sleep(15 * time.Millisecond)
	cancel() // Cancel the parent context

	time.Sleep(20 * time.Millisecond)

	mu.Lock()
	countAtCancel := triggerCount
	mu.Unlock()

	time.Sleep(20 * time.Millisecond)

	mu.Lock()
	// Ticker should have stopped firing after context cancellation
	assert.Equal(t, countAtCancel, triggerCount)
	mu.Unlock()
}
