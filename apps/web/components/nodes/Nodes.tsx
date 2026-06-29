"use client";

import React from "react";
import Image from "next/image";
import { Merge, Webhook, MousePointerClick, Mail } from "lucide-react";
import { TriggerManually } from "./TriggerManually";
import { GeminiNode } from "./GeminiNode";
import { ShowOutput } from "./ShowOutput";
import { WebhookNode } from "./WebhookNode";
import { MergeNode } from "./MergeNode";
import { SchedulerNode } from "./SchedulerNode";
import { ResendNode } from "./ResendNode";

export const nodeTypes = {
  triggerManually: TriggerManually,
  geminiNode: GeminiNode,
  showOutput: ShowOutput,
  webhookNode: WebhookNode,
  mergeNode: MergeNode,
  schedulerNode: SchedulerNode,
  resendNode: ResendNode,
};

export const nodes = [
  {
    name: "Gemini",
    type: "geminiNode",
    component: () => {
      return (
        <div className="h-full bg-[#262626] p-4 rounded-2xl flex justify-center items-center">
          <Image
            src="/gemini-color.svg"
            alt="Gemini"
            width={50}
            height={50}
            className="cursor-pointer"
          />
        </div>
      );
    },
  },
  {
    name: "Output",
    type: "showOutput",
    component: () => {
      return (
        <div className="p-4 h-full flex justify-center items-center border border-neutral-800 rounded-2xl bg-[#262626]">
          <div className="font-semibold text-[#E5E5E5]">Output</div>
        </div>
      );
    },
  },
  {
    name: "Merge",
    type: "mergeNode",
    component: () => {
      return (
        <div className="p-4 h-full flex justify-center items-center border border-neutral-800 rounded-2xl bg-[#262626] text-[#E5E5E5]">
          <div className="flex flex-col justify-center items-center gap-2">
            <Merge />
            <div>Merge</div>
          </div>
        </div>
      );
    },
  },
  {
    name: "Webhook",
    type: "webhookNode",
    component: () => {
      return (
        <div className="h-full w-full bg-[#262626] p-4 rounded-2xl flex justify-center items-center text-[#E5E5E5]">
          <Webhook />
        </div>
      );
    },
  },
  {
    name: "Manual",
    type: "triggerManually",
    component: () => {
      return (
        <div className="h-full border border-neutral-800 p-4 bg-[#262626] rounded-2xl cursor-pointer text-[#E5E5E5]">
          <MousePointerClick size={35} />
          <pre className="font-semibold mt-1">Click</pre>
        </div>
      );
    },
  },
  {
    name: "Scheduler",
    type: "schedulerNode",
    component: () => {
      return (
        <div className="h-full bg-[#262626] p-4 rounded-2xl flex flex-col justify-center items-center gap-1 text-[#E5E5E5]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div className="text-xs font-semibold">Scheduler</div>
        </div>
      );
    },
  },
  {
    name: "Email",
    type: "resendNode",
    component: () => {
      return (
        <div className="h-full bg-[#262626] p-4 rounded-2xl flex flex-col justify-center items-center gap-1 text-[#E5E5E5]">
          <Mail size={28} />
          <div className="text-xs font-semibold">Email</div>
        </div>
      );
    },
  },
];
