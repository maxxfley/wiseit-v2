import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LIST_LIMIT = 50;

export interface RoadmapSummary {
  id: string;
  title: string;
  topic: string;
  createdAt: string;
  nodeCount: number;
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
