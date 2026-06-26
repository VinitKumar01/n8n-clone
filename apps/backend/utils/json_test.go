package utils

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRespondWithJson(t *testing.T) {
	t.Run("successful JSON response", func(t *testing.T) {
		rec := httptest.NewRecorder()
		payload := map[string]string{"foo": "bar"}

		RespondWithJson(rec, http.StatusOK, payload)

		res := rec.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusOK, res.StatusCode)
		assert.Equal(t, "application/json", res.Header.Get("Content-Type"))
		assert.JSONEq(t, `{"foo":"bar"}`, rec.Body.String())
	})

	t.Run("JSON marshalling error fallback", func(t *testing.T) {
		rec := httptest.NewRecorder()
		// Channels cannot be marshalled to JSON and will cause an error
		unmarshallablePayload := make(chan int)

		RespondWithJson(rec, http.StatusOK, unmarshallablePayload)

		res := rec.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusInternalServerError, res.StatusCode)
	})
}

func TestRespondWithError(t *testing.T) {
	t.Run("4xx client error", func(t *testing.T) {
		rec := httptest.NewRecorder()

		RespondWithError(rec, http.StatusBadRequest, "bad client input")

		res := rec.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusBadRequest, res.StatusCode)
		assert.Equal(t, "application/json", res.Header.Get("Content-Type"))
		assert.JSONEq(t, `{"error":"bad client input"}`, rec.Body.String())
	})

	t.Run("5xx server error", func(t *testing.T) {
		rec := httptest.NewRecorder()

		RespondWithError(rec, http.StatusInternalServerError, "internal db failure")

		res := rec.Result()
		defer res.Body.Close()

		assert.Equal(t, http.StatusInternalServerError, res.StatusCode)
		assert.Equal(t, "application/json", res.Header.Get("Content-Type"))
		assert.JSONEq(t, `{"error":"internal db failure"}`, rec.Body.String())
	})
}
