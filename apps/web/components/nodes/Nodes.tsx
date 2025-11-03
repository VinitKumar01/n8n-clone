"use client";

import { useCallback } from "react";
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
      <Button onClick={handleClick} className="">
        Trigger Workflow
      </Button>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function ShowOutput({ data }: { data: { received: JSON } }) {
  return (
    <div className="p-2 border rounded bg-[#262626]">
      <div>Show Output</div>
      <pre className="text-xs p-1 rounded">
        {JSON.stringify(data.received, null, 2)}
      </pre>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

export const nodeTypes = {
  // textUpdater: TextUpdaterNode,
  triggerManually: TriggerManually,
  showOutput: ShowOutput,
};
