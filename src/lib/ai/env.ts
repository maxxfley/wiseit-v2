import "server-only";
import { z } from "zod";

const aiEnvSchema = z.object({
  GROQ_API_KEY: z.string().min(20),
  GROQ_MODEL: z.string().min(3),
});

export type AiEnv = z.infer<typeof aiEnvSchema>;

let cached: AiEnv | null = null;

/** Valida las variables de Groq al primer uso. Solo servidor: nunca con prefijo NEXT_PUBLIC_. */
export function getAiEnv(): AiEnv {
  if (cached) return cached;

  const parsed = aiEnvSchema.safeParse({
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL,
  });
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`[ai/env] Variables de entorno inválidas o ausentes: ${fields}`);
  }

  cached = parsed.data;
  return cached;
}
