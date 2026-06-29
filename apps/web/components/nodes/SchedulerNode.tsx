"use client";

import React, { useEffect, useState } from "react";
import { Position } from "reactflow";
import { Clock, Settings } from "lucide-react";
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
import { AppNodeData } from "@/types/workflow";
import { NodeWrapper, CustomHandle } from "./NodeWrapper";

export function SchedulerNode({ id, data }: { id: string; data: AppNodeData }) {
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const status = useWorkflowStore((state) => state.status);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  const interval = data.inputs?.interval ?? "5m";
  const [inputValue, setInputValue] = useState<string>(interval);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue(interval);
    }
  }, [isOpen, interval]);

  const NodeBody = (
    <div className="flex flex-col gap-2 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
          Schedule
        </span>
        <span className="text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-mono">
          every {interval}
        </span>
      </div>
      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
        Trigger automatically on a schedule.
      </span>
    </div>
  );

  const isInvalid = !inputValue.trim();

  const SchedulerDialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Scheduler Options</DialogTitle>
        <DialogDescription>
          Configure how frequently this workflow should trigger. Use Go duration
          style (e.g. 10s, 5m, 2h). Fields marked with{" "}
          <span className="text-red-500 font-bold">*</span> are required.
        </DialogDescription>
      </DialogHeader>
      <div className="py-2">
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-0.5">
              Interval Rate <span className="text-red-500 font-bold">*</span>
            </label>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. 30s, 5m, 1h"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          className="w-full"
          disabled={isSaving || saveSuccess || isInvalid}
          onClick={() => {
            const val = inputValue.trim() || "5m";
            setIsSaving(true);
            updateNodeData(id, {
              inputs: { interval: val },
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
          {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Interval"}
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
    ) : (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{settingsBtn}</DialogTrigger>
        {SchedulerDialogContent}
      </Dialog>
    );

  return (
    <NodeWrapper
      title="Scheduler"
      icon={<Clock className="h-4.5 w-4.5" />}
      iconBg="bg-purple-500/10 text-purple-500"
      dialogTrigger={dialogTrigger}
      rightHandle={<CustomHandle type="source" position={Position.Right} />}
    >
      {NodeBody}
    </NodeWrapper>
  );
}
