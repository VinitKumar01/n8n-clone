"use client";

import Worksapce from "@/components/Workspace";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Node, Edge } from "reactflow";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is missing");
}

export default function Home() {
  const { user } = useUser();

  const router = useRouter();

  const saveAction = async (
    nodes: Node[],
    edges: Edge[],
    status: boolean,
    workflow_name: string,
    id?: string,
  ) => {
    try {
      const response = await axios.post(BACKEND_URL + "/workflow", {
        id: id,
        workflow_name: workflow_name,
        user_id: user?.id,
        nodes: nodes,
        edges: edges,
        status: status ? "active" : "not-active",
      });

      const workflowId = response.data.id;

      if (workflowId) {
        router.push(`/workflow/${workflowId}`);
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
    }
  };

  return <Worksapce saveAction={saveAction} />;
}
