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
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "./nodes/Nodes";
import { Button } from "./ui/button";
import { Circle } from "lucide-react";
import ToolBar from "./ToolBar";
import { useUser } from "@clerk/nextjs";

export default function Flow({
  saveAction,
  nds,
  egs,
  sts,
  workflowId,
}: {
  saveAction: (
    nodes: Node[],
    edges: Edge[],
    status: boolean,
    id?: string,
  ) => void;
  id?: string;
  nds?: Node[];
  egs?: Edge[];
  sts?: boolean;
  workflowId?: string;
}) {
  const [status, setStatus] = useState<boolean>(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { user } = useUser();

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
                },
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

  const nodesWithHandlers = nodes.map((n) => {
    if (n.type === "triggerManually") {
      return {
        ...n,
        data: {
          ...n.data,
          onSend: handleSend,
          workflowId,
        },
      };
    }

    if (n.type === "geminiNode") {
      return {
        ...n,
        data: {
          ...n.data,
          onSend: handleSend,
        },
      };
    }

    return n;
  });

  useEffect(() => {
    if (nds && nodes.length === 0) {
      setNodes(nds);
    }
    if (egs && edges.length === 0) {
      setEdges(egs);
    }
    if (sts) {
      setStatus(sts);
    }
  }, [
    nds,
    egs,
    sts,
    setStatus,
    setEdges,
    setNodes,
    nodes.length,
    edges.length,
  ]);

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
              saveAction(nodesWithHandlers, edges, status);
            }}
          >
            Save
          </Button>
          <Button
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
            setNodes((prev) => {
              const last = prev[prev.length - 1];
              return [
                ...prev,
                {
                  ...nd,
                  id: last ? `${parseInt(last.id) + 1}` : "1",
                  position: {
                    x: last ? last.position.x + 10 : 100,
                    y: last ? last.position.y + 10 : 100,
                  },
                },
              ];
            });
          }}
        />
      </ReactFlow>
    </div>
  );
}
