"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { getActionLocale } from "@/lib/i18n/action-locale";
import { localizePath } from "@/lib/i18n/paths";
import type { MessageKey } from "@/locales/types";
import { getCurrentUser } from "@/features/auth/services/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateInputSchema } from "../schemas/generate-input.schema";
import { generateRoadmap, type GenerationFailure } from "../services/generate-roadmap";
import { normalizeNodes } from "../services/normalize-nodes";
import { reserveGeneration } from "../services/quota";
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
  const quota = await reserveGeneration(supabase);
  if (quota === "exhausted") return error("quotaExhausted");
  if (quota === "error") return error("quotaError");

  // La ruta se genera en el idioma de la interfaz desde la que se pidió.
  const locale = await getActionLocale();
  console.info("[roadmaps/generate] Generando ruta", { locale }); // diagnóstico: idioma pedido a la IA
  const result = await generateRoadmap(topic, locale);
  if (!result.ok) return error(FAILURE_MESSAGES[result.reason]);

  const nodes = normalizeNodes(result.roadmap.nodes);
  const { title, theme } = result.roadmap;
  const id = await saveRoadmap(supabase, { topic, title, theme, language: locale, nodes });
  if (!id) return error("saveFailed");
  await clearTopicDraft(); // El tema escrito en la landing (si había) ya se usó.

  // redirect lanza una excepción interna de Next: debe ir fuera de cualquier try/catch.
  redirect(localizePath(locale, `${ROUTES.roadmaps}/${id}`));
}
