"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import { IconPointer } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Input } from "../ui/input";
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
import { useWorkflowStore, AppNodeData } from "@/hooks/useWorkflowStore";

export type NodePayload = unknown;

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

// ----------------- TriggerManually -----------------
export function TriggerManually({ id }: { id: string }) {
  const { user } = useUser();
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const status = useWorkflowStore((state) => state.status);
  const executeWorkflow = useWorkflowStore((state) => state.executeWorkflow);

  const executeNode = useCallback(async () => {
    if (!workflowId || !status || !user?.id) {
      return;
    }
    await executeWorkflow(user.id, id);
  }, [id, workflowId, status, user?.id, executeWorkflow]);

  const TriggerContent = (
    <div
      className="border p-4 bg-[#262626] rounded-2xl cursor-pointer"
      role="button"
      title="Run workflow from this node"
      onClick={workflowId && status ? executeNode : undefined}
    >
      <IconPointer size={35} />
      <pre className="font-semibold text-[#E5E5E5] mt-1 text-center">Click</pre>
      <Handle type="source" position={Position.Right} />
    </div>
  );

  if (!workflowId || !status) {
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

// ----------------- GeminiNode -----------------
export function GeminiNode({ id, data }: { id: string; data: AppNodeData }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const promptRef = useRef<HTMLInputElement>(null);
  const apiKeyRef = useRef<HTMLInputElement>(null);

  const inputs = data.inputs ?? {};
  const prompt = inputs.prompt;
  const apiKey = inputs.apiKey;
  const model = inputs.model ?? "gemini-2.5-flash";
  const output = data.received ?? null;

  const [localModel, setLocalModel] = useState<string>(model);

  // Sync state if model changes externally
  useEffect(() => {
    setLocalModel(model);
  }, [model]);

  return (
    <div className="bg-[#262626] p-4 rounded-2xl border border-neutral-800 text-[#E5E5E5]">
      <Dialog>
        <DialogTrigger className="flex justify-center items-center w-full focus:outline-none">
          <GeminiIcon />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gemini Node options</DialogTitle>
            <div className="flex justify-start text-xs pt-1">
              <span>To get Gemini api-key visit: </span>
              <Link
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                className="text-blue-500 hover:underline ml-1"
              >
                Google AI Studio
              </Link>
            </div>
            <DialogDescription className="pt-2 text-xs">
              These options will be used when this node is triggered by the
              workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Prompt</label>
              <Input
                ref={promptRef}
                placeholder="Enter AI prompt..."
                defaultValue={prompt}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">API Key</label>
              <Input
                ref={apiKeyRef}
                type="password"
                placeholder="Enter Gemini API Key..."
                defaultValue={apiKey}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Model</label>
              <Select
                onValueChange={(value: string) => setLocalModel(value)}
                defaultValue={localModel}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Models</SelectLabel>
                    <SelectItem value="gemini-2.5-flash">
                      gemini-2.5-flash
                    </SelectItem>
                    <SelectItem value="gemini-2.5-pro">
                      gemini-2.5-pro
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                const newApiKey = apiKeyRef.current?.value ?? "";
                const newPrompt = promptRef.current?.value ?? "";
                updateNodeData(id, {
                  inputs: {
                    apiKey: newApiKey,
                    model: localModel,
                    prompt: newPrompt,
                  },
                });
              }}
            >
              Save values
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mt-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-bold">
          Configured prompt
        </div>
        <pre className="text-xs p-2 rounded bg-[#111111] text-wrap break-words max-h-24 overflow-y-auto">
          {prompt ?? "<not configured>"}
        </pre>
      </div>
      <div className="mt-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-bold">
          Output
        </div>
        <pre className="text-xs p-2 rounded bg-[#111111] max-w-48 text-wrap break-words max-h-32 overflow-y-auto">
          {output ? prettyPrintPayload(output) : "<no output yet>"}
        </pre>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

// ----------------- ShowOutput -----------------
export function ShowOutput({ data }: { data: AppNodeData }) {
  const payload = data.received;
  return (
    <div className="p-4 border border-neutral-800 rounded-2xl bg-[#262626] text-[#E5E5E5]">
      <div className="text-sm font-semibold mb-2 text-center">Show Output</div>
      <pre className="text-xs p-2 rounded bg-[#111111] max-w-48 text-wrap break-words max-h-40 overflow-y-auto">
        {payload ? prettyPrintPayload(payload) : "<waiting for data>"}
      </pre>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

// ----------------- WebhookNode -----------------
export function WebhookNode({ id }: { id: string }) {
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const status = useWorkflowStore((state) => state.status);
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
    <div className="bg-[#262626] p-4 border border-neutral-800 rounded-2xl cursor-pointer text-[#E5E5E5]">
      <div className="flex justify-center w-full mb-2">
        <WebhookIcon size={28} />
      </div>
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">
          Webhook trigger
        </div>
        <pre className="text-xs p-1 rounded bg-[#111111] inline-block px-2">
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
          <div className="text-xs text-muted-foreground font-semibold">
            Webhook URL
          </div>
          <pre className="text-xs bg-[#111] p-3 rounded text-wrap break-all select-all border border-neutral-800">
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

// ----------------- MergeNode -----------------
export function MergeNode({ data }: { data: AppNodeData }) {
  const payload = data.received;
  return (
    <div className="p-4 border border-neutral-800 rounded-2xl bg-[#262626] text-[#E5E5E5]">
      <div className="flex justify-center items-center gap-2 mb-2">
        <MergeIcon size={20} />
        <span className="text-sm font-semibold">Merge</span>
      </div>
      <pre className="text-xs p-2 rounded bg-[#111111] max-w-48 text-wrap break-words max-h-40 overflow-y-auto">
        {payload ? prettyPrintPayload(payload) : "<waiting for merge data>"}
      </pre>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

// ----------------- SchedulerNode -----------------
export function SchedulerNode({ id, data }: { id: string; data: AppNodeData }) {
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const status = useWorkflowStore((state) => state.status);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const interval = data.inputs?.interval ?? "5m";
  const [inputValue, setInputValue] = useState<string>(interval);

  useEffect(() => {
    setInputValue(interval);
  }, [interval]);

  const NodeBody = (
    <div className="bg-[#262626] p-4 border border-neutral-800 rounded-2xl cursor-pointer min-w-[160px] text-[#E5E5E5]">
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
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">Scheduler</div>
        <pre className="text-sm p-1 rounded bg-[#111111] inline-block px-2">
          every {interval}
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
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Interval</label>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. 30s, 5m, 1h"
            />
          </div>
          <Button
            onClick={() => {
              const val = inputValue.trim() || "5m";
              updateNodeData(id, {
                inputs: { interval: val },
              });
            }}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ----------------- ResendNode -----------------
export function ResendNode({ id, data }: { id: string; data: AppNodeData }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const apiKeyRef = useRef<HTMLInputElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const inputs = data.inputs ?? {};
  const to = inputs.to;
  const subject = inputs.subject;
  const output = data.received ?? null;

  return (
    <div className="bg-[#262626] p-4 border border-neutral-800 rounded-2xl text-[#E5E5E5] min-w-[160px]">
      <Dialog>
        <DialogTrigger className="flex justify-center items-center w-full focus:outline-none">
          <MailIcon size={28} />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Email Node</DialogTitle>
            <div className="flex justify-start text-xs pt-1">
              <span>To get Resend api-key visit: </span>
              <Link
                href="https://resend.com/api-keys"
                target="_blank"
                className="text-blue-500 hover:underline ml-1"
              >
                Resend Dashboard
              </Link>
            </div>
            <DialogDescription className="pt-2 text-xs">
              These options will be used when this node is triggered by the
              workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Resend API Key</label>
              <Input
                ref={apiKeyRef}
                type="password"
                placeholder="Enter Resend API Key..."
                defaultValue={inputs.apiKey}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">From Address</label>
              <Input
                ref={fromRef}
                placeholder="From (e.g. you@yourdomain.com)"
                defaultValue={inputs.from}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">To Address</label>
              <Input
                ref={toRef}
                placeholder="Recipient email address"
                defaultValue={to}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Subject</label>
              <Input
                ref={subjectRef}
                placeholder="Email Subject"
                defaultValue={subject}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                const newApiKey = apiKeyRef.current?.value ?? "";
                const newFrom = fromRef.current?.value ?? "";
                const newTo = toRef.current?.value ?? "";
                const newSubject = subjectRef.current?.value ?? "";
                updateNodeData(id, {
                  inputs: {
                    apiKey: newApiKey,
                    from: newFrom,
                    to: newTo,
                    subject: newSubject,
                  },
                });
              }}
            >
              Save values
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mt-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-bold">
          Sending to
        </div>
        <pre className="text-xs p-2 rounded bg-[#111111] text-wrap break-words">
          {to ?? "<not configured>"}
        </pre>
      </div>
      <div className="mt-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-bold">
          Subject
        </div>
        <pre className="text-xs p-2 rounded bg-[#111111] text-wrap break-words">
          {subject ?? "<not configured>"}
        </pre>
      </div>
      <div className="mt-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-bold">
          Last send status
        </div>
        <pre className="text-xs p-2 rounded bg-[#111111] max-w-48 text-wrap break-words max-h-24 overflow-y-auto">
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
            src="/gemini-color.svg"
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
        <div className="p-4 h-full flex justify-center items-center border border-neutral-800 rounded-2xl bg-[#262626]">
          <div className="font-semibold text-[#E5E5E5]">Output</div>
        </div>
      );
    },
  },
  {
    name: "Merge",
    type: "mergeNode",
    component: () => {
      return (
        <div className="p-4 h-full flex justify-center items-center border border-neutral-800 rounded-2xl bg-[#262626] text-[#E5E5E5]">
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
        <div className="h-full w-full bg-[#262626] p-4 rounded-2xl flex justify-center items-center text-[#E5E5E5]">
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
        <div className="h-full border border-neutral-800 p-4 bg-[#262626] rounded-2xl cursor-pointer text-[#E5E5E5]">
          <IconPointer size={35} />
          <pre className="font-semibold mt-1">Click</pre>
        </div>
      );
    },
  },
  {
    name: "Scheduler",
    type: "schedulerNode",
    component: () => {
      return (
        <div className="h-full bg-[#262626] p-4 rounded-2xl flex flex-col justify-center items-center gap-1 text-[#E5E5E5]">
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
        <div className="h-full bg-[#262626] p-4 rounded-2xl flex flex-col justify-center items-center gap-1 text-[#E5E5E5]">
          <MailIcon size={28} />
          <div className="text-xs font-semibold">Email</div>
        </div>
      );
    },
  },
];
