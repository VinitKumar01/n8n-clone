"use client";

import { useEffect, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "./nodes/Nodes";
import { Button } from "./ui/button";
import { Loader2, FileEdit } from "lucide-react";
import ToolBar from "./ToolBar";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";

export default function Flow() {
  const { user } = useUser();
  const router = useRouter();

  const {
    nodes,
    edges,
    workflowId,
    workflowName,
    status,
    isSaved,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    saveWorkflow,
    toggleWorkflowStatus,
    setWorkflowNameState,
  } = useWorkflowStore();

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer?.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [reactFlowInstance, addNode],
  );

  const handleSave = async () => {
    if (user?.id) {
      setIsSavingWorkflow(true);
      const newId = await saveWorkflow(user.id);
      setIsSavingWorkflow(false);
      if (newId) {
        router.push(`/workflow/${newId}`);
      }
    }
  };

  const autoSave = useDebouncedCallback(handleSave, 5000);

  useEffect(() => {
    if (workflowId) {
      autoSave();
    }
  }, [autoSave, nodes, edges, status, workflowId]);

  return (
    <div className="w-full h-full relative">
      {/* Redesigned Floating Top Bar */}
      <div className="flex justify-between items-center bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-md p-2 px-4 absolute z-10 top-4 left-4 gap-4 pointer-events-auto">
        {/* Workflow Name */}
        <div className="flex items-center gap-2 border-r border-neutral-200 dark:border-neutral-800 pr-4 mr-2">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate max-w-[150px]">
            {workflowName === "default" ? "Untitled Workflow" : workflowName}
          </span>
          <button
            onClick={() => {
              setNameInput(workflowName === "default" ? "" : workflowName);
              setNameDialogOpen(true);
            }}
            className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Rename workflow"
          >
            <FileEdit className="h-3 w-3" />
          </button>
        </div>

        {/* Workflow Status */}
        <div className="flex items-center gap-2 pr-4 border-r border-neutral-200 dark:border-neutral-800">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Status
          </span>
          <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/80 px-2 py-0.5 rounded-lg select-none">
            {status ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Active
                </span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Inactive
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!workflowName || workflowName === "default") {
                setNameDialogOpen(true);
                return;
              }
              handleSave();
            }}
            disabled={isSaved || isSavingWorkflow}
            className="h-8 text-xs font-semibold px-3 cursor-pointer select-none"
          >
            {isSavingWorkflow ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              "Saved"
            ) : (
              "Save"
            )}
          </Button>
          <Button
            size="sm"
            disabled={!workflowId || !user?.id || isTogglingStatus}
            onClick={async () => {
              if (user?.id) {
                setIsTogglingStatus(true);
                await toggleWorkflowStatus(user.id);
                setIsTogglingStatus(false);
              }
            }}
            className="h-8 text-xs font-semibold px-3 cursor-pointer select-none"
          >
            {isTogglingStatus ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                {status ? "Deactivating..." : "Activating..."}
              </>
            ) : status ? (
              "Deactivate"
            ) : (
              "Activate"
            )}
          </Button>
        </div>
      </div>

      <Dialog
        open={nameDialogOpen}
        onOpenChange={(open) => setNameDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter workflow name</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <Input
              value={nameInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNameInput(e.target.value)
              }
              placeholder="Workflow name"
            />
          </div>
          <DialogFooter className="pt-4">
            <div className="flex gap-2 justify-end w-full">
              <Button
                variant="ghost"
                onClick={() => {
                  setNameDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const finalName = nameInput.trim() || "default";
                  setWorkflowNameState(finalName);
                  setNameDialogOpen(false);
                  if (user?.id) {
                    // Save immediately after name change
                    setTimeout(() => saveWorkflow(user.id), 100);
                  }
                }}
              >
                Done
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <MiniMap
          className="!bg-white/80 dark:!bg-neutral-900/80 !border !border-neutral-200 dark:!border-neutral-800 rounded-xl shadow-lg"
          maskColor="rgba(0, 0, 0, 0.05)"
          nodeColor={(node) => {
            if (node.type === "geminiNode") return "#6366f1";
            if (node.type === "resendNode") return "#ec4899";
            if (node.type === "webhookNode") return "#10b981";
            if (node.type === "schedulerNode") return "#8b5cf6";
            if (node.type === "triggerManually") return "#3b82f6";
            return "#6b7280";
          }}
        />
        <Controls />
        <Background />
        <ToolBar />
      </ReactFlow>
    </div>
  );
}
