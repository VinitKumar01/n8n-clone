package utils

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

type customStringer struct {
	value string
}

func (cs customStringer) String() string {
	return "custom-" + cs.value
}

func TestAnyToString(t *testing.T) {
	t.Run("nil input", func(t *testing.T) {
		assert.Equal(t, "", AnyToString(nil))
	})

	t.Run("string input", func(t *testing.T) {
		assert.Equal(t, "hello", AnyToString("hello"))
	})

	t.Run("byte slice input", func(t *testing.T) {
		assert.Equal(t, "world", AnyToString([]byte("world")))
	})

	t.Run("stringer input", func(t *testing.T) {
		cs := customStringer{value: "test"}
		assert.Equal(t, "custom-test", AnyToString(cs))
	})

	t.Run("error input", func(t *testing.T) {
		err := errors.New("something went wrong")
		assert.Equal(t, "something went wrong", AnyToString(err))
	})

	t.Run("bool input", func(t *testing.T) {
		assert.Equal(t, "true", AnyToString(true))
		assert.Equal(t, "false", AnyToString(false))
	})

	t.Run("numeric inputs", func(t *testing.T) {
		assert.Equal(t, "42", AnyToString(int(42)))
		assert.Equal(t, "-42", AnyToString(int64(-42)))
		assert.Equal(t, "3.14", AnyToString(float64(3.14)))
		assert.Equal(t, "255", AnyToString(uint8(255)))
	})

	t.Run("complex JSON input", func(t *testing.T) {
		m := map[string]any{"key": "value", "num": 123}
		res := AnyToString(m)
		// Since maps do not guarantee order in JSON serialization, we assert substring matches
		assert.Contains(t, res, `"key":"value"`)
		assert.Contains(t, res, `"num":123`)

		slice := []string{"apple", "banana"}
		assert.Equal(t, `["apple","banana"]`, AnyToString(slice))

		type dummy struct {
			Name string `json:"name"`
		}
		d := dummy{Name: "Go"}
		assert.Equal(t, `{"name":"Go"}`, AnyToString(d))
	})

	t.Run("fallback fmt.Sprintf for unmarshallable or custom kind", func(t *testing.T) {
		// e.g., a channel
		ch := make(chan int)
		res := AnyToString(ch)
		assert.Contains(t, res, "0x")
	})
}
