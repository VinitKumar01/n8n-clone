"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { nodes } from "./nodes/Nodes";

export default function ToolBar({
  setNodesAction,
}: {
  setNodesAction: (nd: { type: string; data: object }) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      {open ? (
        <div className="fixed right-0 top-20 bottom-20 z-10 rounded-l-2xl bg-[#2A2A2A] flex justify-center w-70 ease-in-out duration-200 transition-all cursor-pointer">
          <div
            className="absolute top-[45%] -left-6 flex justify-center items-center bg-[#2A2A2A] rounded-l-md h-12"
            onClick={() => {
              setOpen((prev) => !prev);
            }}
          >
            <ArrowRight />
          </div>
          <div className="grid grid-cols-2 gap-4 m-8 h-fit">
            {nodes.map((node, idx) => {
              return (
                <div
                  key={idx}
                  className="flex-col justify-between items-center text-center rounded-md p-2 bg-[#393939] h-full cursor-pointer"
                  onClick={() => {
                    setNodesAction({
                      type: node.type,
                      data: {},
                    });
                  }}
                >
                  {node.component()}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="fixed z-10 right-0 top-[45%] w-6 h-12 flex justify-center items-center bg-[#2A2A2A] rounded-l-md duration-200 transition-all cursor-pointer ease-in-out"
          onClick={() => {
            setOpen((prev) => !prev);
          }}
        >
          <ArrowLeft />
        </div>
      )}
    </div>
  );
}
