package utils

func AnyToString(datatype any) string {
	str, ok := datatype.(string)
	if ok {
		return str
	}

	return ""
}
