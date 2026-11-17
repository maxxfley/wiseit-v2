import "server-only";
import Groq from "groq-sdk";
import { AI_LIMITS } from "@/config/ai";
import { getAiEnv } from "@/lib/ai/env";
import { getGroqClient } from "@/lib/ai/groq";
import type { Locale } from "@/lib/i18n/config";
import { roadmapJsonSchema, roadmapOutputSchema, type RoadmapOutput } from "../schemas/roadmap-output.schema";
import { buildSystemPrompt, buildUserMessage } from "./prompt";

export type GenerationFailure = "rate_limited" | "unavailable" | "invalid_output";

export type GenerationResult =
  | { ok: true; roadmap: RoadmapOutput; totalTokens: number | null }
  | { ok: false; reason: GenerationFailure };

function classifyError(error: unknown): GenerationFailure {
  if (error instanceof SyntaxError) return "invalid_output"; // JSON.parse de una respuesta truncada
  // Groq valida el JSON Schema en su servidor y responde 400 si el modelo no lo cumple:
  // es una salida inválida del modelo (se reintenta gratis), no una caída del servicio.
  if (error instanceof Groq.BadRequestError && error.message.includes("json_validate_failed")) return "invalid_output";
  if (error instanceof Groq.RateLimitError) return "rate_limited";
  return "unavailable";
}

/** Un intento: pide la ruta a Groq con Structured Outputs estricto y la valida con Zod. */
async function requestRoadmap(topic: string, locale: Locale, attempt: number): Promise<GenerationResult> {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: getAiEnv().GROQ_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(locale) },
        { role: "user", content: buildUserMessage(topic) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "roadmap", strict: true, schema: roadmapJsonSchema() },
      },
      max_completion_tokens: AI_LIMITS.maxCompletionTokens,
      reasoning_effort: "low",
    });

    const content = completion.choices[0]?.message.content;
    const parsed = roadmapOutputSchema.safeParse(content ? JSON.parse(content) : null);
    if (!parsed.success) {
      console.error("[roadmaps/generate] La respuesta de la IA no cumple el esquema", {
        attempt,
        issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
      return { ok: false, reason: "invalid_output" };
    }
    return { ok: true, roadmap: parsed.data, totalTokens: completion.usage?.total_tokens ?? null };
  } catch (error) {
    const detail = error instanceof Groq.APIError ? { status: error.status, message: error.message } : error;
    console.error("[roadmaps/generate] Fallo al llamar a Groq", { attempt, detail });
    return { ok: false, reason: classifyError(error) };
  }
}

/**
 * Genera la ruta. Si la IA devuelve algo inválido se reintenta (hasta `invalidOutputRetries`)
 * dentro de la MISMA reserva de cupo: el usuario no paga por un error del modelo. Los errores
 * de red o de límite no se reintentan aquí (el cliente de Groq ya tiene sus propios reintentos).
 */
export async function generateRoadmap(topic: string, locale: Locale): Promise<GenerationResult> {
  let result = await requestRoadmap(topic, locale, 1);
  for (let retry = 1; retry <= AI_LIMITS.invalidOutputRetries; retry++) {
    if (result.ok || result.reason !== "invalid_output") break;
    result = await requestRoadmap(topic, locale, retry + 1);
  }
  return result;
}
