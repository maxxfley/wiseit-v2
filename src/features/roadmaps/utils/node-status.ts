import type { NodeIcon } from "@/config/roadmap-visuals";
import { DIFFICULTY_LEVELS, type DifficultyLevel } from "../schemas/roadmap-output.schema";

/** Funciones puras compartidas por servidor y cliente (la UI optimista usa las mismas reglas). */

export type NodeStatus = "locked" | "available" | "in_progress" | "completed";

export interface NodeProgress {
  completedConcepts: number[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface RoadmapNodeView extends NodeProgress {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  orderIndex: number;
  icon: NodeIcon;
  key_concepts: string[];
  practice: string;
  /** Ids de los prerrequisitos directos. */
  requires: string[];
}

/**
 * Estado derivado (nunca se guarda). "Bloqueado" tiene prioridad: coincide con la base, que
 * rechaza cambios en un nodo con algún prerrequisito abierto.
 */
export function deriveStatus(node: RoadmapNodeView, byId: ReadonlyMap<string, RoadmapNodeView>): NodeStatus {
  if (node.requires.some((id) => !byId.get(id)?.completedAt)) return "locked";
  if (node.completedAt) return "completed";
  if (node.startedAt || node.completedConcepts.length > 0) return "in_progress";
  return "available";
}

export function nodePercent(node: RoadmapNodeView): number {
  if (node.completedAt) return 100;
  const total = node.key_concepts.length;
  return total === 0 ? 0 : Math.round((node.completedConcepts.length / total) * 100);
}

/** Replica en el cliente la lógica de `update_node_progress` para la actualización optimista. */
export function applyProgress(
  node: RoadmapNodeView,
  completedConcepts: readonly number[],
  markComplete: boolean,
  now: string,
): RoadmapNodeView {
  const total = node.key_concepts.length;
  const concepts = markComplete
    ? Array.from({ length: total }, (_, index) => index)
    : [...new Set(completedConcepts)].filter((index) => index >= 0 && index < total).sort((a, b) => a - b);
  const done = markComplete || (total > 0 && concepts.length === total);
  return {
    ...node,
    completedConcepts: concepts,
    startedAt: node.startedAt ?? now,
    completedAt: done ? (node.completedAt ?? now) : null,
  };
}

/** Agrupa nodos por nivel conservando el orden; omite los niveles sin nodos. */
export function groupByDifficulty(
  nodes: readonly RoadmapNodeView[],
): { level: DifficultyLevel; nodes: RoadmapNodeView[] }[] {
  return DIFFICULTY_LEVELS.map((level) => ({
    level,
    nodes: nodes.filter((node) => node.difficulty === level),
  })).filter((group) => group.nodes.length > 0);
}
