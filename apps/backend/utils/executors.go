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
	if len(inputs) == 0 {
		return "No input received", nil
	}

	if len(inputs) == 1 {
		for _, v := range inputs {
			return v, nil
		}
	}

	return map[string]any{
		"mergedInputs": inputs,
		"message":      "Multiple inputs received",
	}, nil
}

func ExecuteGeminiNode(
	ctx context.Context,
	node Node,
	inputs map[string]any,
) (any, error) {
	inputConfig, ok := node.Data["inputs"].(map[string]any)
	if !ok {
		return nil, fmt.Errorf("gemini node missing inputs config")
	}

	prompt, ok := inputConfig["prompt"].(string)
	if !ok || prompt == "" {
		return nil, fmt.Errorf("error while parsing prompt")
	}

	apiKey, ok := inputConfig["apiKey"].(string)
	if !ok || apiKey == "" {
		return nil, fmt.Errorf("error while parsing apiKey")
	}

	model, ok := inputConfig["model"].(string)
	if !ok || model == "" {
		return nil, fmt.Errorf("error while parsing model")
	}

	response, err := GetGeminiResponse(ctx, map[string]any{
		"prompt": prompt,
		"apiKey": apiKey,
		"model":  model,
	}, inputs)

	return response, err
}
