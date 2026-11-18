"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ROUTES } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/session";
import { settleAiUsage } from "@/features/roadmaps/services/quota";
import type { AiFailure } from "@/lib/ai/errors";
import { getModelForPlan } from "@/lib/ai/env";
import { localizedActionPath } from "@/lib/i18n/action-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MessageKey } from "@/locales/types";
import { loadExtensionContext } from "../services/extension-context";
import { appendNodes, reserveExtension, type ExtensionReserve } from "../services/extensions-repo";
import { generateExtension } from "../services/generate-extension";
import { linkExtension } from "../services/link-extension";

export type ExtendResult = { status: "ok"; added: number } | { status: "error"; message: MessageKey };

const inputSchema = z.object({ roadmapId: z.uuid() });

const RESERVE_MESSAGES: Record<Exclude<ExtensionReserve, "granted">, MessageKey> = {
  not_found: "roadmapGone",
  premium_required: "extendPremium",
  roadmap_max: "extendRoadmapMax",
  exhausted: "extendExhausted",
  error: "quotaError",
};

const FAILURE_MESSAGES: Record<AiFailure, MessageKey> = {
  rate_limited: "aiRateLimited",
  unavailable: "extendFailed",
  invalid_output: "extendFailed",
};

const fail = (message: MessageKey): ExtendResult => ({ status: "error", message });

/**
 * "Avanzar más" (solo Premium). Orden: sesión → validación → reserva atómica (dueño, Premium,
 * tope por ruta y cuota diaria) → IA con el modelo Premium → tokens → alta atómica de pasos y
 * aristas. Si la IA falla después de trabajar, el intento se consume; si rechazó el pedido sin
 * procesarlo, `settleAiUsage` devuelve el cupo.
 */
export async function extendRoadmapAction(input: { roadmapId: string }): Promise<ExtendResult> {
  const user = await getCurrentUser();
  if (!user) return fail("sessionExpired");

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return fail("roadmapInvalid");
  const { roadmapId } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const reserve = await reserveExtension(supabase, roadmapId);
  if (reserve.status !== "granted" || !reserve.usageId) {
    return fail(reserve.status === "granted" ? "quotaError" : RESERVE_MESSAGES[reserve.status]);
  }

  const loaded = await loadExtensionContext(supabase, roadmapId);
  if (!loaded) return fail("extendFailed");

  const model = getModelForPlan(true); // La reserva ya confirmó que es Premium.
  console.info("[extensions/extend] Extendiendo ruta", { model, existing: loaded.context.existing.length });
  const result = await generateExtension(loaded.context, model);
  await settleAiUsage(supabase, reserve.usageId, model, result); // devuelve el cupo si la IA lo rechazó sin procesarlo
  if (!result.ok) return fail(FAILURE_MESSAGES[result.reason]);

  const nodes = linkExtension(result.nodes, loaded.existingByRef, loaded.ends);
  const saved = await appendNodes(supabase, reserve.usageId, roadmapId, nodes);
  if (!saved) return fail("extendFailed");

  // Trae la ruta real del servidor: el mapa recalcula el layout con los pasos nuevos.
  revalidatePath(await localizedActionPath(`${ROUTES.roadmaps}/${roadmapId}`));
  return { status: "ok", added: nodes.length };
}
