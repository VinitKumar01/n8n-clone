"use client";

import Worksapce from "@/components/Workspace";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { Node, Edge } from "reactflow";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export default function Home() {
  const { user } = useUser();

  const saveAction = (nodes: Node[], edges: Edge[], status: boolean) => {
    axios.post(BACKEND_URL + "/workflow", {
      workflow_name: "test",
      user_id: user?.id,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
      status: status ? "active" : "not-active",
    });
  };

  return <Worksapce saveAction={saveAction} />;
}
