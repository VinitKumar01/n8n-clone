"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import { IconPointer } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Link from "next/link";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
    onSend: (id: string, payload: { proceed: boolean }) => void;
  };
}) {
  const handleClick = useCallback(() => {
    data.onSend(id, { proceed: true });
  }, [data, id]);

  return (
    <div
      className="border p-4 bg-[#262626] rounded-2xl cursor-pointer"
      onClick={handleClick}
    >
      <IconPointer size={35} />
      <pre className="font-semibold">Click</pre>
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
    received: {
      proceed: boolean;
    };
  };
}) {
  const promptRef = useRef<HTMLInputElement>(null);
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState(promptRef.current?.value);
  const [apiKey, setApiKey] = useState(promptRef.current?.value);
  const [model, setModel] = useState("gemini-2.5-flash");

  const askGemini = useCallback(async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const response = await fetch("http://localhost:8080/v1/nodes/gemini", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify({
        prompt: prompt,
        apiKey: apiKey,
        model: model,
      }),
      redirect: "follow",
    });
    const result = (await response.json()).result;
    onSendRef.current?.(id, result);
  }, [apiKey, prompt, model, id]);

  const onSendRef = useRef(data.onSend);
  useEffect(() => {
    onSendRef.current = data.onSend;
  }, [data.onSend]);

  useEffect(() => {
    if (data.received?.proceed === true) {
      askGemini();
      data.received.proceed = false;
    }
  }, [data.received, askGemini]);

  return (
    <div className="bg-[#262626] p-4 rounded-2xl">
      <Dialog>
        <DialogTrigger>
          <Image
            src={"gemini-color.svg"}
            alt="Gemini"
            width={50}
            height={50}
            className="cursor-pointer"
          />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gemini Node options</DialogTitle>
            <DialogTrigger className="flex justify-start">
              <pre>To get Gemini api-key visit: </pre>
              <Link
                href={"https://aistudio.google.com/app/apikey"}
                className="text-blue-500"
              >
                Google AI Studio
              </Link>
            </DialogTrigger>
            <DialogDescription>
              These options will be used when this node is trigerred
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col justify-center items-center gap-4 p-4 rounded-2xl">
            <input
              ref={promptRef}
              placeholder="Prompt"
              className="border border-dashed border-white rounded-md p-2"
              defaultValue={prompt}
            />
            <input
              ref={apiKeyRef}
              placeholder="ApiKey"
              className="border border-dashed border-white rounded-md p-2"
              defaultValue={apiKey}
            />
            <Select
              onValueChange={(value: string) => setModel(value)}
              defaultValue="gemini-2.5-flash"
            >
              <SelectTrigger className="w-[270px]">
                <SelectValue placeholder="Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Models</SelectLabel>
                  <SelectItem value="gemini-2.5-flash">
                    gemini-2.5-flash
                  </SelectItem>
                  <SelectItem value="gemini-2.5-pro">gemini-2.5-pro</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setApiKey(apiKeyRef.current?.value as string);
                setPrompt(promptRef.current?.value as string);
              }}
            >
              Save values
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function ShowOutput({ data }: { data: { received: JSON } }) {
  return (
    <div className="p-2 border rounded-2xl bg-[#262626]">
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
