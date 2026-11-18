"use server";

import { z } from "zod";
import { getCurrentUser } from "@/features/auth/services/session";
import { getIsPremium } from "@/features/plans/services/plan";
import { recordAiUsage } from "@/features/roadmaps/services/quota";
import type { AiFailure } from "@/lib/ai/errors";
import { getModelForPlan } from "@/lib/ai/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MessageKey } from "@/locales/types";
import type { MaterialItem } from "../schemas/material.schema";
import { findMaterials } from "../services/find-materials";
import { getCachedItems, getMaterialTopic, reserveMaterialSearch, saveNodeMaterials } from "../services/materials-repo";
import { visibleItems } from "../services/visibility";

export type SearchMaterialsResult =
  /** `freeLinkUsed`: esta búsqueda gastó el link gratis de la ruta (la UI actualiza el cupo). */
  | { status: "ok"; items: MaterialItem[]; freeLinkUsed: boolean }
  /** Plan gratis sin cupo: la UI muestra la invitación a Premium. */
  | { status: "locked"; reason: "roadmap_used" | "account_used" }
  | { status: "error"; message: MessageKey };

const inputSchema = z.object({ nodeId: z.uuid() });

const FAILURE_MESSAGES: Record<AiFailure, MessageKey> = {
  rate_limited: "materialsRateLimited",
  unavailable: "materialsFailed",
  invalid_output: "materialsFailed",
};

const fail = (message: MessageKey): SearchMaterialsResult => ({ status: "error", message });

/**
 * "Buscar material" de un tema. Orden: sesión → validación → reserva atómica en la base (que
 * verifica dueño, caché y cupo) → búsqueda → tokens → caché. La reserva se consume aunque la
 * búsqueda falle (misma regla que generar rutas: nadie gasta llamadas provocando errores).
 */
export async function searchMaterialsAction(input: { nodeId: string }): Promise<SearchMaterialsResult> {
  const user = await getCurrentUser();
  if (!user) return fail("sessionExpired");

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return fail("nodeNotFound");
  const { nodeId } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const premium = await getIsPremium();
  const reserve = await reserveMaterialSearch(supabase, nodeId);

  switch (reserve.status) {
    case "cached":
      return { status: "ok", items: visibleItems(await getCachedItems(supabase, nodeId), premium), freeLinkUsed: false };
    case "roadmap_used":
    case "account_used":
      return { status: "locked", reason: reserve.status };
    case "exhausted":
      return fail("materialsExhausted");
    case "not_found":
      return fail("nodeNotFound");
    case "error":
      return fail("quotaError");
  }

  const usageId = reserve.usageId;
  const topic = await getMaterialTopic(supabase, nodeId);
  if (!usageId || !topic) return fail("materialsFailed");

  const model = getModelForPlan(premium);
  console.info("[materials/search] Buscando material", { model, language: topic.language });
  const result = await findMaterials(topic, model);
  await recordAiUsage(supabase, usageId, model, result.usage);
  if (!result.ok) return fail(FAILURE_MESSAGES[result.reason]);

  await saveNodeMaterials(supabase, usageId, nodeId, result.items, model);
  return { status: "ok", items: visibleItems(result.items, premium), freeLinkUsed: !premium };
}
