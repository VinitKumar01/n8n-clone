"use client";

import Workspace from "@/components/Workspace";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import React, { useEffect } from "react";

export default function Home() {
  const initNewWorkflow = useWorkflowStore((state) => state.initNewWorkflow);

  useEffect(() => {
    initNewWorkflow();
  }, [initNewWorkflow]);

  return <Workspace />;
}
