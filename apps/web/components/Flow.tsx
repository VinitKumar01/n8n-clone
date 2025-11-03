"use client";

import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "./nodes/Nodes";

export default function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "1",
      type: "triggerManually",
      position: { x: 100, y: 100 },
      data: {},
    },
    {
      id: "2",
      type: "showOutput",
      position: { x: 400, y: 100 },
      data: { received: {} },
    },
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
    n.type === "triggerManually"
      ? { ...n, data: { ...n.data, onSend: handleSend } }
      : n,
  );

  return (
    <div className="w-full h-full">
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
      </ReactFlow>
    </div>
  );
}
