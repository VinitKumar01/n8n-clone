"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Terminal,
  Merge,
  Webhook,
  MousePointerClick,
  Clock,
  Mail,
  Info,
} from "lucide-react";
import Image from "next/image";
import { nodes } from "./nodes/Nodes";

export default function ToolBar() {
  const [open, setOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = nodes.filter((node) =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const renderNodeIcon = (type: string) => {
    switch (type) {
      case "geminiNode":
        return (
          <Image
            src="/gemini-color.svg"
            alt="Gemini"
            width={28}
            height={28}
            className="pointer-events-none select-none"
          />
        );
      case "showOutput":
        return (
          <Terminal className="h-6 w-6 text-indigo-500 dark:text-indigo-400 pointer-events-none" />
        );
      case "mergeNode":
        return (
          <Merge className="h-6 w-6 text-orange-500 dark:text-orange-400 pointer-events-none" />
        );
      case "webhookNode":
        return (
          <Webhook className="h-6 w-6 text-emerald-500 dark:text-emerald-400 pointer-events-none" />
        );
      case "triggerManually":
        return (
          <MousePointerClick className="h-6 w-6 text-blue-500 dark:text-blue-400 pointer-events-none" />
        );
      case "schedulerNode":
        return (
          <Clock className="h-6 w-6 text-purple-500 dark:text-purple-400 pointer-events-none" />
        );
      case "resendNode":
        return (
          <Mail className="h-6 w-6 text-pink-500 dark:text-pink-400 pointer-events-none" />
        );
      default:
        return (
          <Terminal className="h-6 w-6 text-neutral-500 pointer-events-none" />
        );
    }
  };

  return (
    <div>
      {open ? (
        <div className="fixed right-4 top-20 bottom-20 z-20 w-80 rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col ease-in-out duration-300 transition-all pointer-events-auto">
          {/* Toggle trigger attached to the left border */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-[45%] -left-3.5 w-7 h-12 flex items-center justify-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-l-lg shadow-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer z-30 focus:outline-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 tracking-wider uppercase">
                Nodes Library
              </h3>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Drag and drop nodes onto the canvas
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/40">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/50 rounded-lg text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all"
              />
            </div>
          </div>

          {/* Nodes Grid */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {filteredNodes.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredNodes.map((node, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type)}
                    className="group flex flex-col items-center justify-center text-center rounded-xl p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-white dark:hover:bg-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700/80 shadow-sm hover:shadow transition-all duration-200 cursor-grab active:cursor-grabbing select-none h-24"
                  >
                    <div className="flex-1 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform duration-200">
                      {renderNodeIcon(node.type)}
                    </div>
                    <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                      {node.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center text-neutral-400 dark:text-neutral-500">
                <span className="text-xs">No nodes found</span>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-800/20 text-center rounded-b-2xl">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1 select-none">
              <Info className="h-3 w-3" />
              Tip: Drag items directly onto canvas
            </span>
          </div>
        </div>
      ) : (
        <div className="fixed right-0 top-[45%] z-20 w-0 h-0 flex items-center justify-end duration-300 transition-all ease-in-out">
          <button
            className="flex items-center justify-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 border-r-0 rounded-l-lg w-7 h-12 shadow-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer focus:outline-none"
            onClick={() => setOpen(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
