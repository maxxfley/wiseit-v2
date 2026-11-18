import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { nodeMetadataSchema } from "@/features/roadmaps/schemas/node-metadata.schema";
import type { Database } from "@/types/database.types";
import { storedPreviewSchema } from "../schemas/extension.schema";
import type { ExtensionContext } from "./extension-prompt";

type Client = SupabaseClient<Database>;

export interface LoadedContext {
  context: ExtensionContext;
  /** "e1" → uuid del paso existente (los ids cortos los asigna el servidor, en orden). */
  existingByRef: Map<string, string>;
  /** Finales actuales de la ruta (pasos de los que no depende ninguno), del más avanzado al menos. */
  ends: string[];
}

/** Lee lo que la ruta ya tiene (RLS: solo rutas propias). Tres consultas fijas en paralelo, sin N+1. */
export async function loadExtensionContext(supabase: Client, roadmapId: string): Promise<LoadedContext | null> {
  const [roadmap, edges, preview] = await Promise.all([
    supabase
      .from("roadmaps")
      .select("topic, title, language, nodes(id, title, order_index, metadata)")
      .eq("id", roadmapId)
      .order("order_index", { referencedTable: "nodes", ascending: true })
      .maybeSingle(),
    supabase.from("node_edges").select("requires_node_id").eq("roadmap_id", roadmapId),
    supabase.from("roadmap_previews").select("titles").eq("roadmap_id", roadmapId).maybeSingle(),
  ]);
  const error = roadmap.error ?? edges.error ?? preview.error;
  if (error) console.error("[extensions/context] Fallo al leer la ruta", { code: error.code, message: error.message });
  if (!roadmap.data || edges.error || roadmap.data.nodes.length === 0) return null;

  const nodes = roadmap.data.nodes;
  const existingByRef = new Map(nodes.map((node, index) => [`e${index + 1}`, node.id]));
  const required = new Set((edges.data ?? []).map((edge) => edge.requires_node_id));
  const ends = nodes.filter((node) => !required.has(node.id)).reverse().map((node) => node.id);

  return {
    existingByRef,
    ends,
    context: {
      topic: roadmap.data.topic,
      title: roadmap.data.title,
      locale: isLocale(roadmap.data.language) ? roadmap.data.language : DEFAULT_LOCALE,
      existing: nodes.map((node, index) => ({
        id: `e${index + 1}`,
        title: node.title,
        key_concepts: nodeMetadataSchema.parse(node.metadata).key_concepts,
      })),
      suggestions: storedPreviewSchema.parse(preview.data?.titles ?? []),
    },
  };
}
