"use client";

import React, { useEffect, useState } from "react";
import { Position } from "reactflow";
import { Webhook, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
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
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { NodeWrapper, CustomHandle } from "./NodeWrapper";

export function WebhookNode({ id }: { id: string }) {
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const status = useWorkflowStore((state) => state.status);
  const [url, setUrl] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (workflowId) {
      setUrl(`${base}/webhook/${workflowId}/${id}`);
    } else {
      setUrl(`${base}/webhook/<workflowId>/${id}`);
    }
  }, [workflowId, id]);

  const NodeBody = (
    <div className="flex flex-col gap-2 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
          Trigger Type
        </span>
        <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
          POST
        </span>
      </div>
      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
        Webhook trigger endpoint. Requires JSON payload.
      </span>
    </div>
  );

  const WebhookDialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Webhook trigger</DialogTitle>
        <DialogDescription>
          Send an HTTP POST request with a JSON payload to the URL endpoint
          below to trigger this workflow. The request must include valid JSON
          data (e.g. &#123;&#125; or custom parameters).
        </DialogDescription>
      </DialogHeader>
      <div className="py-2">
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            HTTP POST Endpoint URL
          </div>
          <pre className="text-xs font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg text-wrap break-all select-all text-neutral-600 dark:text-neutral-300">
            {url}
          </pre>
        </div>
      </div>
      <DialogFooter>
        <Button
          className="w-full"
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied Endpoint URL!" : "Copy Webhook URL"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  const settingsBtn = (
    <button className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
      <Settings className="h-3.5 w-3.5" />
    </button>
  );

  const dialogTrigger =
    !workflowId || !status ? (
      <AlertDialog>
        <AlertDialogTrigger asChild>{settingsBtn}</AlertDialogTrigger>
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
    ) : (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{settingsBtn}</DialogTrigger>
        {WebhookDialogContent}
      </Dialog>
    );

  return (
    <NodeWrapper
      title="Webhook trigger"
      icon={<Webhook className="h-4.5 w-4.5" />}
      iconBg="bg-emerald-500/10 text-emerald-500"
      dialogTrigger={dialogTrigger}
      rightHandle={<CustomHandle type="source" position={Position.Right} />}
    >
      {NodeBody}
    </NodeWrapper>
  );
}
