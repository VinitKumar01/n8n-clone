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

export default function Flow({
  saveAction,
  nds,
  egs,
  sts,
}: {
  saveAction: (nodes: Node[], edges: Edge[], status: boolean) => void;
  nds?: Node[];
  egs?: Edge[];
  sts?: boolean;
}) {
  const [status, setStatus] = useState<boolean>(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([
    // {
    //   id: "1",
    //   type: "triggerManually",
    //   position: { x: 100, y: 100 },
    //   data: {},
    // },
    // {
    //   id: "2",
    //   type: "showOutput",
    //   position: { x: 800, y: 200 },
    //   data: {},
    // },
    // {
    //   id: "3",
    //   type: "geminiNode",
    //   position: { x: 400, y: 100 },
    //   data: {},
    // },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleSend = useCallback(
    (sourceId: string, payload: JSON) => {
      setNodes((nds) => {
        const targets = edges
          .filter((e) => e.source === sourceId)
          .map((e) => e.target);

        return nds.map((n) =>
          targets.includes(n.id)
            ? { ...n, data: { ...n.data, received: payload } }
            : n,
        );
      });
    },
    [edges, setNodes],
  );
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const nodesWithHandlers = nodes.map((n) =>
    n.type === "triggerManually" || "geminiNode"
      ? { ...n, data: { ...n.data, onSend: handleSend } }
      : n,
  );

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
            onClick={() => {
              setStatus((prev) => !prev);
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
