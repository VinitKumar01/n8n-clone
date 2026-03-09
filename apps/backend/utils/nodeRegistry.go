package utils

var NodeRegistry = map[string]NodeExecutor{}

func RegisterNodes() {
	NodeRegistry["triggerManually"] = ExecuteManualTrigger
	NodeRegistry["showOutput"] = ExecuteShowOutput
	NodeRegistry["geminiNode"] = ExecuteGeminiNode
	NodeRegistry["webhookNode"] = ExecuteWebhookNode
	NodeRegistry["mergeNode"] = ExecuteMergeNode
}
