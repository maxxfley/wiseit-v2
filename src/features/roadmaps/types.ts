import type { DifficultyLevel } from "./schemas/roadmap-output.schema";

export interface GeneratedNode {
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  order_index: number;
  key_concepts: string[];
  practice: string;
}

export interface GeneratedRoadmap {
  id: string;
  title: string;
  nodes: GeneratedNode[];
}

/** Estado devuelto por la Server Action de generación a `useActionState`. */
export interface GenerateFormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: { topic?: string[] };
  roadmap?: GeneratedRoadmap;
}

export const INITIAL_GENERATE_STATE: GenerateFormState = { status: "idle" };
