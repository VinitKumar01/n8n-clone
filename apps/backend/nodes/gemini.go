package nodes

import (
	"context"

	"github.com/vinitkumar01/n8n-clone/utils"
	"google.golang.org/genai"
)

func GetGeminiResponse(ctx context.Context, args map[string]any, prevResult any) (any, error) {
	prompt := utils.AnyToString(args["prompt"])
	if prevResult != nil {
		prev := utils.AnyToString(prevResult)
		prompt = prompt + "/n" + prev
	}
	apiKey := utils.AnyToString(args["apiKey"])
	model := utils.AnyToString(args["model"])
	return gemini(ctx, prompt, apiKey, model)
}

func gemini(ctx context.Context, prompt string, apiKey string, model string) (string, error) {
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
