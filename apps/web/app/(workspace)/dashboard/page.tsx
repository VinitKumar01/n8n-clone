"use client";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkflows } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { ChevronLeft, ChevronRight, Pencil, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState, useRef } from "react";
import type { Edge, Node } from "reactflow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(
    null,
  );
  const newNameRef = useRef<HTMLInputElement>(null);

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
                      className="group rounded-2xl border border-white/5 bg-[#1f1f1f] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:bg-[#222] hover:shadow-lg hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-white/10 cursor-pointer"
                    >
                      <div className="flex h-full flex-col justify-between gap-5">
                        <div className="space-y-3 w-full">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <h3 className="line-clamp-1 text-xl font-semibold tracking-tight text-[#E5E5E5] break-all">
                                {workflow.workflow_name}
                              </h3>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingWorkflow(workflow);
                                }}
                                role="button"
                                title="Rename workflow"
                                className="p-1 rounded-md text-white/35 hover:text-white/80 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer shrink-0"
                              >
                                <Pencil size={14} />
                              </span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingWorkflow(workflow);
                                }}
                                role="button"
                                title="Delete workflow"
                                className="p-1 rounded-md text-red-500/60 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer shrink-0"
                              >
                                <Trash size={14} />
                              </span>
                            </div>
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

      <Dialog
        open={!!editingWorkflow}
        onOpenChange={(open) => {
          if (!open) setEditingWorkflow(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Workflow</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <Input
              key={editingWorkflow?.id}
              ref={newNameRef}
              placeholder="New workflow name"
              defaultValue={editingWorkflow?.workflow_name}
            />
          </div>
          <DialogFooter className="pt-4">
            <div className="flex gap-2 justify-end w-full">
              <Button variant="ghost" onClick={() => setEditingWorkflow(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const newName = newNameRef.current?.value || "";
                  if (!editingWorkflow || !newName.trim() || !BACKEND_URL)
                    return;
                  try {
                    await axios.put(`${BACKEND_URL}/workflow`, {
                      workflow_name: newName.trim(),
                      user_id: editingWorkflow.user_id,
                      nodes: editingWorkflow.nodes,
                      edges: editingWorkflow.edges,
                      status: editingWorkflow.status,
                      workflow_id: editingWorkflow.id,
                    });

                    setWorkflows((prev) =>
                      prev.map((w) =>
                        w.id === editingWorkflow.id
                          ? { ...w, workflow_name: newName.trim() }
                          : w,
                      ),
                    );
                    setEditingWorkflow(null);
                  } catch (error) {
                    console.error("Failed to rename workflow:", error);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingWorkflow}
        onOpenChange={(open) => {
          if (!open) setDeletingWorkflow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workflow &quot;
              {deletingWorkflow?.workflow_name}&quot; and remove all its
              configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingWorkflow(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!deletingWorkflow || !BACKEND_URL) return;
                try {
                  await axios.delete(
                    `${BACKEND_URL}/workflow/${deletingWorkflow.id}?userId=${deletingWorkflow.user_id}`,
                  );
                  setWorkflows((prev) =>
                    prev.filter((w) => w.id !== deletingWorkflow.id),
                  );
                  setDeletingWorkflow(null);
                } catch (error) {
                  console.error("Failed to delete workflow:", error);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
