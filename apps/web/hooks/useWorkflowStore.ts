import { create } from "zustand";
import {
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  XYPosition,
} from "reactflow";
import axios from "axios";

export type GeminiInputs = {
  apiKey?: string;
  model?: string;
  prompt?: string;
};

export type ResendInputs = {
  apiKey?: string;
  from?: string;
  to?: string;
  subject?: string;
};

export type AppNodeData = {
  inputs?: {
    apiKey?: string;
    model?: string;
    prompt?: string;
    interval?: string;
    from?: string;
    to?: string;
    subject?: string;
  };
  received?: unknown;
};

export type AppNode = Node<AppNodeData>;

interface WorkflowState {
  // Store States
  nodes: AppNode[];
  edges: Edge[];
  workflowId: string | null;
  workflowName: string;
  status: boolean;
  isSaved: boolean;
  lastSavedState: { nodes: AppNode[]; edges: Edge[] } | null;
  isLoading: boolean;

  // Setters
  setWorkflowId: (id: string | null) => void;
  setWorkflowNameState: (name: string) => void;
  setStatusState: (status: boolean) => void;

  // ReactFlow Canvas actions
  initWorkflow: (id: string) => Promise<void>;
  initNewWorkflow: () => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position?: XYPosition) => void;
  updateNodeData: (nodeId: string, dataUpdate: Partial<AppNodeData>) => void;
  updateNodeReceived: (nodeId: string, payload: unknown) => void;

  // API Actions
  saveWorkflow: (userId: string) => Promise<string | undefined>;
  toggleWorkflowStatus: (userId: string) => Promise<void>;
  executeWorkflow: (userId: string, startNodeId: string) => Promise<void>;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is missing");
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  workflowId: null,
  workflowName: "default",
  status: false,
  isSaved: true,
  lastSavedState: null,
  isLoading: false,

  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowNameState: (name) => set({ workflowName: name, isSaved: false }),
  setStatusState: (status) => set({ status, isSaved: false }),

  initNewWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      workflowId: null,
      workflowName: "default",
      status: false,
      lastSavedState: null,
      isSaved: true,
      isLoading: false,
    });
  },

  initWorkflow: async (id) => {
    set({ isLoading: true, workflowId: id });
    try {
      const response = await axios.get(`${BACKEND_URL}/workflow/${id}`);
      const workflow = response.data;
      if (workflow) {
        const nodes = workflow.nodes ?? [];
        const edges = workflow.edges ?? [];
        const status = workflow.status === "active";
        const workflowName = workflow.workflow_name ?? "default";

        set({
          nodes,
          edges,
          status,
          workflowName,
          lastSavedState: { nodes, edges },
          isSaved: true,
        });
      }
    } catch (error) {
      console.error("Failed to load workflow:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  onNodesChange: (changes) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes) as AppNode[];

      // Compute dirtiness by comparing to lastSavedState
      let isSaved = state.isSaved;
      if (state.lastSavedState) {
        const nodesChanged =
          JSON.stringify(updatedNodes) !==
          JSON.stringify(state.lastSavedState.nodes);
        isSaved = !nodesChanged;
      } else {
        isSaved = false;
      }

      return {
        nodes: updatedNodes,
        isSaved,
      };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      const updatedEdges = applyEdgeChanges(changes, state.edges);

      let isSaved = state.isSaved;
      if (state.lastSavedState) {
        const edgesChanged =
          JSON.stringify(updatedEdges) !==
          JSON.stringify(state.lastSavedState.edges);
        isSaved = !edgesChanged;
      } else {
        isSaved = false;
      }

      return {
        edges: updatedEdges,
        isSaved,
      };
    });
  },

  onConnect: (connection) => {
    set((state) => {
      const updatedEdges = addEdge(connection, state.edges);
      return {
        edges: updatedEdges,
        isSaved: false,
      };
    });
  },

  addNode: (type, position) => {
    set((state) => {
      const last = state.nodes[state.nodes.length - 1];
      const newId = last ? `${Number(last.id) + 1}` : "1";
      const newNode: AppNode = {
        id: newId,
        type: type ?? "default",
        position: position ?? {
          x: last ? last.position.x + 10 : 100,
          y: last ? last.position.y + 10 : 100,
        },
        data: {},
      };
      return {
        nodes: [...state.nodes, newNode],
        isSaved: false,
      };
    });
  },

  updateNodeData: (nodeId, dataUpdate) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id === nodeId) {
          const inputs = {
            ...(node.data?.inputs ?? {}),
            ...(dataUpdate.inputs ?? {}),
          };
          return {
            ...node,
            data: {
              ...node.data,
              ...dataUpdate,
              inputs,
            },
          };
        }
        return node;
      });

      return {
        nodes: updatedNodes,
        isSaved: false,
      };
    });
  },

  updateNodeReceived: (nodeId, payload) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                received: payload,
              },
            }
          : node,
      ),
      isSaved: false,
    }));
  },

  saveWorkflow: async (userId) => {
    const { nodes, edges, status, workflowName, workflowId } = get();

    try {
      if (!workflowId) {
        // Create new workflow
        const response = await axios.post(`${BACKEND_URL}/workflow`, {
          workflow_name: workflowName,
          user_id: userId,
          nodes: nodes,
          edges: edges,
          status: status ? "active" : "not-active",
        });

        const newId = response.data.id;
        if (newId) {
          set({
            workflowId: newId,
            lastSavedState: { nodes, edges },
            isSaved: true,
          });
          return newId;
        }
      } else {
        // Update existing workflow
        await axios.put(`${BACKEND_URL}/workflow`, {
          workflow_name: workflowName,
          user_id: userId,
          nodes: nodes,
          edges: edges,
          status: status ? "active" : "not-active",
          workflow_id: workflowId,
        });

        set({
          lastSavedState: { nodes, edges },
          isSaved: true,
        });
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
    }
    return undefined;
  },

  toggleWorkflowStatus: async (userId) => {
    const { workflowId, status } = get();
    if (!workflowId) return;

    const newStatus = status ? "not-active" : "active";
    try {
      const response = await fetch(`${BACKEND_URL}/workflow/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          user_id: userId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Failed to update status on backend:", text);
        return;
      }

      set({ status: !status });
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  },

  executeWorkflow: async (userId, startNodeId) => {
    const { workflowId, status } = get();
    if (!workflowId || !status) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/workflow/${workflowId}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startNode: startNodeId,
            userId,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Execution failed:", response.status, text);
        return;
      }

      const body = await response.json();
      const results = body.results ?? {};

      // Update output payload on each node returned in results
      Object.entries(results).forEach(([id, payload]) => {
        get().updateNodeReceived(id, payload);
      });
    } catch (error) {
      console.error("Error executing workflow:", error);
    }
  },
}));
