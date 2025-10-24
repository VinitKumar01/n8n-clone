package main

import (
	"context"

	"github.com/vinitkumar01/n8n-clone/nodes"
)

var NodeRegistry = map[string]func(context.Context, map[string]any, any) (any, error){
	"geminiNode": nodes.GetGeminiResponse,
}
