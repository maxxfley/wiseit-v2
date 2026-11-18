import { AI_LIMITS } from "@/config/ai";
import { EXTENSION_LIMITS } from "@/config/extensions";
import type { ExtensionNode } from "../schemas/extension.schema";

/**
 * Forma que recibe `append_roadmap_nodes` (el orden y el nivel los pone la base). Es `type` y no
 * `interface` para que TypeScript lo acepte como `Json` en la llamada RPC.
 */
export type AppendNode = {
  title: string;
  description: string;
  metadata: { icon: string; key_concepts: string[]; practice: string };
  /** Índices de pasos nuevos ANTERIORES de este mismo arreglo. */
  requires_new: number[];
  /** Ids (uuid) de pasos que la ruta ya tenía. */
  requires_existing: string[];
};

/**
 * Convierte la extensión de la IA en un grafo seguro de agregar. Nunca se confía en sus
 * referencias: un "x…" solo vale si apunta a un paso nuevo anterior (acíclico por construcción)
 * y un "e…" solo si existe. Un paso sin requisitos válidos se engancha: el primero a los finales
 * actuales de la ruta (`ends`) y los demás al paso nuevo anterior, así la extensión queda debajo.
 */
export function linkExtension(
  nodes: readonly ExtensionNode[],
  existingByRef: ReadonlyMap<string, string>,
  ends: readonly string[],
): AppendNode[] {
  const newIndexById = new Map<string, number>();
  nodes.forEach((node, index) => {
    if (!newIndexById.has(node.id)) newIndexById.set(node.id, index);
  });

  return nodes.map((node, index) => {
    const requiresNew = new Set<number>();
    const requiresExisting = new Set<string>();
    for (const ref of node.requires) {
      const newIndex = newIndexById.get(ref);
      const existingId = existingByRef.get(ref);
      if (newIndex !== undefined && newIndex < index) requiresNew.add(newIndex);
      else if (existingId) requiresExisting.add(existingId);
    }

    let requires_new = [...requiresNew].sort((a, b) => a - b);
    let requires_existing = [...requiresExisting];
    const extra = AI_LIMITS.maxPrerequisites - requires_new.length;
    requires_existing = requires_existing.slice(0, Math.max(0, extra));
    if (requires_new.length + requires_existing.length === 0) {
      if (index === 0) requires_existing = ends.slice(0, EXTENSION_LIMITS.attachToEnds);
      else requires_new = [index - 1];
    }

    return {
      title: node.title,
      description: node.description,
      metadata: { icon: node.icon, key_concepts: node.key_concepts, practice: node.practice },
      requires_new: requires_new.slice(0, AI_LIMITS.maxPrerequisites),
      requires_existing,
    };
  });
}
