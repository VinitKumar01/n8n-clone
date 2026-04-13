"use client";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkflows } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { Circle, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import type { Edge, Node } from "reactflow";

type Workflow = {
  id: string;
  workflow_name: string;
  nodes: Node[];
  edges: Edge[];
  status: "active" | "not-active";
  user_id: string;
};

const PAGE_SIZE = 6;

function WorkflowCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/3 p-5 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/5 rounded-md bg-white/10" />
        <Skeleton className="h-4 w-2/5 rounded-md bg-white/10" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <Skeleton className="h-4 w-20 rounded-md bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setLoading(true);
        const data = await getWorkflows(user?.id as string);
        setWorkflows(data);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchWorkflows();
    else setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    setPage(1);
  }, [workflows.length]);

  const totalPages = Math.max(1, Math.ceil(workflows.length / PAGE_SIZE));

  const paginatedWorkflows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return workflows.slice(start, start + PAGE_SIZE);
  }, [page, workflows]);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="min-h-screen w-full bg-[#1d1d1d] px-4 py-6 text-[#E5E5E5] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-2xl border border-white/5 bg-[#262626] shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <div className="text-3xl font-semibold tracking-tight">
              My Workflows
            </div>
            <div className="mt-1 text-sm text-white/55">
              Manage your workflows from one place.
            </div>
          </div>

          <div className="text-sm text-white/45">
            {loading
              ? "Loading workflows..."
              : `${workflows.length} workflow${workflows.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <Separator className="bg-white/8" />

        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <WorkflowCardSkeleton key={index} />
              ))}
            </div>
          ) : workflows.length !== 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedWorkflows.map((workflow) => {
                  const isActive = workflow.status === "active";

                  return (
                    <button
                      key={workflow.id}
                      type="button"
                      onClick={() => {
                        router.push(`/workflow/${workflow.id}`);
                      }}
                      className="group rounded-2xl border border-white/5 bg-[#1f1f1f] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:bg-[#222] hover:shadow-lg hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-white/10"
                    >
                      <div className="flex h-full flex-col justify-between gap-5">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="line-clamp-1 text-xl font-semibold tracking-tight text-[#E5E5E5]">
                              {workflow.workflow_name}
                            </h3>
                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
                                isActive
                                  ? "border-green-500/20 bg-green-500/10 text-green-400"
                                  : "border-orange-400/20 bg-orange-400/10 text-orange-300"
                              }`}
                            >
                              {workflow.status}
                            </span>
                          </div>

                          <div className="text-sm text-white/45">
                            id: {workflow.id}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <Circle
                              className={
                                isActive
                                  ? "fill-green-500 stroke-green-500"
                                  : "fill-orange-400 stroke-orange-400"
                              }
                              size={10}
                            />
                            <div className="text-sm capitalize text-white/70">
                              {isActive ? "Active workflow" : "Not active"}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-white/35 transition group-hover:text-white/50">
                          Open workflow →
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-white/45">
                  Page {page} of {totalPages}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!canGoPrev}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#E5E5E5] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Prev
                  </button>

                  <div className="min-w-10 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white/70">
                    {page}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!canGoNext}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#E5E5E5] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-72 items-center justify-center">
              <div className="w-full max-w-lg rounded-2xl border border-white/5 bg-white/3 px-6 py-10 text-center shadow-sm">
                <div className="text-3xl font-semibold text-[#E5E5E5]">
                  OOPS!! No workflows found
                </div>
                <div className="mt-2 text-sm text-white/45">
                  Create a workflow to see it listed here.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
