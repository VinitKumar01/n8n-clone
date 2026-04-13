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
import { MergeIcon, WebhookIcon, MailIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import GeminiIcon from "@/icons/GeminiIcon";
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
export type WebhookData = MutableNodeData<{
  workflowId?: string;
  status?: boolean;
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
export type MergeData = MutableNodeData<{
  received?: NodePayload;
}>;
export type SchedulerData = MutableNodeData<{
  inputs?: {
    interval?: string;
  };
  workflowId?: string;
  status?: boolean;
  setNodes?: Dispatch<SetStateAction<RFNode<AppNodeData>[]>>;
}>;
export type ResendInputs = {
  apiKey?: string;
  from?: string;
  to?: string;
  subject?: string;
};
export type ResendData = MutableNodeData<{
  inputs?: ResendInputs;
  received?: NodePayload;
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
        <pre className="text-sm p-2 rounded bg-[#111111] text-wrap break-words">
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
export function WebhookNode({ id, data }: { id: string; data: WebhookData }) {
  const status = data.status;
  const workflowId = data.workflowId;
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (workflowId) {
      setUrl(`${base}/webhook/${workflowId}/${id}`);
    } else {
      setUrl(`${base}/webhook/<workflowId>/${id}`);
    }
  }, [workflowId, id]);
  const NodeBody = (
    <div className="bg-[#262626] p-4 rounded-2xl cursor-pointer">
      <div className="flex justify-center w-full">
        <WebhookIcon />
      </div>
      <div className="mt-2">
        <div className="text-xs text-muted-foreground mb-1">
          Webhook trigger
        </div>
        <pre className="text-sm p-2 rounded bg-[#111111] text-wrap break-words">
          POST
        </pre>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
  if (!workflowId || !status) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{NodeBody}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Webhook not available</AlertDialogTitle>
            <AlertDialogDescription>
              Webhooks can only be used when the workflow is saved and
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
  return (
    <Dialog>
      <DialogTrigger asChild>{NodeBody}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Webhook Node</DialogTitle>
          <DialogDescription>
            Send a POST request to the URL below to trigger this workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="text-xs text-muted-foreground">Webhook URL</div>
          <pre className="text-xs bg-[#111] p-2 rounded text-wrap break-all">
            {url}
          </pre>
          <Button onClick={() => navigator.clipboard.writeText(url)}>
            Copy URL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function MergeNode({ data }: { data: MergeData }) {
  const payload = data.received;
  return (
    <div className="p-2 border rounded-2xl bg-[#262626]">
      <div className="flex justify-center items-center p-4 gap-2">
        <MergeIcon />
        <div>Merge</div>
      </div>
      <pre className="text-xs p-1 rounded max-w-48 text-wrap break-words">
        {payload ? prettyPrintPayload(payload) : ""}
      </pre>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
export function SchedulerNode({
  id,
  data,
}: {
  id: string;
  data: SchedulerData;
}) {
  const [interval, setInterval] = useState<string>(
    data.inputs?.interval ?? "5m",
  );
  const [inputValue, setInputValue] = useState<string>(
    data.inputs?.interval ?? "5m",
  );
  const status = data.status;
  const workflowId = data.workflowId;
  const NodeBody = (
    <div className="bg-[#262626] p-4 rounded-2xl cursor-pointer min-w-[160px]">
      <div className="flex justify-center w-full mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div className="text-xs text-muted-foreground mb-1">Scheduler</div>
      <pre className="text-sm p-2 rounded bg-[#111111] text-wrap break-words">
        every {interval}
      </pre>
      <Handle type="source" position={Position.Right} />
    </div>
  );
  if (!workflowId || !status) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{NodeBody}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Scheduler not active</AlertDialogTitle>
            <AlertDialogDescription>
              The scheduler only runs when the workflow is saved and activated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Okay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>{NodeBody}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scheduler Node</DialogTitle>
          <DialogDescription>
            Set how often this workflow should run. Use Go duration syntax (e.g.
            30s, 5m, 1h).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="text-xs text-muted-foreground">Interval</div>
          <input
            className="border border-dashed border-white rounded-md p-2 bg-transparent"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. 30s, 5m, 1h"
          />
          <Button
            onClick={() => {
              const val = inputValue.trim() || "5m";
              setInterval(val);
              data.setNodes?.((nds: RFNode<AppNodeData>[]) =>
                nds.map((node) =>
                  node.id === id
                    ? {
                        ...node,
                        data: {
                          ...node.data,
                          inputs: { interval: val },
                        },
                      }
                    : node,
                ),
              );
            }}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function ResendNode({ id, data }: { id: string; data: ResendData }) {
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const [to, setTo] = useState<string | undefined>(
    (data.inputs as ResendInputs | undefined)?.to,
  );
  const [subject, setSubject] = useState<string | undefined>(
    (data.inputs as ResendInputs | undefined)?.subject,
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
          <MailIcon size={28} />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Email Node</DialogTitle>
            <DialogTrigger className="flex justify-start">
              <pre>To get Resend api-key visit: </pre>
              <Link
                href={"https://resend.com/api-keys"}
                className="text-blue-500"
              >
                Resend Dashboard
              </Link>
            </DialogTrigger>
            <DialogDescription>
              These options will be used when this node is triggered by the
              workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col justify-center items-center gap-4 p-4 rounded-2xl">
            <input
              ref={apiKeyRef}
              placeholder="Resend API Key"
              className="border border-dashed border-white rounded-md p-2 w-full"
              defaultValue={(data.inputs as ResendInputs | undefined)?.apiKey}
            />
            <input
              ref={fromRef}
              placeholder="From (e.g. you@yourdomain.com)"
              className="border border-dashed border-white rounded-md p-2 w-full"
              defaultValue={(data.inputs as ResendInputs | undefined)?.from}
            />
            <input
              ref={toRef}
              placeholder="To (recipient email)"
              className="border border-dashed border-white rounded-md p-2 w-full"
              defaultValue={to}
            />
            <input
              ref={subjectRef}
              placeholder="Subject"
              className="border border-dashed border-white rounded-md p-2 w-full"
              defaultValue={subject}
            />
            <Button
              onClick={() => {
                const newApiKey = apiKeyRef.current?.value ?? "";
                const newFrom = fromRef.current?.value ?? "";
                const newTo = toRef.current?.value ?? "";
                const newSubject = subjectRef.current?.value ?? "";
                setTo(newTo);
                setSubject(newSubject);
                data.setNodes?.((nds: RFNode<AppNodeData>[]) =>
                  nds.map((node) =>
                    node.id === id
                      ? {
                          ...node,
                          data: {
                            ...node.data,
                            inputs: {
                              apiKey: newApiKey,
                              from: newFrom,
                              to: newTo,
                              subject: newSubject,
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
        <div className="text-xs text-muted-foreground mb-2">Sending to</div>
        <pre className="text-sm p-2 rounded bg-[#111111] text-wrap break-words">
          {to ?? "<not configured>"}
        </pre>
      </div>
      <div className="mt-2">
        <div className="text-xs text-muted-foreground mb-2">Subject</div>
        <pre className="text-sm p-2 rounded bg-[#111111] text-wrap break-words">
          {subject ?? "<not configured>"}
        </pre>
      </div>
      <div className="mt-3">
        <div className="text-xs text-muted-foreground mb-1">Last send</div>
        <pre className="text-xs p-1 rounded max-w-48 text-wrap break-words">
          {output ? prettyPrintPayload(output) : "<not sent yet>"}
        </pre>
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
export const nodeTypes = {
  triggerManually: TriggerManually,
  geminiNode: GeminiNode,
  showOutput: ShowOutput,
  webhookNode: WebhookNode,
  mergeNode: MergeNode,
  schedulerNode: SchedulerNode,
  resendNode: ResendNode,
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
    name: "Merge",
    type: "mergeNode",
    component: () => {
      return (
        <div className="p-4 h-full flex justify-center items-center border rounded-2xl bg-[#262626]">
          <div className="flex flex-col justify-center items-center gap-2">
            <MergeIcon />
            <div>Merge</div>
          </div>
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
  {
    name: "Scheduler",
    type: "schedulerNode",
    component: () => {
      return (
        <div className="h-full bg-[#262626] p-4 rounded-2xl flex flex-col justify-center items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div className="text-xs font-semibold">Scheduler</div>
        </div>
      );
    },
  },
  {
    name: "Email",
    type: "resendNode",
    component: () => {
      return (
        <div className="h-full bg-[#262626] p-4 rounded-2xl flex flex-col justify-center items-center gap-1">
          <MailIcon size={28} />
          <div className="text-xs font-semibold">Email</div>
        </div>
      );
    },
  },
];
