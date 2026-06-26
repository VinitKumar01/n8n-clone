package utils

import (
	"context"

	"google.golang.org/genai"
)

var geminiFunc = func(ctx context.Context, prompt string, apiKey string, model string) (string, error) {
	client, err := genai.NewClient(ctx, &genai.ClientConfig{APIKey: apiKey})
	if err != nil {
		return "", err
	}

	result, err := client.Models.GenerateContent(
		ctx,
		model,
		genai.Text(prompt),
		nil,
	)
	if err != nil {
		return "", err
	}

	return result.Text(), nil
}

func GetGeminiResponse(ctx context.Context, args map[string]any, prevResult any) (any, error) {
	prompt := AnyToString(args["prompt"])
	if prevResult != nil {
		prev := AnyToString(prevResult)
		prompt = prompt + "/n" + prev
	}
	apiKey := AnyToString(args["apiKey"])
	model := AnyToString(args["model"])
	return geminiFunc(ctx, prompt, apiKey, model)
}
