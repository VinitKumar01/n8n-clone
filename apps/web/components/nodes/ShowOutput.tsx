"use client";

import React from "react";
import { Position } from "reactflow";
import { Terminal, AlertCircle } from "lucide-react";
import { AppNodeData } from "@/types/workflow";
import {
  NodeWrapper,
  CustomHandle,
  prettyPrintPayload,
  OUTPUT_WARNING_TOOLTIP,
} from "./NodeWrapper";

export function ShowOutput({ data }: { data: AppNodeData }) {
  const payload = data.received;

  const collapsedContent = (
    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex flex-col gap-0.5 text-left">
      <div className="flex justify-between">
        <span>Status:</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {payload ? "Data Loaded" : "Idle"}
        </span>
      </div>
    </div>
  );

  return (
    <NodeWrapper
      title="Output Preview"
      icon={<Terminal className="h-4.5 w-4.5" />}
      iconBg="bg-indigo-500/10 text-indigo-500"
      hasOutput
      output={payload}
      collapsedContent={collapsedContent}
      leftHandle={<CustomHandle type="target" position={Position.Left} />}
    >
      <div className="flex flex-col gap-1 text-left">
        <div className="flex items-center gap-1.5 select-none">
          <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
            Received Payload
          </span>
          <span
            title={OUTPUT_WARNING_TOOLTIP}
            className="cursor-help text-amber-500 hover:text-amber-600 transition-colors flex items-center justify-center"
          >
            <AlertCircle className="h-3 w-3" />
          </span>
        </div>
        <pre className="text-[10px] font-mono p-1.5 rounded border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 max-h-36 overflow-y-auto text-neutral-600 dark:text-neutral-300 text-wrap break-words">
          {payload ? (
            prettyPrintPayload(payload)
          ) : (
            <span className="italic text-neutral-400">
              Waiting for workflow data...
            </span>
          )}
        </pre>
      </div>
    </NodeWrapper>
  );
}
