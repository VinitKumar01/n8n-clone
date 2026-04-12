package utils

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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

func ExecuteWebhookNode(ctx context.Context, node Node, inputs map[string]any) (any, error) {
	return inputs["payload"], nil
}

func ExecuteMergeNode(ctx context.Context, node Node, inputs map[string]any) (any, error) {
	var mergedResults string
	for _, input := range inputs {
		result := AnyToString(input)
		mergedResults = fmt.Sprintf("%v \n %v", mergedResults, result)
	}
	return mergedResults, nil
}

func ExecuteSchedulerNode(ctx context.Context, node Node, inputs map[string]any) (any, error) {
	return map[string]any{
		"triggeredAt": time.Now().UTC(),
	}, nil
}

func ExecuteResendNode(ctx context.Context, node Node, inputs map[string]any) (any, error) {
	inputConfig, ok := node.Data["inputs"].(map[string]any)
	if !ok {
		return nil, fmt.Errorf("resend node missing inputs config")
	}
	apiKey, ok := inputConfig["apiKey"].(string)
	if !ok || apiKey == "" {
		return nil, fmt.Errorf("error while parsing apiKey")
	}
	from, ok := inputConfig["from"].(string)
	if !ok || from == "" {
		return nil, fmt.Errorf("error while parsing from")
	}
	to, ok := inputConfig["to"].(string)
	if !ok || to == "" {
		return nil, fmt.Errorf("error while parsing to")
	}
	subject, ok := inputConfig["subject"].(string)
	if !ok || subject == "" {
		return nil, fmt.Errorf("error while parsing subject")
	}

	var bodyContent string
	for _, v := range inputs {
		bodyContent = AnyToString(v)
		break
	}

	payload := map[string]any{
		"from":    from,
		"to":      []string{to},
		"subject": subject,
		"text":    bodyContent,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("error while marshaling resend payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("error while creating resend request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error while sending resend request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error while reading resend response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("resend api error %d: %s", resp.StatusCode, string(respBody))
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("error while parsing resend response: %w", err)
	}

	return map[string]any{
		"sentAt": time.Now().UTC(),
		"id":     result["id"],
	}, nil
}
