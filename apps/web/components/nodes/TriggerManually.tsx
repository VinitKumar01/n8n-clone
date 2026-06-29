"use client";

import React, { useCallback } from "react";
import { Position } from "reactflow";
import { MousePointerClick } from "lucide-react";
import { useUser } from "@clerk/nextjs";
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
import { CustomHandle } from "./NodeWrapper";

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
      className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 min-w-[200px] text-neutral-800 dark:text-neutral-100 overflow-hidden cursor-pointer"
      role="button"
      title="Run workflow from this node"
      onClick={workflowId && status ? executeNode : undefined}
    >
      <div className="flex items-center gap-2.5 p-3.5">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500 shadow-sm">
          <MousePointerClick className="h-4.5 w-4.5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
            Manual Trigger
          </span>
          <span className="text-[9px] text-neutral-400 dark:text-neutral-500">
            Click to start workflow
          </span>
        </div>
      </div>
      <CustomHandle type="source" position={Position.Right} />
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
