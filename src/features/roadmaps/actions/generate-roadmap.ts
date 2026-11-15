"use server";

import { redirect } from "next/navigation";
import { AI_LIMITS } from "@/config/ai";
import { ROUTES } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateInputSchema } from "../schemas/generate-input.schema";
import { generateRoadmap, type GenerationFailure } from "../services/generate-roadmap";
import { normalizeNodes } from "../services/normalize-nodes";
import { reserveGeneration } from "../services/quota";
import { saveRoadmap } from "../services/save-roadmap";
import type { GenerateFormState } from "../types";

const FAILURE_MESSAGES: Record<GenerationFailure, string> = {
  rate_limited: "El servicio de IA está saturado. Probá de nuevo en un minuto.",
  unavailable: "No pudimos generar la ruta ahora. Intentá de nuevo más tarde.",
  invalid_output: "La IA devolvió una ruta inválida. Probá con otro tema o reintentá.",
};

const error = (message: string): GenerateFormState => ({ status: "error", message });

export async function generateRoadmapAction(
  _prev: GenerateFormState,
  formData: FormData,
): Promise<GenerateFormState> {
  // Cada Server Action verifica por su cuenta: el proxy y la UI no son la única barrera.
  const user = await getCurrentUser();
  if (!user) return error("Tu sesión expiró. Volvé a ingresar.");

  const parsed = generateInputSchema.safeParse({ topic: formData.get("topic") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: { topic: parsed.error.issues.map((issue) => issue.message) } };
  }
  const { topic } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const quota = await reserveGeneration(supabase);
  if (quota === "exhausted") {
    return error(`Llegaste al límite de ${AI_LIMITS.dailyGenerations} rutas por día. Volvé mañana.`);
  }
  if (quota === "error") return error("No pudimos verificar tu cupo. Intentá de nuevo más tarde.");

  const result = await generateRoadmap(topic);
  if (!result.ok) return error(FAILURE_MESSAGES[result.reason]);

  const nodes = normalizeNodes(result.roadmap.nodes);
  const { title, theme } = result.roadmap;
  const id = await saveRoadmap(supabase, { topic, title, theme, nodes });
  if (!id) return error("Generamos la ruta pero no pudimos guardarla. Intentá de nuevo.");

  // redirect lanza una excepción interna de Next: debe ir fuera de cualquier try/catch.
  redirect(`${ROUTES.roadmaps}/${id}`);
}
