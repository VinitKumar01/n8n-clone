"use client";

import React, { useEffect, useState } from "react";
import { Position } from "reactflow";
import Link from "next/link";
import { Mail, Settings, AlertCircle } from "lucide-react";
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
import { Input } from "../ui/input";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { AppNodeData } from "@/types/workflow";
import {
  NodeWrapper,
  CustomHandle,
  prettyPrintPayload,
  OUTPUT_WARNING_TOOLTIP,
} from "./NodeWrapper";

export function ResendNode({ id, data }: { id: string; data: AppNodeData }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const inputs = data.inputs ?? {};
  const to = inputs.to;
  const subject = inputs.subject;
  const output = data.received ?? null;

  const [localApiKey, setLocalApiKey] = useState<string>(inputs.apiKey ?? "");
  const [localFrom, setLocalFrom] = useState<string>(inputs.from ?? "");
  const [localTo, setLocalTo] = useState<string>(to ?? "");
  const [localSubject, setLocalSubject] = useState<string>(subject ?? "");

  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalApiKey(inputs.apiKey ?? "");
      setLocalFrom(inputs.from ?? "");
      setLocalTo(to ?? "");
      setLocalSubject(subject ?? "");
    }
  }, [isOpen, inputs.apiKey, inputs.from, to, subject]);

  const collapsedContent = (
    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex flex-col gap-0.5 text-left">
      <div className="flex justify-between">
        <span>To:</span>
        <span className="font-semibold truncate max-w-[140px]">
          {to ?? "Not set"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Status:</span>
        <span className="font-semibold">{output ? "Sent" : "Idle"}</span>
      </div>
    </div>
  );

  const isInvalid =
    !localApiKey.trim() || !localTo.trim() || !localSubject.trim();

  return (
    <NodeWrapper
      title="Send Email"
      icon={<Mail className="h-4.5 w-4.5" />}
      iconBg="bg-pink-500/10 text-pink-500"
      hasOutput
      output={output}
      collapsedContent={collapsedContent}
      leftHandle={<CustomHandle type="target" position={Position.Left} />}
      dialogTrigger={
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <Settings className="h-3.5 w-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resend Settings</DialogTitle>
              <div className="flex justify-start text-xs pt-1 text-muted-foreground">
                <span>Generate API Keys at: </span>
                <Link
                  href="https://resend.com/api-keys"
                  target="_blank"
                  className="text-primary hover:underline ml-1 font-semibold"
                >
                  Resend Dashboard
                </Link>
              </div>
              <DialogDescription className="pt-2 text-xs">
                Configure your mailing credentials and default values for
                automated notifications. Fields marked with{" "}
                <span className="text-red-500 font-bold">*</span> are required.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-0.5">
                    Resend API Key{" "}
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Input
                    type="password"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="re_..."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    From Address
                  </label>
                  <Input
                    value={localFrom}
                    onChange={(e) => setLocalFrom(e.target.value)}
                    placeholder="onboarding@resend.dev"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-0.5">
                    To Address <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Input
                    value={localTo}
                    onChange={(e) => setLocalTo(e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-0.5">
                    Subject <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Input
                    value={localSubject}
                    onChange={(e) => setLocalSubject(e.target.value)}
                    placeholder="Notification Alert"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                disabled={isSaving || saveSuccess || isInvalid}
                onClick={() => {
                  setIsSaving(true);
                  updateNodeData(id, {
                    inputs: {
                      apiKey: localApiKey,
                      from: localFrom,
                      to: localTo,
                      subject: localSubject,
                    },
                  });
                  setTimeout(() => {
                    setIsSaving(false);
                    setSaveSuccess(true);
                    setTimeout(() => {
                      setSaveSuccess(false);
                      setIsOpen(false);
                    }, 500);
                  }, 600);
                }}
              >
                {isSaving
                  ? "Saving values..."
                  : saveSuccess
                    ? "Saved!"
                    : "Save values"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="flex flex-col gap-2 text-left">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
            To
          </span>
          <div className="text-[10px] font-mono p-1 rounded border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 truncate text-neutral-600 dark:text-neutral-300">
            {to ?? (
              <span className="italic text-neutral-400">Not configured</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
            Subject
          </span>
          <div className="text-[10px] font-mono p-1 rounded border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 truncate text-neutral-600 dark:text-neutral-300">
            {subject ?? (
              <span className="italic text-neutral-400">Not configured</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 select-none">
            <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
              Status
            </span>
            <span
              title={OUTPUT_WARNING_TOOLTIP}
              className="cursor-help text-amber-500 hover:text-amber-600 transition-colors flex items-center justify-center"
            >
              <AlertCircle className="h-3 w-3" />
            </span>
          </div>
          <div className="text-[10px] font-mono p-1.5 rounded border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 max-h-16 overflow-y-auto text-neutral-600 dark:text-neutral-300 text-wrap break-words">
            {output ? (
              prettyPrintPayload(output)
            ) : (
              <span className="italic text-neutral-400">
                Waiting for trigger
              </span>
            )}
          </div>
        </div>
      </div>
    </NodeWrapper>
  );
}
