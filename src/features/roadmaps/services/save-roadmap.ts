import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoadmapTheme } from "@/config/roadmap-visuals";
import type { Database } from "@/types/database.types";
import type { OrderedNode } from "./normalize-nodes";

interface RoadmapToSave {
  topic: string;
  title: string;
  theme: RoadmapTheme;
  nodes: readonly OrderedNode[];
}

/**
 * Guarda roadmap + nodos + aristas en UNA transacción (RPC `create_roadmap_with_nodes`).
 * Devuelve el id del roadmap, o null si falló (el detalle queda en el log del servidor).
 */
export async function saveRoadmap(supabase: SupabaseClient<Database>, roadmap: RoadmapToSave): Promise<string | null> {
  const { data, error } = await supabase.rpc("create_roadmap_with_nodes", {
    p_topic: roadmap.topic,
    p_title: roadmap.title,
    p_theme: roadmap.theme,
    p_nodes: roadmap.nodes.map((node) => ({
      title: node.title,
      description: node.description,
      difficulty: node.difficulty,
      order_index: node.order_index,
      requires: node.requires,
      metadata: { key_concepts: node.key_concepts, practice: node.practice, icon: node.icon },
    })),
  });
  if (error) {
    console.error("[roadmaps/save] Fallo al guardar la ruta", { code: error.code, message: error.message });
    return null;
  }
  return data;
}
