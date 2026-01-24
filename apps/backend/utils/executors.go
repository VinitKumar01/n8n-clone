package utils

import (
	"context"
	"fmt"
	"time"
)

type NodeExecutor func(ctx context.Context, node Node, inputs map[string]any) (any, error)

type ExecutionContext struct {
	WorkflowID string
	Results    map[string]any
	InDegree   map[string]int
	ReadyQueue chan string
}

func ExecuteManualTrigger(
	ctx context.Context,
	node Node,
	inputs map[string]any,
) (any, error) {
	return map[string]any{
		"triggeredAt": time.Now().UTC(),
	}, nil
}

func ExecuteShowOutput(
	ctx context.Context,
	node Node,
	inputs map[string]any,
) (any, error) {
	fmt.Println("Inputs:", inputs)

	return inputs, nil
}

func ExecuteGeminiNode(
	ctx context.Context,
	node Node,
	inputs map[string]any,
) (any, error) {
	prompt, ok := node.Data["prompt"].(string)
	if !ok {
		return nil, fmt.Errorf("error while parsing prompt")
	}

	apiKey, ok := node.Data["apiKey"].(string)
	if !ok {
		return nil, fmt.Errorf("error while parsing apiKey")
	}

	model, ok := node.Data["model"].(string)
	if !ok {
		return nil, fmt.Errorf("error while parsing model")
	}

	response, err := GetGeminiResponse(context.Background(), map[string]any{
		"prompt": prompt,
		"apiKey": apiKey,
		"model":  model,
	}, inputs)

	return response, err
}
