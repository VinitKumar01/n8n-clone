"use client";

import { useEffect, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "./nodes/Nodes";
import { Button } from "./ui/button";
import { Circle } from "lucide-react";
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
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");

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

  const handleSave = async () => {
    if (user?.id) {
      const newId = await saveWorkflow(user.id);
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
      <div className="bg-[#262626] rounded-md flex justify-between gap-4 items-center py-2 absolute z-10 top-2 left-2">
        <div className="flex justify-center items-center gap-2 px-3 text-[#E5E5E5] text-sm">
          Status: {status ? "Active" : "Inactive"}
          {status ? (
            <Circle
              className="bg-transparent fill-green-500 stroke-green-500 animate-pulse"
              size={10}
            />
          ) : (
            <Circle
              className="bg-transparent fill-orange-400 stroke-orange-400"
              size={10}
            />
          )}
        </div>
        <div className="gap-2 flex justify-end px-2">
          <Button
            size="sm"
            onClick={() => {
              if (!workflowName || workflowName === "default") {
                setNameDialogOpen(true);
                return;
              }
              handleSave();
            }}
            disabled={isSaved}
          >
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button
            size="sm"
            disabled={!workflowId || !user?.id}
            onClick={async () => {
              if (user?.id) {
                await toggleWorkflowStatus(user.id);
              }
            }}
          >
            {status ? "Deactivate" : "Activate"}
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
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
        <ToolBar
          setNodesAction={(nd) => {
            addNode(nd.type);
          }}
        />
      </ReactFlow>
    </div>
  );
}
