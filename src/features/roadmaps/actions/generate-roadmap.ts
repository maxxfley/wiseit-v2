"use server";

import { redirect } from "next/navigation";
import { PLAN_LIMITS } from "@/config/plans";
import { ROUTES } from "@/config/routes";
import { getModelForPlan } from "@/lib/ai/env";
import { getActionLocale } from "@/lib/i18n/action-locale";
import { localizePath } from "@/lib/i18n/paths";
import type { MessageKey } from "@/locales/types";
import { getCurrentUser } from "@/features/auth/services/session";
import { getIsPremium } from "@/features/plans/services/plan";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateInputSchema } from "../schemas/generate-input.schema";
import { generateRoadmap, type GenerationFailure } from "../services/generate-roadmap";
import { normalizeNodes } from "../services/normalize-nodes";
import { hasReachedRoadmapLimit, settleAiUsage, reserveAiUsage } from "../services/quota";
import { saveRoadmap } from "../services/save-roadmap";
import { clearTopicDraft } from "../services/topic-draft";
import type { GenerateFormState } from "../types";

const FAILURE_MESSAGES: Record<GenerationFailure, MessageKey> = {
  rate_limited: "aiRateLimited",
  unavailable: "aiUnavailable",
  invalid_output: "aiInvalidOutput",
};

const error = (message: MessageKey): GenerateFormState => ({ status: "error", message });

export async function generateRoadmapAction(
  _prev: GenerateFormState,
  formData: FormData,
): Promise<GenerateFormState> {
  // Cada Server Action verifica por su cuenta: el proxy y la UI no son la única barrera.
  const user = await getCurrentUser();
  if (!user) return error("sessionExpired");

  const parsed = generateInputSchema.safeParse({ topic: formData.get("topic") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: { topic: parsed.error.issues.map((issue) => issue.message) } };
  }
  const { topic } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const premium = await getIsPremium();
  // Antes de gastar cupo: con el máximo de rutas guardadas, generar no serviría de nada.
  if (await hasReachedRoadmapLimit(supabase, premium)) return error("roadmapLimit");

  const quota = await reserveAiUsage(supabase, "generation", {
    free: PLAN_LIMITS.free.dailyGenerations,
    premium: PLAN_LIMITS.premium.dailyGenerations,
  });
  if (quota.status === "exhausted") return error("quotaExhausted");
  if (quota.status === "error") return error("quotaError");

  // La ruta se genera en el idioma de la interfaz desde la que se pidió, con el modelo del plan.
  const locale = await getActionLocale();
  const model = getModelForPlan(premium);
  console.info("[roadmaps/generate] Generando ruta", { locale, model });
  const result = await generateRoadmap(topic, locale, model);
  await settleAiUsage(supabase, quota.usageId, model, result); // devuelve el cupo si la IA lo rechazó sin procesarlo
  if (!result.ok) return error(FAILURE_MESSAGES[result.reason]);

  const nodes = normalizeNodes(result.roadmap.nodes);
  const { title, theme } = result.roadmap;
  const saved = await saveRoadmap(supabase, { topic, title, theme, language: locale, nodes });
  if (!saved.ok) return error(saved.reason === "roadmap_limit" ? "roadmapLimit" : "saveFailed");
  await clearTopicDraft(); // El tema escrito en la landing (si había) ya se usó.

  // redirect lanza una excepción interna de Next: debe ir fuera de cualquier try/catch.
  redirect(localizePath(locale, `${ROUTES.roadmaps}/${saved.id}`));
}
