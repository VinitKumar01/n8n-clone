import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Workflow = {
  id: string;
  workflow_name: string;
  nodes: string;
  edges: string;
  status: "active" | "not-active";
  user_id: string;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function getWorkflows(userId: string): Promise<Workflow[]> {
  const response = await axios.get(BACKEND_URL + `/workflows/${userId}`);
  return response.data;
}

export async function getWorkflow(workflowId: string): Promise<Workflow> {
  const response = await axios.get(BACKEND_URL + `/workflow/${workflowId}`);
  return response.data;
}
