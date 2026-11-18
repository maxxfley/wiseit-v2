"use server";

import { z } from "zod";
import { getCurrentUser } from "@/features/auth/services/session";
import { recordAiUsage } from "@/features/roadmaps/services/quota";
import { getModelForPlan } from "@/lib/ai/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MessageKey } from "@/locales/types";
import { loadExtensionContext } from "../services/extension-context";
import { getPreviewTitles, reservePreview, savePreview } from "../services/extensions-repo";
import { generatePreview } from "../services/generate-preview";

export type PreviewActionResult = { status: "ok"; titles: string[] } | { status: "error"; message: MessageKey };

const inputSchema = z.object({ roadmapId: z.uuid() });
const fail = (message: MessageKey): PreviewActionResult => ({ status: "error", message });

/**
 * Plan gratis: títulos "fantasma" de lo que agregaría "Avanzar más". Se generan UNA vez por ruta
 * con el modelo gratis y quedan guardados; si ya existen, se devuelven sin costo.
 */
export async function previewExtensionAction(input: { roadmapId: string }): Promise<PreviewActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("sessionExpired");

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return fail("roadmapInvalid");
  const { roadmapId } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const reserve = await reservePreview(supabase, roadmapId);
  if (reserve.status === "cached") return { status: "ok", titles: await getPreviewTitles(supabase, roadmapId) };
  if (reserve.status === "exhausted") return fail("previewExhausted");
  if (reserve.status === "not_found") return fail("roadmapGone");
  if (reserve.status !== "granted" || !reserve.usageId) return fail("quotaError");

  const loaded = await loadExtensionContext(supabase, roadmapId);
  if (!loaded) return fail("extendFailed");

  const model = getModelForPlan(false);
  const result = await generatePreview(loaded.context, model);
  await recordAiUsage(supabase, reserve.usageId, model, result.usage);
  if (!result.ok) return fail("extendFailed");

  await savePreview(supabase, reserve.usageId, roadmapId, result.titles, model);
  return { status: "ok", titles: result.titles };
}
