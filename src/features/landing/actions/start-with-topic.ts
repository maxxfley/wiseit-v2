"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/session";
import { generateInputSchema } from "@/features/roadmaps/schemas/generate-input.schema";
import { saveTopicDraft } from "@/features/roadmaps/services/topic-draft";
import type { GenerateFormState } from "@/features/roadmaps/types";
import { localizedActionPath } from "@/lib/i18n/action-locale";

/**
 * Campo "Creá la tuya" de la landing: valida el tema en el servidor, lo guarda como borrador y lleva
 * al registro (o al dashboard si ya hay sesión), donde el formulario aparece precargado.
 * No genera nada ni consume cupo.
 */
export async function startWithTopicAction(_prev: GenerateFormState, formData: FormData): Promise<GenerateFormState> {
  const parsed = generateInputSchema.safeParse({ topic: formData.get("topic") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: { topic: parsed.error.issues.map((issue) => issue.message) } };
  }
  await saveTopicDraft(parsed.data.topic);

  const user = await getCurrentUser();
  // redirect lanza una excepción interna de Next: debe ir fuera de cualquier try/catch.
  redirect(await localizedActionPath(user ? ROUTES.dashboard : ROUTES.signup));
}
