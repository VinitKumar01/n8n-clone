"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Handle, Position, Node as RFNode } from "reactflow";
import "reactflow/dist/style.css";
import { IconPointer } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Link from "next/link";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { WebhookIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import GeminiIcon from "@/app/icons/GeminiIcon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

import type { Dispatch, SetStateAction } from "react";
import type { AppNodeData } from "../Flow";

export type NodePayload = unknown;
export type OnSend = (nodeId: string, payload: NodePayload) => void;

type MutableNodeData<T> = T & { [key: string]: unknown };

export type TriggerData = MutableNodeData<{
  onSend?: OnSend;
  workflowId: string;
  received?: NodePayload;
  status: boolean;
}>;

export type GeminiInputs = {
  apiKey?: string;
  model?: string;
  prompt?: string;
};

export type GeminiData = MutableNodeData<{
  inputs?: GeminiInputs;
  onSend?: OnSend;
  received?: NodePayload;
  setNodes?: Dispatch<SetStateAction<RFNode<AppNodeData>[]>>;
}>;

export type ShowOutputData = MutableNodeData<{
  received?: NodePayload;
}>;

export type WebhookData = MutableNodeData<{
  inputs?: { path?: string };
  setNodes?: Dispatch<SetStateAction<RFNode<AppNodeData>[]>>;
}>;

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function prettyPrintPayload(p: NodePayload): string {
  if (p === null || p === undefined) return "<no output yet>";
  if (isString(p)) return p;
  try {
    return JSON.stringify(p, null, 2);
  } catch {
    return String(p);
  }
}

export function TriggerManually({
  id,
  data,
}: {
  id: string;
  data: TriggerData;
}) {
  const status = data.status;
  const { user } = useUser();

  const executeNode = useCallback(async () => {
    if (!data.workflowId || !status) {
      return;
    }

    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/${data.workflowId}/execute`,
        {
          method: "POST",
          headers: myHeaders,
          body: JSON.stringify({
            startNode: id,
            userId: user?.id,
          }),
          redirect: "follow",
        },
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Failed to execute workflow:", response.status, text);
        return;
      }

      const body = (await response.json()) as {
        results?: Record<string, NodePayload>;
      };

      const results = body.results ?? {};

      Object.entries(results).forEach(([nodeId, payload]) => {
        try {
          data.onSend?.(nodeId, payload);
        } catch (e) {
          console.error("onSend error for node", nodeId, e);
        }
      });
    } catch (err) {
      console.error("Error executing workflow:", err);
    }
  }, [id, data, user?.id, status]);

  const TriggerContent = (
    <div
      className="border p-4 bg-[#262626] rounded-2xl cursor-pointer"
      role="button"
      title="Run workflow from this node"
      onClick={data.workflowId ? executeNode : undefined}
    >
      <IconPointer size={35} />
      <pre className="font-semibold">Click</pre>
      <Handle type="source" position={Position.Right} />
    </div>
  );

  if (!data.workflowId || !status) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{TriggerContent}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{"Can't trigger this node"}</AlertDialogTitle>
            <AlertDialogDescription>
              This action can only be done when the workflow is saved and
              activated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Okay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return TriggerContent;
}

export function GeminiNode({ id, data }: { id: string; data: GeminiData }) {
  const promptRef = useRef<HTMLInputElement>(null);
  const apiKeyRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState<string | undefined>(
    (data.inputs as GeminiInputs | undefined)?.prompt,
  );
  const [apiKey, setApiKey] = useState<string | undefined>(
    (data.inputs as GeminiInputs | undefined)?.apiKey,
  );
  const [model, setModel] = useState<string>(
    (data.inputs as GeminiInputs | undefined)?.model ?? "gemini-2.5-flash",
  );

  const [output, setOutput] = useState<NodePayload | null>(
    (data.received as NodePayload) ?? null,
  );

  useEffect(() => {
    if (data.received !== undefined) {
      setOutput(data.received as NodePayload);
    }
  }, [data.received]);

  return (
    <div className="bg-[#262626] p-4 rounded-2xl">
      <Dialog>
        <DialogTrigger className="flex justify-center items-center w-full">
          <GeminiIcon />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gemini Node options</DialogTitle>
            <DialogTrigger className="flex justify-start">
              <pre>To get Gemini api-key visit: </pre>
              <Link
                href={"https://aistudio.google.com/app/apikey"}
                className="text-blue-500"
              >
                Google AI Studio
              </Link>
            </DialogTrigger>
            <DialogDescription>
              These options will be used when this node is triggered by the
              workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col justify-center items-center gap-4 p-4 rounded-2xl">
            <input
              ref={promptRef}
              placeholder="Prompt"
              className="border border-dashed border-white rounded-md p-2"
              defaultValue={prompt}
            />
            <input
              ref={apiKeyRef}
              placeholder="ApiKey"
              className="border border-dashed border-white rounded-md p-2"
              defaultValue={apiKey}
            />
            <Select
              onValueChange={(value: string) => setModel(value)}
              defaultValue={model}
            >
              <SelectTrigger className="w-[270px]">
                <SelectValue placeholder="Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Models</SelectLabel>
                  <SelectItem value="gemini-2.5-flash">
                    gemini-2.5-flash
                  </SelectItem>
                  <SelectItem value="gemini-2.5-pro">gemini-2.5-pro</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                const newApiKey = apiKeyRef.current?.value ?? "";
                const newPrompt = promptRef.current?.value ?? "";

                setApiKey(newApiKey);
                setPrompt(newPrompt);

                data.setNodes?.((nds) =>
                  nds.map((node) =>
                    node.id === id
                      ? {
                          ...node,
                          data: {
                            ...node.data,
                            inputs: {
                              apiKey: newApiKey,
                              model,
                              prompt: newPrompt,
                            },
                          },
                        }
                      : node,
                  ),
                );
              }}
            >
              Save values
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-2">
        <div className="text-xs text-muted-foreground mb-2">
          Configured prompt
        </div>
        <pre className="text-sm p-2 rounded bg-[#111111] break-words">
          {prompt ?? "<not configured>"}
        </pre>
      </div>

      <div className="mt-3">
        <div className="text-xs text-muted-foreground mb-1">Output</div>
        <pre className="text-xs p-1 rounded max-w-48 text-wrap break-words">
          {output ? prettyPrintPayload(output) : "<no output yet>"}
        </pre>
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function ShowOutput({ data }: { data: ShowOutputData }) {
  const payload = data.received;

  return (
    <div className="p-2 border rounded-2xl bg-[#262626]">
      <div>Show Output</div>
      <pre className="text-xs p-1 rounded max-w-48 text-wrap break-words">
        {payload ? prettyPrintPayload(payload) : ""}
      </pre>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

export function WebhookNode({
  id,
  data,
  workflowId,
}: {
  id: string;
  data: WebhookData;
  workflowId?: string;
}) {
  const pathRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string | undefined>(
    (data.inputs as { path?: string } | undefined)?.path,
  );
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (workflowId && path) {
      setUrl(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/webhook/${workflowId}/${path}`,
      );
    } else if (path) {
      setUrl(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/webhook/<workflowId>/${path}`,
      );
    } else {
      setUrl(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/webhook/<workflowId>/<path>`,
      );
    }
  }, [path, workflowId]);

  return (
    <div className="bg-[#262626] p-4 rounded-2xl">
      <Dialog>
        <DialogTrigger>
          <WebhookIcon />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Node options</DialogTitle>
            <DialogTrigger className="flex justify-start">
              <pre className="text-start text-wrap break-all">{`Your final url will be: ${url}`}</pre>
            </DialogTrigger>
            <DialogDescription>
              This node will only work when the workflow is Saved and Activated.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col justify-center items-center gap-4 p-4 rounded-2xl">
            <input
              ref={pathRef}
              placeholder="Path"
              className="border border-dashed border-white rounded-md p-2"
              defaultValue={path}
            />
            <Button
              onClick={() => {
                const newPath = pathRef.current?.value ?? "";

                setPath(newPath);

                data.setNodes?.((nds) =>
                  nds.map((node) =>
                    node.id === id
                      ? {
                          ...node,
                          data: {
                            ...node.data,
                            inputs: { path: newPath },
                          },
                        }
                      : node,
                  ),
                );
              }}
            >
              Save values
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-2">
        <div className="text-xs text-muted-foreground mb-1">Webhook path</div>
        <pre className="text-sm p-2 rounded bg-[#111111] break-words">
          {path ?? "<not configured>"}
        </pre>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const nodeTypes = {
  triggerManually: TriggerManually,
  geminiNode: GeminiNode,
  showOutput: ShowOutput,
  webhookNode: WebhookNode,
};

export const nodes = [
  {
    name: "Gemini",
    type: "geminiNode",
    component: () => {
      return (
        <div className="h-full bg-[#262626] p-4 rounded-2xl flex justify-center items-center">
          <Image
            src={"/gemini-color.svg"}
            alt="Gemini"
            width={50}
            height={50}
            className="cursor-pointer"
          />
        </div>
      );
    },
  },
  {
    name: "Output",
    type: "showOutput",
    component: () => {
      return (
        <div className="p-4 h-full flex justify-center items-center border rounded-2xl bg-[#262626]">
          <div className="font-semibold">Output</div>
        </div>
      );
    },
  },
  {
    name: "Webhook",
    type: "webhookNode",
    component: () => {
      return (
        <div className="h-full w-full bg-[#262626] p-4 rounded-2xl flex justify-center items-center">
          <WebhookIcon />
        </div>
      );
    },
  },
  {
    name: "Manual",
    type: "triggerManually",
    component: () => {
      return (
        <div className="h-full border p-4 bg-[#262626] rounded-2xl cursor-pointer">
          <IconPointer size={35} />
          <pre className="font-semibold">Click</pre>
        </div>
      );
    },
  },
];
