import "server-only";
import { cookies } from "next/headers";
import { TOPIC_DRAFT_COOKIE } from "@/config/topic-draft";
import { SESSION_COOKIE_OPTIONS } from "@/lib/supabase/cookies";
import { generateInputSchema } from "../schemas/generate-input.schema";

/**
 * Guarda el tema (ya validado) con las mismas banderas que la sesión: HttpOnly, Secure en
 * producción y SameSite=Strict. Escribir cookies solo es posible en Server Actions.
 */
export async function saveTopicDraft(topic: string): Promise<void> {
  (await cookies()).set(TOPIC_DRAFT_COOKIE.name, topic, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: TOPIC_DRAFT_COOKIE.maxAgeSeconds,
  });
}

/** Lee el tema guardado y lo vuelve a validar: el valor de una cookie nunca es de confianza. */
export async function readTopicDraft(): Promise<string | undefined> {
  const raw = (await cookies()).get(TOPIC_DRAFT_COOKIE.name)?.value;
  if (!raw) return undefined;
  const parsed = generateInputSchema.safeParse({ topic: raw });
  return parsed.success ? parsed.data.topic : undefined;
}

/** Se borra al generar una ruta: el borrador ya cumplió su función. */
export async function clearTopicDraft(): Promise<void> {
  (await cookies()).delete(TOPIC_DRAFT_COOKIE.name);
}
