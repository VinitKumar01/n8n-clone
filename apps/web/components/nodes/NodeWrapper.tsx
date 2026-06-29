"use client";

import React, { useState } from "react";
import { Handle } from "reactflow";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

export type NodePayload = unknown;

function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function prettyPrintPayload(p: NodePayload): string {
  if (p === null || p === undefined) return "<no output yet>";
  if (isString(p)) return p;
  try {
    return JSON.stringify(p, null, 2);
  } catch {
    return String(p);
  }
}

export const OUTPUT_WARNING_TOOLTIP =
  "This section only shows outputs when triggered manually from the UI. Background runs (e.g. webhooks or schedulers) will execute the actions but won't update these canvas boxes in real-time. Visible data is the last output from a manual trigger, not necessarily the last execution of the workflow.";

export const CustomHandle = (props: React.ComponentProps<typeof Handle>) => {
  return (
    <Handle
      {...props}
      className={cn(
        "!w-3 !h-3 !bg-white dark:!bg-neutral-900 !border-2 !border-neutral-300 dark:!border-neutral-700 hover:!border-neutral-500 dark:hover:!border-neutral-400 !transition-all duration-150 shadow-sm",
        props.className,
      )}
    />
  );
};

export function NodeWrapper({
  title,
  icon,
  iconBg = "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300",
  children,
  onHeaderClick,
  hasOutput = false,
  output,
  dialogTrigger,
  collapsedContent,
  leftHandle,
  rightHandle,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg?: string;
  children?: React.ReactNode;
  onHeaderClick?: () => void;
  hasOutput?: boolean;
  output?: unknown;
  dialogTrigger?: React.ReactNode;
  collapsedContent?: React.ReactNode;
  leftHandle?: React.ReactNode;
  rightHandle?: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 min-w-[200px] max-w-[260px] text-neutral-800 dark:text-neutral-100">
      {leftHandle}

      <div
        className="flex items-center justify-between p-3 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-800/10 rounded-t-xl cursor-pointer select-none group"
        onClick={onHeaderClick}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 duration-200",
              iconBg,
            )}
          >
            {icon}
          </div>
          <span className="text-xs font-bold tracking-tight text-neutral-700 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
            {title}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {hasOutput && (
            <span className="relative flex h-2 w-2 mr-0.5">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  output ? "bg-emerald-400" : "bg-amber-400",
                )}
              ></span>
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  output ? "bg-emerald-500" : "bg-amber-500",
                )}
              ></span>
            </span>
          )}
          {dialogTrigger}
        </div>
      </div>

      <div className="p-3">
        {isExpanded ? children : (collapsedContent ?? null)}

        {children && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/40 text-[9px] font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors flex items-center justify-center gap-1 cursor-pointer select-none"
          >
            {isExpanded ? (
              <>
                Hide Details
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show Details
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>

      {rightHandle}
    </div>
  );
}
