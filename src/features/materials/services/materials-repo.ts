import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/config/plans";
import { nodeMetadataSchema } from "@/features/roadmaps/schemas/node-metadata.schema";
import type { Database } from "@/types/database.types";
import { materialItemsSchema, type MaterialItem } from "../schemas/material.schema";
import type { MaterialTopic } from "./material-prompt";
import { visibleItems, type MaterialAccess } from "./visibility";

type Client = SupabaseClient<Database>;

export type ReserveStatus = "granted" | "cached" | "exhausted" | "roadmap_used" | "account_used" | "not_found";
export type ReserveResult = { status: ReserveStatus; usageId: string | null } | { status: "error"; usageId: null };

const LOG = "[materials/repo]";
const RESERVE_STATUSES: readonly string[] = ["granted", "cached", "exhausted", "roadmap_used", "account_used", "not_found"];
const isReserveStatus = (value: string): value is ReserveStatus => RESERVE_STATUSES.includes(value);

/** Reserva atómica en la base (caché, cuota Premium o cupo gratis). Ver `reserve_material_search`. */
export async function reserveMaterialSearch(supabase: Client, nodeId: string): Promise<ReserveResult> {
  const { data, error } = await supabase.rpc("reserve_material_search", {
    p_node_id: nodeId,
    p_premium_daily: PLAN_LIMITS.premium.dailyMaterialSearches,
    p_free_total: PLAN_LIMITS.free.materialLinksPerAccount,
  });
  const row = data?.[0];
  if (error || !row || !isReserveStatus(row.status)) {
    console.error(`${LOG} Fallo al reservar`, { code: error?.code, message: error?.message });
    return { status: "error", usageId: null };
  }
  return { status: row.status, usageId: row.usage_id };
}

export async function saveNodeMaterials(supabase: Client, usageId: string, nodeId: string, items: MaterialItem[], model: string) {
  const { error } = await supabase.rpc("save_node_materials", { p_usage_id: usageId, p_node_id: nodeId, p_items: items, p_model: model });
  // Si falla, el usuario igual recibe sus fuentes; solo se pierde la caché.
  if (error) console.error(`${LOG} Fallo al guardar la caché`, { code: error.code, message: error.message });
}

export async function getCachedItems(supabase: Client, nodeId: string): Promise<MaterialItem[]> {
  const { data, error } = await supabase.from("node_materials").select("items").eq("node_id", nodeId).maybeSingle();
  if (error) console.error(`${LOG} Fallo al leer la caché`, { code: error.code, message: error.message });
  return materialItemsSchema.parse(data?.items ?? []);
}

/** Título, conceptos e idioma del tema a buscar (RLS: solo nodos propios). */
export async function getMaterialTopic(supabase: Client, nodeId: string): Promise<MaterialTopic | null> {
  const { data, error } = await supabase
    .from("nodes")
    .select("title, metadata, roadmaps(title, language)")
    .eq("id", nodeId)
    .maybeSingle();
  if (error) console.error(`${LOG} Fallo al leer el tema`, { code: error.code, message: error.message });
  if (!data?.roadmaps) return null;
  return {
    roadmapTitle: data.roadmaps.title,
    nodeTitle: data.title,
    keyConcepts: nodeMetadataSchema.parse(data.metadata).key_concepts,
    language: data.roadmaps.language,
  };
}

/** Estado inicial de una ruta: fuentes en caché (ya recortadas por plan) y cupo gratis. */
export async function getRoadmapMaterials(
  supabase: Client,
  roadmapId: string,
  premium: boolean,
): Promise<{ byNode: Record<string, MaterialItem[]>; access: MaterialAccess }> {
  const [cache, grants] = await Promise.all([
    supabase.from("node_materials").select("node_id, items").eq("roadmap_id", roadmapId),
    supabase.from("free_material_grants").select("roadmap_id"),
  ]);
  if (cache.error) console.error(`${LOG} Fallo al leer la caché de la ruta`, { code: cache.error.code });
  if (grants.error) console.error(`${LOG} Fallo al leer el cupo gratis`, { code: grants.error.code });

  const byNode: Record<string, MaterialItem[]> = {};
  for (const row of cache.data ?? []) byNode[row.node_id] = visibleItems(materialItemsSchema.parse(row.items), premium);
  const used = grants.data ?? [];
  return {
    byNode,
    access: {
      premium,
      freeRoadmapUsed: used.some((grant) => grant.roadmap_id === roadmapId),
      freeLinksLeft: Math.max(0, PLAN_LIMITS.free.materialLinksPerAccount - used.length),
    },
  };
}
