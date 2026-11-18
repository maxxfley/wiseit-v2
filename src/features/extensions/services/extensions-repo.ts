import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXTENSION_LIMITS } from "@/config/extensions";
import { PLAN_LIMITS } from "@/config/plans";
import type { Database } from "@/types/database.types";
import { storedPreviewSchema } from "../schemas/extension.schema";
import type { AppendNode } from "./link-extension";

type Client = SupabaseClient<Database>;
const LOG = "[extensions/repo]";

export type ExtensionReserve = "granted" | "not_found" | "premium_required" | "roadmap_max" | "exhausted" | "error";
export type PreviewReserve = "granted" | "cached" | "exhausted" | "not_found" | "error";

/** Estado de "Avanzar más" en una ruta (lo muestra la UI; la base lo vuelve a verificar). */
export interface ExtensionAccess {
  premium: boolean;
  roadmapLeft: number;
  todayLeft: number;
  previewTitles: string[];
}

function pickStatus<T extends string>(raw: string | undefined, allowed: readonly T[]): T | null {
  return allowed.find((value) => value === raw) ?? null;
}

export async function reserveExtension(supabase: Client, roadmapId: string) {
  const { data, error } = await supabase.rpc("reserve_extension", {
    p_roadmap_id: roadmapId,
    p_daily: PLAN_LIMITS.premium.dailyExtensions,
    p_per_roadmap: PLAN_LIMITS.premium.maxExtensionsPerRoadmap,
  });
  const status = pickStatus(data?.[0]?.status, ["granted", "not_found", "premium_required", "roadmap_max", "exhausted"] as const);
  if (error || !status) console.error(`${LOG} Fallo al reservar extensión`, { code: error?.code, message: error?.message });
  return { status: status ?? ("error" as ExtensionReserve), usageId: data?.[0]?.usage_id ?? null };
}

/** Alta atómica de los pasos nuevos. Devuelve false si la base la rechazó (se registra el motivo). */
export async function appendNodes(supabase: Client, usageId: string, roadmapId: string, nodes: AppendNode[]): Promise<boolean> {
  const { error } = await supabase.rpc("append_roadmap_nodes", {
    p_usage_id: usageId,
    p_roadmap_id: roadmapId,
    p_nodes: nodes,
    p_per_roadmap: PLAN_LIMITS.premium.maxExtensionsPerRoadmap,
  });
  if (error) console.error(`${LOG} Fallo al agregar los pasos`, { code: error.code, message: error.message });
  return !error;
}

export async function reservePreview(supabase: Client, roadmapId: string) {
  const { data, error } = await supabase.rpc("reserve_preview", { p_roadmap_id: roadmapId, p_daily: EXTENSION_LIMITS.previewDaily });
  const status = pickStatus(data?.[0]?.status, ["granted", "cached", "exhausted", "not_found"] as const);
  if (error || !status) console.error(`${LOG} Fallo al reservar títulos`, { code: error?.code, message: error?.message });
  return { status: status ?? ("error" as PreviewReserve), usageId: data?.[0]?.usage_id ?? null };
}

export async function savePreview(supabase: Client, usageId: string, roadmapId: string, titles: string[], model: string) {
  const { error } = await supabase.rpc("save_roadmap_preview", { p_usage_id: usageId, p_roadmap_id: roadmapId, p_titles: titles, p_model: model });
  if (error) console.error(`${LOG} Fallo al guardar títulos`, { code: error.code, message: error.message });
}

export async function getPreviewTitles(supabase: Client, roadmapId: string): Promise<string[]> {
  const { data, error } = await supabase.from("roadmap_previews").select("titles").eq("roadmap_id", roadmapId).maybeSingle();
  if (error) console.error(`${LOG} Fallo al leer títulos`, { code: error.code });
  return storedPreviewSchema.parse(data?.titles ?? []);
}

/** Estado inicial para la página: extensiones restantes (ruta y día) y títulos fantasma. */
export async function getExtensionAccess(supabase: Client, roadmapId: string, premium: boolean): Promise<ExtensionAccess> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const [extensions, today, titles] = await Promise.all([
    supabase.from("roadmap_extensions").select("id", { count: "exact", head: true }).eq("roadmap_id", roadmapId),
    supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("kind", "extension").gte("created_at", startOfDay.toISOString()),
    getPreviewTitles(supabase, roadmapId),
  ]);
  if (extensions.error || today.error) console.error(`${LOG} Fallo al contar extensiones`);
  return {
    premium,
    roadmapLeft: Math.max(0, PLAN_LIMITS.premium.maxExtensionsPerRoadmap - (extensions.count ?? 0)),
    todayLeft: Math.max(0, PLAN_LIMITS.premium.dailyExtensions - (today.count ?? 0)),
    previewTitles: titles,
  };
}
