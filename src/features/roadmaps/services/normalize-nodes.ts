import { AI_LIMITS } from "@/config/ai";
import { DIFFICULTY_LEVELS, type RoadmapNode } from "../schemas/roadmap-output.schema";

export interface OrderedNode {
  title: string;
  description: string;
  difficulty: RoadmapNode["difficulty"];
  icon: RoadmapNode["icon"];
  key_concepts: string[];
  practice: string;
  order_index: number;
  /** `order_index` de los prerrequisitos directos. Siempre menores que el propio: grafo acíclico. */
  requires: number[];
}

const rank = (node: RoadmapNode): number => DIFFICULTY_LEVELS.indexOf(node.difficulty);

/** Índices de prerrequisitos válidos: existen, quedan ANTES en el orden y sin duplicados. */
function resolveRequires(node: RoadmapNode, ownIndex: number, indexById: ReadonlyMap<string, number>): number[] {
  const resolved = node.requires
    .map((ref) => indexById.get(ref))
    .filter((index): index is number => index !== undefined && index < ownIndex);
  return [...new Set(resolved)].sort((a, b) => a - b).slice(0, AI_LIMITS.maxPrerequisites);
}

/**
 * Convierte la salida de la IA en un grafo seguro de guardar. Nunca se confía en sus índices ni
 * en sus referencias:
 * 1. Ordena Básico → Intermedio → Avanzado, conservando el orden relativo de la IA en cada nivel,
 *    y asigna `order_index` 0..n-1 en el servidor.
 * 2. Solo acepta prerrequisitos que quedan antes en ese orden. Así el grafo es acíclico por
 *    construcción y un nodo nunca depende de otro más difícil. Se descartan referencias
 *    inexistentes, auto-referencias y duplicados.
 * 3. Un nodo Intermedio o Avanzado sin requisitos se engancha al anterior, para que no aparezca
 *    disponible desde el principio. Los nodos Básicos sin requisitos son puntos de entrada.
 */
export function normalizeNodes(nodes: readonly RoadmapNode[]): OrderedNode[] {
  const sorted = nodes
    .map((node, position) => ({ node, position }))
    .sort((a, b) => rank(a.node) - rank(b.node) || a.position - b.position)
    .map(({ node }) => node);

  const indexById = new Map<string, number>();
  sorted.forEach((node, index) => {
    if (!indexById.has(node.id)) indexById.set(node.id, index); // ids repetidos: gana el primero
  });

  return sorted.map((node, index) => {
    const requires = resolveRequires(node, index, indexById);
    if (requires.length === 0 && node.difficulty !== "Básico" && index > 0) requires.push(index - 1);
    return {
      title: node.title,
      description: node.description,
      difficulty: node.difficulty,
      icon: node.icon,
      key_concepts: node.key_concepts,
      practice: node.practice,
      order_index: index,
      requires,
    };
  });
}
