"use client";

import { Separator } from "@/components/ui/separator";
import { getWorkflows } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type Workflow = {
  id: string;
  workflow_name: string;
  nodes: string;
  edges: string;
  status: "active" | "not-active";
  user_id: string;
};

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    const fetchWorkflows = async () => {
      const workflows = await getWorkflows(user?.id as string);
      setWorkflows(workflows);
    };

    if (user?.id) fetchWorkflows();
  }, [user?.id]);

  return (
    <div className="w-full h-full bg-black">
      <div className="bg-[#262626] max-w-full h-fit m-8 rounded-md">
        <div className="text-3xl font-bold text-[#E5E5E5] p-4">
          My Workflows
        </div>
        <Separator />

        {workflows.length !== 0 ? (
          <div className="mx-6 grid grid-cols-3">
            {workflows.map((workflow, id) => {
              return (
                <div
                  key={id}
                  className="mx-2 my-4 space-y-2 cursor-pointer"
                  onClick={() => {
                    router.push(`/workflow/${workflow.id}`);
                  }}
                >
                  <div className="text-xl font-semibold">
                    {workflow.workflow_name}
                  </div>
                  <div className="text-muted-foreground">id: {workflow.id}</div>
                  <div className="flex items-center rounded-md gap-2">
                    {workflow.status === "active" ? (
                      <Circle
                        className="bg-transparent fill-green-500 stroke-green-500"
                        size={10}
                      />
                    ) : (
                      <Circle
                        className="bg-transparent fill-orange-400 stroke-orange-400"
                        size={10}
                      />
                    )}
                    <div>{workflow.status}</div>
                  </div>
                  <Separator />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="min-h-72 flex justify-center items-center text-5xl text-[#E5E5E5] font-semibold">
            OOPS!! No workflows found
          </div>
        )}
      </div>
    </div>
  );
}
