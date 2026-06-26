"use client";

import Workspace from "@/components/Workspace";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import React, { useEffect } from "react";

export default function MyWorkflowsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const initWorkflow = useWorkflowStore((state) => state.initWorkflow);

  useEffect(() => {
    if (id) {
      initWorkflow(id);
    }
  }, [id, initWorkflow]);

  return <Workspace />;
}
