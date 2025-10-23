package nodes

import (
	"context"

	"google.golang.org/genai"
)

func GetGeminiResponse(ctx context.Context, prompt string, apiKey string, model string) (string, error) {
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
