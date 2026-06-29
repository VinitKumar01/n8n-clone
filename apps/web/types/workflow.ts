import { Node } from "reactflow";

export type GeminiInputs = {
  apiKey?: string;
  model?: string;
  prompt?: string;
};

export type ResendInputs = {
  apiKey?: string;
  from?: string;
  to?: string;
  subject?: string;
};

export type AppNodeData = {
  inputs?: {
    apiKey?: string;
    model?: string;
    prompt?: string;
    interval?: string;
    from?: string;
    to?: string;
    subject?: string;
  };
  received?: unknown;
};

export type AppNode = Node<AppNodeData>;
