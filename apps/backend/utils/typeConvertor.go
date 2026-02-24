package utils

import (
	"encoding/json"
	"fmt"
	"reflect"
)

func AnyToString(v any) string {
	if v == nil {
		return ""
	}

	switch val := v.(type) {
	case string:
		return val

	case []byte:
		return string(val)

	case fmt.Stringer:
		return val.String()

	case error:
		return val.Error()

	case bool:
		if val {
			return "true"
		}
		return "false"

	case int, int8, int16, int32, int64,
		uint, uint8, uint16, uint32, uint64,
		float32, float64:
		return fmt.Sprintf("%v", val)
	}

	rv := reflect.ValueOf(v)
	switch rv.Kind() {
	case reflect.Map, reflect.Struct, reflect.Slice, reflect.Array:
		if b, err := json.Marshal(v); err == nil {
			return string(b)
		}
	}

	return fmt.Sprintf("%v", v)
}
