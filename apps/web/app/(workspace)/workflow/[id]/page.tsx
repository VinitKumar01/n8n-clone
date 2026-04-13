"use client";

import Worksapce from "@/components/Workspace";
import { getWorkflow } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Edge, Node } from "reactflow";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function MyWorkflowsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useUser();
  const { id } = React.use(params);
  const [nodes, setNodes] = useState<Node[]>();
  const [edges, setEdges] = useState<Edge[]>();
  const [status, setStatus] = useState<boolean>();
  const [workflowName, setWorkflowName] = useState<string>();

  const saveAction = (
    nodes: Node[],
    edges: Edge[],
    status: boolean,
    workflowName: string,
  ) => {
    axios.put(BACKEND_URL + "/workflow", {
      workflow_name: workflowName,
      user_id: user?.id,
      nodes: nodes,
      edges: edges,
      status: status ? "active" : "not-active",
      workflow_id: id,
    });
  };

  useEffect(() => {
    const fetchWorkflow = async () => {
      const workflow = await getWorkflow(id);
      if (workflow) {
        const nds = workflow.nodes;
        setNodes(nds);
        const edgs = workflow.edges;
        setEdges(edgs);
        const status = workflow.status == "active" ? true : false;
        setStatus(status);
        const wfName = workflow.workflow_name;
        setWorkflowName(wfName);
      }
    };

    if (id) fetchWorkflow();
  }, [id]);

  return (
    <Worksapce
      saveAction={saveAction}
      nodes={nodes}
      edges={edges}
      status={status}
      workflowId={id}
      wfName={workflowName}
    />
  );
}
