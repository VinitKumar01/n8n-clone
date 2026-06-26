package utils

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExecuteManualTrigger(t *testing.T) {
	node := Node{ID: "node-1", Type: "triggerManually"}
	res, err := ExecuteManualTrigger(context.Background(), node, nil)
	assert.NoError(t, err)

	m, ok := res.(map[string]any)
	require.True(t, ok)
	assert.Contains(t, m, "triggeredAt")
	assert.IsType(t, time.Time{}, m["triggeredAt"])
}

func TestExecuteShowOutput(t *testing.T) {
	node := Node{ID: "node-1", Type: "showOutput"}

	t.Run("no inputs", func(t *testing.T) {
		res, err := ExecuteShowOutput(context.Background(), node, nil)
		assert.NoError(t, err)
		assert.Equal(t, "No input received", res)
	})

	t.Run("single input", func(t *testing.T) {
		inputs := map[string]any{"prevNode": "hello world"}
		res, err := ExecuteShowOutput(context.Background(), node, inputs)
		assert.NoError(t, err)
		assert.Equal(t, "hello world", res)
	})

	t.Run("multiple inputs", func(t *testing.T) {
		inputs := map[string]any{
			"nodeA": "foo",
			"nodeB": "bar",
		}
		res, err := ExecuteShowOutput(context.Background(), node, inputs)
		assert.NoError(t, err)

		m, ok := res.(map[string]any)
		require.True(t, ok)
		assert.Equal(t, "Multiple inputs received", m["message"])
		assert.Equal(t, inputs, m["mergedInputs"])
	})
}

func TestExecuteWebhookNode(t *testing.T) {
	node := Node{ID: "node-1", Type: "webhookNode"}
	inputs := map[string]any{"payload": map[string]any{"id": 42}}

	res, err := ExecuteWebhookNode(context.Background(), node, inputs)
	assert.NoError(t, err)
	assert.Equal(t, map[string]any{"id": 42}, res)
}

func TestExecuteMergeNode(t *testing.T) {
	node := Node{ID: "node-1", Type: "mergeNode"}
	inputs := map[string]any{
		"node1": "result1",
		"node2": 42,
	}

	res, err := ExecuteMergeNode(context.Background(), node, inputs)
	assert.NoError(t, err)

	str, ok := res.(string)
	require.True(t, ok)
	assert.Contains(t, str, "result1")
	assert.Contains(t, str, "42")
}

func TestExecuteSchedulerNode(t *testing.T) {
	node := Node{ID: "node-1", Type: "schedulerNode"}
	res, err := ExecuteSchedulerNode(context.Background(), node, nil)
	assert.NoError(t, err)

	m, ok := res.(map[string]any)
	require.True(t, ok)
	assert.Contains(t, m, "triggeredAt")
	assert.IsType(t, time.Time{}, m["triggeredAt"])
}

func TestExecuteGeminiNode(t *testing.T) {
	// Backup original geminiFunc and restore after test
	oldGeminiFunc := geminiFunc
	defer func() { geminiFunc = oldGeminiFunc }()

	t.Run("successful execution", func(t *testing.T) {
		node := Node{
			ID:   "gemini-1",
			Type: "geminiNode",
			Data: map[string]any{
				"inputs": map[string]any{
					"prompt": "Hello Gemini",
					"apiKey": "test-api-key",
					"model":  "gemini-1.5-flash",
				},
			},
		}

		geminiFunc = func(ctx context.Context, prompt string, apiKey string, model string) (string, error) {
			assert.Equal(t, `Hello Gemini/n{"prev":"prevOutput"}`, prompt)
			assert.Equal(t, "test-api-key", apiKey)
			assert.Equal(t, "gemini-1.5-flash", model)
			return "Gemini reply", nil
		}

		res, err := ExecuteGeminiNode(context.Background(), node, map[string]any{"prev": "prevOutput"})
		assert.NoError(t, err)
		assert.Equal(t, "Gemini reply", res)
	})

	t.Run("missing inputs config", func(t *testing.T) {
		node := Node{ID: "gemini-1", Type: "geminiNode", Data: map[string]any{}}
		_, err := ExecuteGeminiNode(context.Background(), node, nil)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "missing inputs config")
	})

	t.Run("missing prompt", func(t *testing.T) {
		node := Node{
			ID:   "gemini-1",
			Type: "geminiNode",
			Data: map[string]any{
				"inputs": map[string]any{
					"apiKey": "key",
					"model":  "model",
				},
			},
		}
		_, err := ExecuteGeminiNode(context.Background(), node, nil)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "parsing prompt")
	})

	t.Run("missing apiKey", func(t *testing.T) {
		node := Node{
			ID:   "gemini-1",
			Type: "geminiNode",
			Data: map[string]any{
				"inputs": map[string]any{
					"prompt": "prompt",
					"model":  "model",
				},
			},
		}
		_, err := ExecuteGeminiNode(context.Background(), node, nil)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "parsing apiKey")
	})

	t.Run("missing model", func(t *testing.T) {
		node := Node{
			ID:   "gemini-1",
			Type: "geminiNode",
			Data: map[string]any{
				"inputs": map[string]any{
					"prompt": "prompt",
					"apiKey": "key",
				},
			},
		}
		_, err := ExecuteGeminiNode(context.Background(), node, nil)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "parsing model")
	})
}

// Mock RoundTripper for intercepting Resend Node HTTP requests
type mockRoundTripper struct {
	roundTrip func(*http.Request) (*http.Response, error)
}

func (m *mockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	return m.roundTrip(req)
}

func TestExecuteResendNode(t *testing.T) {
	oldTransport := http.DefaultClient.Transport
	defer func() { http.DefaultClient.Transport = oldTransport }()

	t.Run("successful email send", func(t *testing.T) {
		node := Node{
			ID:   "resend-1",
			Type: "resendNode",
			Data: map[string]any{
				"inputs": map[string]any{
					"apiKey":  "re_abc123",
					"from":    "sender@example.com",
					"to":      "receiver@example.com",
					"subject": "Hello World",
				},
			},
		}

		http.DefaultClient.Transport = &mockRoundTripper{
			roundTrip: func(req *http.Request) (*http.Response, error) {
				assert.Equal(t, "https://api.resend.com/emails", req.URL.String())
				assert.Equal(t, "Bearer re_abc123", req.Header.Get("Authorization"))
				assert.Equal(t, "application/json", req.Header.Get("Content-Type"))

				bodyBytes, err := io.ReadAll(req.Body)
				require.NoError(t, err)
				assert.Contains(t, string(bodyBytes), `"from":"sender@example.com"`)
				assert.Contains(t, string(bodyBytes), `"to":["receiver@example.com"]`)
				assert.Contains(t, string(bodyBytes), `"subject":"Hello World"`)
				assert.Contains(t, string(bodyBytes), `"text":"Email context body"`)

				respBody := `{"id": "email-id-999"}`
				return &http.Response{
					StatusCode: http.StatusOK,
					Body:       io.NopCloser(bytes.NewBufferString(respBody)),
				}, nil
			},
		}

		res, err := ExecuteResendNode(context.Background(), node, map[string]any{"prev": "Email context body"})
		assert.NoError(t, err)

		m, ok := res.(map[string]any)
		require.True(t, ok)
		assert.Equal(t, "email-id-999", m["id"])
		assert.Contains(t, m, "sentAt")
	})

	t.Run("API failure returns error", func(t *testing.T) {
		node := Node{
			ID:   "resend-1",
			Type: "resendNode",
			Data: map[string]any{
				"inputs": map[string]any{
					"apiKey":  "re_abc123",
					"from":    "sender@example.com",
					"to":      "receiver@example.com",
					"subject": "Hello World",
				},
			},
		}

		http.DefaultClient.Transport = &mockRoundTripper{
			roundTrip: func(req *http.Request) (*http.Response, error) {
				return &http.Response{
					StatusCode: http.StatusBadRequest,
					Body:       io.NopCloser(bytes.NewBufferString(`{"message": "invalid api key"}`)),
				}, nil
			},
		}

		_, err := ExecuteResendNode(context.Background(), node, nil)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "resend api error 400")
	})

	t.Run("http dispatch error", func(t *testing.T) {
		node := Node{
			ID:   "resend-1",
			Type: "resendNode",
			Data: map[string]any{
				"inputs": map[string]any{
					"apiKey":  "re_abc123",
					"from":    "sender@example.com",
					"to":      "receiver@example.com",
					"subject": "Hello World",
				},
			},
		}

		http.DefaultClient.Transport = &mockRoundTripper{
			roundTrip: func(req *http.Request) (*http.Response, error) {
				return nil, errors.New("network unreachable")
			},
		}

		_, err := ExecuteResendNode(context.Background(), node, nil)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "network unreachable")
	})

	t.Run("missing parameter subject", func(t *testing.T) {
		node := Node{
			ID:   "resend-1",
			Type: "resendNode",
			Data: map[string]any{
				"inputs": map[string]any{
					"apiKey": "re_abc123",
					"from":   "sender@example.com",
					"to":     "receiver@example.com",
				},
			},
		}
		_, err := ExecuteResendNode(context.Background(), node, nil)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "parsing subject")
	})
}
