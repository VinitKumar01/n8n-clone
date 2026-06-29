"use client";

import { Separator } from "@/components/ui/separator";
import { getWorkflows } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash,
  Plus,
  FolderOpen,
} from "lucide-react";
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
import { useToastStore } from "@/hooks/useToastStore";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type Workflow = {
  id: string;
  workflow_name: string;
  nodes: Node[];
  edges: Edge[];
  status: "active" | "not-active";
  user_id: string;
  created_at: string;
  updated_at: string;
};

const PAGE_SIZE = 6;

function WorkflowCardSkeleton() {
  return (
    <div className="flex h-[200px] flex-col justify-between rounded-xl border border-white/5 bg-[#262626] p-5 shadow-lg">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-700/60" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-700/60" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-1/4 animate-pulse rounded bg-neutral-700/60" />
        <div className="h-8 w-1/3 animate-pulse rounded bg-neutral-700/60" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isLoaded, user } = useUser();
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
        // Sort workflows by updated_at (descending) to ensure stable and consistent ordering
        const sorted = data.sort((a, b) => {
          const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return timeB - timeA;
        });
        setWorkflows(sorted);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoaded) {
      setLoading(true);
      return;
    }

    if (user?.id) {
      fetchWorkflows();
    } else {
      setWorkflows([]);
      setLoading(false);
    }
  }, [isLoaded, user?.id]);

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
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-[#171717] px-4 py-6 text-neutral-900 dark:text-[#E5E5E5] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-md dark:shadow-2xl dark:shadow-black/20">
        <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <div className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              My Workflows
            </div>
            <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Manage your workflows from one place.
            </div>
          </div>

          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {loading
              ? "Loading workflows..."
              : `${workflows.length} workflow${workflows.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <Separator className="bg-neutral-200 dark:bg-neutral-800" />

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
                      className="group rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1f1f1f] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-[#222]/80 hover:shadow-md dark:hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-800 cursor-pointer"
                    >
                      <div className="flex h-full flex-col justify-between gap-5">
                        <div className="space-y-3 w-full">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <h3 className="line-clamp-1 text-xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-200 break-all">
                                {workflow.workflow_name}
                              </h3>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingWorkflow(workflow);
                                }}
                                role="button"
                                title="Rename workflow"
                                className="p-1 rounded-md text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer shrink-0"
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
                                  ? "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
                                  : "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                              }`}
                            >
                              {workflow.status}
                            </span>
                          </div>

                          <div className="text-sm text-neutral-400 dark:text-neutral-500">
                            id: {workflow.id}
                          </div>
                        </div>

                        <div className="text-sm text-neutral-500 dark:text-neutral-400 transition group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                          Open workflow →
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-neutral-200 dark:border-neutral-800/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Page {page} of {totalPages}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!canGoPrev}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 transition hover:bg-neutral-200 dark:hover:bg-neutral-700/80 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    Prev
                  </button>

                  <div className="min-w-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-center text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {page}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!canGoNext}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 transition hover:bg-neutral-200 dark:hover:bg-neutral-700/80 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center py-6">
              <div className="w-full max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/30 p-8 text-center shadow-xs flex flex-col items-center justify-center gap-5">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-neutral-800 dark:text-[#E5E5E5]">
                    No Workflows Found
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                    You haven&apos;t designed any workflows yet. Get started by
                    designing your first automation process on the canvas.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/workspace")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create New Workflow
                </Button>
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
                  const toastId = useToastStore
                    .getState()
                    .addToast("Renaming workflow...", "loading", 0);
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
                    useToastStore.getState().updateToast(toastId, {
                      message: "Workflow renamed successfully!",
                      type: "success",
                      duration: 3000,
                    });
                  } catch (error) {
                    console.error("Failed to rename workflow:", error);
                    useToastStore.getState().updateToast(toastId, {
                      message: `Failed to rename workflow: ${error instanceof Error ? error.message : String(error)}`,
                      type: "error",
                      duration: 4000,
                    });
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
                const toastId = useToastStore
                  .getState()
                  .addToast("Deleting workflow...", "loading", 0);
                try {
                  await axios.delete(
                    `${BACKEND_URL}/workflow/${deletingWorkflow.id}?userId=${deletingWorkflow.user_id}`,
                  );
                  setWorkflows((prev) =>
                    prev.filter((w) => w.id !== deletingWorkflow.id),
                  );
                  setDeletingWorkflow(null);
                  useToastStore.getState().updateToast(toastId, {
                    message: "Workflow deleted successfully!",
                    type: "success",
                    duration: 3000,
                  });
                } catch (error) {
                  console.error("Failed to delete workflow:", error);
                  useToastStore.getState().updateToast(toastId, {
                    message: `Failed to delete workflow: ${error instanceof Error ? error.message : String(error)}`,
                    type: "error",
                    duration: 4000,
                  });
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
