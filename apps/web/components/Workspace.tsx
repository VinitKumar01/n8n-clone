"use client";

import dynamic from "next/dynamic";
import { Edge, Node } from "reactflow";

const Flow = dynamic(() => import("../components/Flow"), { ssr: true });

export default function Worksapce({
  saveAction,
  nodes,
  edges,
  status,
  workflowId,
  wfName,
}: {
  saveAction: (
    nodes: Node[],
    edges: Edge[],
    status: boolean,
    workflowName: string,
    id?: string,
  ) => void;
  nodes?: Node[];
  edges?: Edge[];
  status?: boolean;
  workflowId?: string;
  wfName?: string;
}) {
  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
        <Flow
          saveAction={saveAction}
          nds={nodes}
          egs={edges}
          sts={status}
          workflowId={workflowId}
          wfName={wfName}
        />
      </div>
    </div>
  );
}
