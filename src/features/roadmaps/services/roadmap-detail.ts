import "server-only";
import { DEFAULT_ROADMAP_THEME, ROADMAP_THEMES, type RoadmapTheme } from "@/config/roadmap-visuals";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nodeMetadataSchema } from "../schemas/node-metadata.schema";
import { roadmapIdSchema } from "../schemas/roadmap-id.schema";
import type { RoadmapNodeView } from "../utils/node-status";

export interface RoadmapDetail {
  id: string;
  title: string;
  topic: string;
  theme: RoadmapTheme;
  createdAt: string;
  nodes: RoadmapNodeView[];
  /** false en rutas anteriores al Paso 6 (sin aristas): solo se muestran como lista. */
  hasGraph: boolean;
}

const themeSchema = z.enum(ROADMAP_THEMES).catch(DEFAULT_ROADMAP_THEME);

function fail(context: string, error: { code: string; message: string }): never {
  console.error(`[roadmaps/detail] Fallo al leer ${context}`, { code: error.code, message: error.message });
  throw new Error("No se pudo cargar la ruta.");
}

/**
 * Detalle con nodos (ordenados por `order_index`), progreso y aristas: dos consultas fijas en
 * paralelo, sin N+1. Devuelve null si el id es inválido, no existe o es ajeno (RLS).
 */
export async function getRoadmapDetail(rawId: string): Promise<RoadmapDetail | null> {
  const parsedId = roadmapIdSchema.safeParse(rawId);
  if (!parsedId.success) return null;

  const supabase = await createSupabaseServerClient();
  const [roadmapResult, edgesResult] = await Promise.all([
    supabase
      .from("roadmaps")
      // Literal único (no concatenado): Supabase infiere el tipo de la fila desde este string.
      .select(
        "id, title, topic, theme, created_at, nodes(id, title, description, difficulty, order_index, metadata, completed_concepts, started_at, completed_at)",
      )
      .eq("id", parsedId.data)
      .order("order_index", { referencedTable: "nodes", ascending: true })
      .maybeSingle(),
    supabase.from("node_edges").select("node_id, requires_node_id").eq("roadmap_id", parsedId.data),
  ]);

  if (roadmapResult.error) fail("la ruta", roadmapResult.error);
  if (edgesResult.error) fail("las aristas", edgesResult.error);
  const data = roadmapResult.data;
  if (!data) return null;

  const requiresByNode = new Map<string, string[]>();
  for (const edge of edgesResult.data) {
    requiresByNode.set(edge.node_id, [...(requiresByNode.get(edge.node_id) ?? []), edge.requires_node_id]);
  }

  return {
    id: data.id,
    title: data.title,
    topic: data.topic,
    theme: themeSchema.parse(data.theme),
    createdAt: data.created_at,
    hasGraph: edgesResult.data.length > 0,
    nodes: data.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      difficulty: node.difficulty,
      orderIndex: node.order_index,
      completedConcepts: node.completed_concepts,
      startedAt: node.started_at,
      completedAt: node.completed_at,
      requires: requiresByNode.get(node.id) ?? [],
      ...nodeMetadataSchema.parse(node.metadata),
    })),
  };
}
