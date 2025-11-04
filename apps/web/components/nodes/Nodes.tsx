"use client";

import { useCallback, useRef } from "react";
import { Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "../ui/button";

// type NodeData = {
//   a: number;
//   b: number;
//   onChange?: (id: string, a: number, b: number) => void;
// };
//
// function TextUpdaterNode({ id, data }: NodeProps<NodeData>) {
//   const onChange = useCallback(
//     (evt: ChangeEvent<HTMLInputElement>) => {
//       const value = evt.target.value.trim();
//       const [aStr, bStr] = value.split(",").map((v) => v.trim());
//       const a = parseFloat(aStr);
//       const b = parseFloat(bStr);
//
//       if (!isNaN(a) && !isNaN(b)) {
//         data.onChange?.(id, a, b);
//       }
//     },
//     [data, id],
//   );
//
//   return (
//     <div className="p-2 rounded-lg border bg-white shadow-md text-sm w-40">
//       <label htmlFor={`text-${id}`} className="block text-gray-700 mb-1">
//         A: {data.a}, B: {data.b}
//       </label>
//       <input
//         id={`text-${id}`}
//         name="text"
//         onChange={onChange}
//         placeholder="e.g. 5, 10"
//         className="nodrag border rounded px-2 py-1 w-full"
//       />
//       <Handle type="target" position={Position.Top} />
//       <Handle type="source" position={Position.Bottom} />
//     </div>
//   );
// }

function TriggerManually({
  id,
  data,
}: {
  id: string;
  data: {
    onSend: (id: string, payload: { trigger: boolean }) => void;
  };
}) {
  const handleClick = useCallback(() => {
    data.onSend(id, { trigger: true });
  }, [data, id]);

  return (
    <div>
      <Button onClick={handleClick}>Trigger Workflow</Button>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function GeminiNode({
  id,
  data,
}: {
  id: string;
  data: {
    onSend: (id: string, payload: string) => void;
  };
}) {
  const promptRef = useRef<HTMLInputElement>(null);
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const response = await fetch("http://localhost:8080/v1/nodes/gemini", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({
        prompt: promptRef.current ? promptRef.current.value : "",
        apiKey: apiKeyRef.current ? apiKeyRef.current.value : "",
        model: modelRef.current ? modelRef.current.value : "",
      }),
      redirect: "follow",
    });
    const result = (await response.json()).result;
    console.log(result);
    data.onSend(id, result);
  }, [data, id]);

  return (
    <div className="flex flex-col justify-center items-center gap-4 bg-[#262626] p-4 rounded-2xl">
      <input
        ref={promptRef}
        placeholder="Prompt"
        className="border border-dashed border-white rounded-md p-2"
      />
      <input
        ref={apiKeyRef}
        placeholder="ApiKey"
        className="border border-dashed border-white rounded-md p-2"
      />
      <input
        ref={modelRef}
        placeholder="Model"
        className="border border-dashed border-white rounded-md p-2"
      />
      <Button onClick={handleClick}>Ask Gemini</Button>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function ShowOutput({ data }: { data: { received: JSON } }) {
  return (
    <div className="p-2 border rounded bg-[#262626]">
      <div>Show Output</div>
      <pre className="text-xs p-1 rounded max-w-48 text-wrap break-words">
        {JSON.stringify(data.received, null, 2) || ""}
      </pre>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

export const nodeTypes = {
  // textUpdater: TextUpdaterNode,
  triggerManually: TriggerManually,
  geminiNode: GeminiNode,
  showOutput: ShowOutput,
};
