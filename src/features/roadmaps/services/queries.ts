import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DIFFICULTY_LEVELS, type DifficultyLevel } from "../schemas/roadmap-output.schema";
import { nodeMetadataSchema, type NodeMetadata } from "../schemas/node-metadata.schema";
import { roadmapIdSchema } from "../schemas/roadmap-id.schema";

const LIST_LIMIT = 50;

export interface RoadmapSummary {
  id: string;
  title: string;
  topic: string;
  createdAt: string;
  nodeCount: number;
}

export interface RoadmapNodeView extends NodeMetadata {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  orderIndex: number;
}

export interface RoadmapDetail {
  id: string;
  title: string;
  topic: string;
  createdAt: string;
  nodes: RoadmapNodeView[];
}

const countSchema = z.array(z.object({ count: z.number() }));

/** Listado del usuario (RLS filtra por dueño) con el conteo de nodos embebido: una sola consulta, sin N+1. */
export async function listRoadmaps(limit: number = LIST_LIMIT): Promise<RoadmapSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("roadmaps")
    .select("id, title, topic, created_at, nodes(count)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[roadmaps/queries] Fallo al listar rutas", { code: error.code, message: error.message });
    throw new Error("No se pudieron cargar las rutas.");
  }
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    topic: row.topic,
    createdAt: row.created_at,
    nodeCount: countSchema.safeParse(row.nodes).data?.[0]?.count ?? 0,
  }));
}

/** Detalle con nodos ordenados por `order_index`. Devuelve null si el id es inválido, no existe o es ajeno (RLS). */
export async function getRoadmapDetail(rawId: string): Promise<RoadmapDetail | null> {
  const parsedId = roadmapIdSchema.safeParse(rawId);
  if (!parsedId.success) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("roadmaps")
    .select("id, title, topic, created_at, nodes(id, title, description, difficulty, order_index, metadata)")
    .eq("id", parsedId.data)
    .order("order_index", { referencedTable: "nodes", ascending: true })
    .maybeSingle();

  if (error) {
    console.error("[roadmaps/queries] Fallo al leer la ruta", { code: error.code, message: error.message });
    throw new Error("No se pudo cargar la ruta.");
  }
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    topic: data.topic,
    createdAt: data.created_at,
    nodes: data.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      difficulty: node.difficulty,
      orderIndex: node.order_index,
      ...nodeMetadataSchema.parse(node.metadata),
    })),
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
