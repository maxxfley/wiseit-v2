import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { OrderedNode } from "./normalize-nodes";

/**
 * Guarda roadmap + nodos en UNA transacción (RPC `create_roadmap_with_nodes`).
 * Devuelve el id del roadmap, o null si falló (el detalle queda en el log del servidor).
 */
export async function saveRoadmap(
  supabase: SupabaseClient<Database>,
  topic: string,
  title: string,
  nodes: readonly OrderedNode[],
): Promise<string | null> {
  const { data, error } = await supabase.rpc("create_roadmap_with_nodes", {
    p_topic: topic,
    p_title: title,
    p_nodes: nodes.map((node) => ({
      title: node.title,
      description: node.description,
      difficulty: node.difficulty,
      order_index: node.order_index,
      metadata: { key_concepts: node.key_concepts, practice: node.practice },
    })),
  });
  if (error) {
    console.error("[roadmaps/save] Fallo al guardar la ruta", { code: error.code, message: error.message });
    return null;
  }
  return data;
}
