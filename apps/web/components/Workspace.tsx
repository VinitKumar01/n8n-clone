"use client";

import dynamic from "next/dynamic";
import { Edge, Node } from "reactflow";

const Flow = dynamic(() => import("../components/Flow"), { ssr: true });

export default function Worksapce({
  saveAction,
  nodes,
  edges,
}: {
  saveAction: (nodes: Node[], edges: Edge[], status: boolean) => void;
  nodes?: Node[];
  edges?: Edge[];
}) {
  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900">
        <Flow saveAction={saveAction} nds={nodes} egs={edges} />
      </div>
    </div>
  );
}
