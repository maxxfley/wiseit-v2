import { DIFFICULTY_LEVELS, type RoadmapNode } from "../schemas/roadmap-output.schema";

export interface OrderedNode extends RoadmapNode {
  order_index: number;
}

/**
 * Ordena Básico → Intermedio → Avanzado (conservando el orden relativo que dio la IA dentro de
 * cada nivel) y asigna `order_index` 0..n-1 en el servidor. Nunca se confía en índices de la IA.
 */
export function normalizeNodes(nodes: readonly RoadmapNode[]): OrderedNode[] {
  return nodes
    .map((node, position) => ({ node, position }))
    .sort((a, b) => DIFFICULTY_LEVELS.indexOf(a.node.difficulty) - DIFFICULTY_LEVELS.indexOf(b.node.difficulty) || a.position - b.position)
    .map(({ node }, index) => ({ ...node, order_index: index }));
}
