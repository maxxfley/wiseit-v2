import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoadmapTheme } from "@/config/roadmap-visuals";
import type { Locale } from "@/lib/i18n/config";
import type { Database } from "@/types/database.types";
import type { OrderedNode } from "./normalize-nodes";

interface RoadmapToSave {
  topic: string;
  title: string;
  theme: RoadmapTheme;
  /** Idioma en que la IA escribió el contenido. */
  language: Locale;
  nodes: readonly OrderedNode[];
}

export type SaveResult = { ok: true; id: string } | { ok: false; reason: "roadmap_limit" | "error" };

/**
 * Guarda roadmap + nodos + aristas en UNA transacción (RPC `create_roadmap_with_nodes`).
 * `roadmap_limit`: el plan gratis ya tiene el máximo de rutas (trigger, código WS409).
 */
export async function saveRoadmap(supabase: SupabaseClient<Database>, roadmap: RoadmapToSave): Promise<SaveResult> {
  const { data, error } = await supabase.rpc("create_roadmap_with_nodes", {
    p_topic: roadmap.topic,
    p_title: roadmap.title,
    p_theme: roadmap.theme,
    p_language: roadmap.language,
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
    return { ok: false, reason: error.code === "WS409" ? "roadmap_limit" : "error" };
  }
  return { ok: true, id: data };
}
