"use client";
import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  XYPosition,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "./nodes/Nodes";
import { Button } from "./ui/button";
import { Circle } from "lucide-react";
import ToolBar from "./ToolBar";
import { useUser } from "@clerk/nextjs";
import type {
  TriggerData,
  GeminiData,
  ShowOutputData,
  WebhookData,
  MergeData,
  SchedulerData,
  ResendData,
} from "./nodes/Nodes";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
export type AppNodeData =
  | TriggerData
  | GeminiData
  | ShowOutputData
  | WebhookData
  | MergeData
  | SchedulerData
  | ResendData;
export type AppNode = Node<AppNodeData>;
export default function Flow({
  saveAction,
  nds,
  egs,
  sts,
  workflowId,
  wfName,
}: {
  saveAction: (
    nodes: Node<AppNodeData>[],
    edges: Edge[],
    status: boolean,
    workflow_name: string,
    id?: string,
  ) => void;
  nds?: Node<AppNodeData>[];
  egs?: Edge[];
  sts?: boolean;
  workflowId?: string;
  wfName?: string;
}) {
  const [status, setStatus] = useState<boolean>(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [workflowName, setWorkflowName] = useState<string>("default");
  const { user } = useUser();
  const [isSaved, setIsSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<{
    nodes: Node<AppNodeData>[];
    edges: Edge[];
  } | null>(null);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  useEffect(() => {
    if (!lastSaved) {
      setIsSaved(false);
      return;
    }
    const nodesChanged =
      JSON.stringify(nodes) !== JSON.stringify(lastSaved.nodes);
    const edgesChanged =
      JSON.stringify(edges) !== JSON.stringify(lastSaved.edges);
    setIsSaved(!(nodesChanged || edgesChanged));
  }, [nodes, edges, lastSaved]);
  const handleSend = useCallback(
    (nodeId: string, payload: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  received: payload,
                } as AppNodeData,
              }
            : n,
        ),
      );
    },
    [setNodes],
  );
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );
  const nodesWithHandlers: Node<AppNodeData>[] = nodes.map((n) => {
    const baseData = (n.data ?? {}) as AppNodeData;
    if (n.type === "triggerManually") {
      return {
        ...n,
        data: {
          ...baseData,
          onSend: handleSend,
          workflowId,
          status,
        } as AppNodeData,
      };
    }
    if (n.type === "geminiNode") {
      return {
        ...n,
        data: {
          ...baseData,
          onSend: handleSend,
          setNodes,
        } as AppNodeData,
      };
    }
    if (n.type === "webhookNode") {
      return {
        ...n,
        data: {
          ...n.data,
          workflowId,
          status,
        },
      };
    }
    if (n.type === "schedulerNode") {
      return {
        ...n,
        data: {
          ...baseData,
          workflowId,
          status,
          setNodes,
        } as AppNodeData,
      };
    }
    if (n.type === "resendNode") {
      return {
        ...n,
        data: {
          ...baseData,
          setNodes,
        } as AppNodeData,
      };
    }
    return { ...n, data: baseData };
  });
  useEffect(() => {
    if (nds && nodes.length === 0) {
      setNodes(nds);
      setLastSaved({ nodes: nds, edges: egs ?? [] });
      setIsSaved(true);
    }
    if (egs && edges.length === 0) {
      setEdges(egs);
    }
    if (sts !== undefined) {
      setStatus(sts);
    }
    if (wfName !== undefined) {
      setWorkflowName(wfName);
    }
  }, [nds, egs, sts, wfName, edges.length, nodes.length, setNodes, setEdges]);
  const save = async () => {
    saveAction(nodesWithHandlers, edges, status, workflowName);
    setIsSaved(true);
  };
  const autoSave = useDebouncedCallback(save, 5000);
  useEffect(() => {
    if (workflowId) {
      autoSave();
    }
  }, [autoSave, nodesWithHandlers, edges, status, workflowId]);
  return (
    <div className="w-full h-full">
      <div className="bg-[#262626] rounded-md flex justify-between gap-4 items-center py-2 absolute z-10">
        <div className="flex justify-center items-center gap-2 px-2">
          Status
          {status ? (
            <Circle
              className="bg-transparent fill-green-500 stroke-green-500"
              size={10}
            />
          ) : (
            <Circle
              className="bg-transparent fill-orange-400 stroke-orange-400"
              size={10}
            />
          )}
        </div>
        <div className="gap-4 flex justify-end px-2">
          <Button
            onClick={() => {
              if (wfName === undefined) {
                setNameDialogOpen(true);
                return;
              }
              saveAction(nodesWithHandlers, edges, status, workflowName);
              setLastSaved({ nodes, edges });
              setIsSaved(true);
            }}
            disabled={isSaved}
          >
            Save
          </Button>
          <Button
            disabled={!workflowId}
            onClick={async () => {
              if (!workflowId) {
                console.error("No workflowId provided");
                return;
              }
              if (!user?.id) {
                console.error("No user found");
                return;
              }
              const newStatus = status ? "not-active" : "active";
              try {
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/workflow/status`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      workflow_id: workflowId,
                      user_id: user.id,
                      status: newStatus,
                    }),
                  },
                );
                if (!response.ok) {
                  const text = await response.text();
                  console.error("Failed to update workflow status:", text);
                  return;
                }
                setStatus((prev) => !prev);
              } catch (err) {
                console.error("Status update error:", err);
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
                  const finalName = nameInput || "default";
                  setWorkflowName(finalName);
                  saveAction(nodesWithHandlers, edges, status, finalName);
                  setLastSaved({ nodes, edges });
                  setIsSaved(true);
                  setNameDialogOpen(false);
                }}
              >
                Done
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReactFlow
        nodes={nodesWithHandlers}
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
            setNodes((prev: Node<AppNodeData>[]) => {
              const last = prev[prev.length - 1];
              const newId = last ? `${Number(last.id) + 1}` : "1";
              const template = nd as Partial<Node<AppNodeData>>;
              const newNode: Node<AppNodeData> = {
                id: newId,
                type: template.type ?? "default",
                position: (template.position as XYPosition) ?? {
                  x: last ? last.position.x + 10 : 100,
                  y: last ? last.position.y + 10 : 100,
                },
                data: (template.data as AppNodeData) ?? ({} as AppNodeData),
              };
              return [...prev, newNode];
            });
          }}
        />
      </ReactFlow>
    </div>
  );
}
