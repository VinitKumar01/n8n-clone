"use client";

import Worksapce from "@/components/Workspace";
import { getWorkflow } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Edge, Node } from "reactflow";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

type Workflow = {
  id: string;
  workflow_name: string;
  nodes: string;
  edges: string;
  status: "active" | "not-active";
  user_id: string;
};

export default function MyWorkflowsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useUser();
  const { id } = React.use(params);
  const [nodes, setNodes] = useState<Node[]>();
  const [edges, setEdges] = useState<Edge[]>();

  const saveAction = (nodes: Node[], edges: Edge[], status: boolean) => {
    axios.put(BACKEND_URL + "/workflow", {
      workflow_name: "test",
      user_id: user?.id,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
      status: status ? "active" : "not-active",
      workflow_id: id,
    });
  };

  useEffect(() => {
    const fetchWorkflow = async () => {
      const workflow = await getWorkflow(id);
      if (workflow) {
        const nodes = JSON.parse(workflow.nodes);
        setNodes(nodes);
        const edges = JSON.parse(workflow.edges);
        setEdges(edges);
      }
    };

    if (id) fetchWorkflow();
  }, [id]);

  return <Worksapce saveAction={saveAction} nodes={nodes} edges={edges} />;
}
