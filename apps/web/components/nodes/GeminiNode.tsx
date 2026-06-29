"use client";

import React, { useEffect, useState } from "react";
import { Position } from "reactflow";
import Link from "next/link";
import Image from "next/image";
import { Settings, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
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
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { AppNodeData } from "@/types/workflow";
import {
  NodeWrapper,
  CustomHandle,
  prettyPrintPayload,
  OUTPUT_WARNING_TOOLTIP,
} from "./NodeWrapper";

export function GeminiNode({ id, data }: { id: string; data: AppNodeData }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const inputs = data.inputs ?? {};
  const prompt = inputs.prompt;
  const apiKey = inputs.apiKey;
  const model = inputs.model ?? "gemini-2.5-flash";
  const output = data.received ?? null;

  const [localModel, setLocalModel] = useState<string>(model);
  const [localPrompt, setLocalPrompt] = useState<string>(prompt ?? "");
  const [localApiKey, setLocalApiKey] = useState<string>(apiKey ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalModel(model);
      setLocalPrompt(prompt ?? "");
      setLocalApiKey(apiKey ?? "");
    }
  }, [isOpen, model, prompt, apiKey]);

  const collapsedContent = (
    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex flex-col gap-0.5 text-left">
      <div className="flex justify-between">
        <span>Model:</span>
        <span className="font-semibold">{localModel}</span>
      </div>
      <div className="flex justify-between truncate">
        <span>Prompt:</span>
        <span className="font-mono text-[9px] truncate max-w-[120px]">
          {prompt ?? "Not set"}
        </span>
      </div>
    </div>
  );

  const isInvalid = !localPrompt.trim() || !localApiKey.trim();

  return (
    <NodeWrapper
      title="Gemini AI"
      icon={
        <Image
          src="/gemini-color.svg"
          alt="Gemini"
          width={18}
          height={18}
          className="pointer-events-none select-none"
        />
      }
      iconBg="bg-indigo-50 dark:bg-indigo-950/30"
      hasOutput
      output={output}
      collapsedContent={collapsedContent}
      leftHandle={<CustomHandle type="target" position={Position.Left} />}
      rightHandle={<CustomHandle type="source" position={Position.Right} />}
      dialogTrigger={
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <Settings className="h-3.5 w-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gemini Settings</DialogTitle>
              <div className="flex justify-start text-xs pt-1 text-muted-foreground">
                <span>Generate API Keys at: </span>
                <Link
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  className="text-primary hover:underline ml-1 font-semibold"
                >
                  Google AI Studio
                </Link>
              </div>
              <DialogDescription className="pt-2 text-xs">
                Configure your API credentials and dynamic prompt instructions
                below. Fields marked with{" "}
                <span className="text-red-500 font-bold">*</span> are required.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-0.5">
                    Prompt <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Input
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
                    placeholder="Ask Gemini anything..."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-0.5">
                    API Key <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Input
                    type="password"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Model
                  </label>
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
                      model: localModel,
                      prompt: localPrompt,
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
      <div className="flex flex-col gap-2.5 text-left">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
            Prompt
          </span>
          <div className="text-[10px] font-mono p-1.5 rounded border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 max-h-16 overflow-y-auto text-neutral-600 dark:text-neutral-300 text-wrap break-words">
            {prompt ?? (
              <span className="italic text-neutral-400">Not configured</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 select-none">
            <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
              Output
            </span>
            <span
              title={OUTPUT_WARNING_TOOLTIP}
              className="cursor-help text-amber-500 hover:text-amber-600 transition-colors flex items-center justify-center"
            >
              <AlertCircle className="h-3 w-3" />
            </span>
          </div>
          <div className="text-[10px] font-mono p-1.5 rounded border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 max-h-24 overflow-y-auto text-neutral-600 dark:text-neutral-300 text-wrap break-words">
            {output ? (
              prettyPrintPayload(output)
            ) : (
              <span className="italic text-neutral-400">Waiting for data</span>
            )}
          </div>
        </div>
      </div>
    </NodeWrapper>
  );
}
