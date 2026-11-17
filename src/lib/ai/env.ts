import "server-only";
import { z } from "zod";

const aiEnvSchema = z.object({
  GROQ_API_KEY: z.string().min(20),
  /** Modelo del plan gratis (el de siempre). */
  GROQ_MODEL: z.string().min(3),
  /** Modelo de Premium. Opcional: si no está definida, se usa el valor por defecto. */
  GROQ_MODEL_PREMIUM: z.string().min(3).default("openai/gpt-oss-120b"),
});

export type AiEnv = z.infer<typeof aiEnvSchema>;

let cached: AiEnv | null = null;

/** Valida las variables de Groq al primer uso. Solo servidor: nunca con prefijo NEXT_PUBLIC_. */
export function getAiEnv(): AiEnv {
  if (cached) return cached;

  const parsed = aiEnvSchema.safeParse({
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL,
    GROQ_MODEL_PREMIUM: process.env.GROQ_MODEL_PREMIUM || undefined,
  });
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`[ai/env] Variables de entorno inválidas o ausentes: ${fields}`);
  }

  cached = parsed.data;
  return cached;
}

/** Modelo según el plan: Premium usa el más potente (decisión del Paso 7). */
export function getModelForPlan(premium: boolean): string {
  const env = getAiEnv();
  return premium ? env.GROQ_MODEL_PREMIUM : env.GROQ_MODEL;
}
