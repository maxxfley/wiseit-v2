import "server-only";
import Groq from "groq-sdk";
import { AI_LIMITS } from "@/config/ai";
import { getAiEnv } from "@/lib/ai/env";
import { getGroqClient } from "@/lib/ai/groq";
import { roadmapJsonSchema, roadmapOutputSchema, type RoadmapOutput } from "../schemas/roadmap-output.schema";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt";

export type GenerationFailure = "rate_limited" | "unavailable" | "invalid_output";

export type GenerationResult =
  | { ok: true; roadmap: RoadmapOutput; totalTokens: number | null }
  | { ok: false; reason: GenerationFailure };

function classifyError(error: unknown): GenerationFailure {
  if (error instanceof Groq.RateLimitError) return "rate_limited";
  return "unavailable";
}

/** Pide la ruta a Groq con Structured Outputs estricto y la valida con Zod. */
export async function generateRoadmap(topic: string): Promise<GenerationResult> {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model: getAiEnv().GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
        issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
      return { ok: false, reason: "invalid_output" };
    }
    return { ok: true, roadmap: parsed.data, totalTokens: completion.usage?.total_tokens ?? null };
  } catch (error) {
    const detail = error instanceof Groq.APIError ? { status: error.status, message: error.message } : error;
    console.error("[roadmaps/generate] Fallo al llamar a Groq", detail);
    return { ok: false, reason: error instanceof SyntaxError ? "invalid_output" : classifyError(error) };
  }
}
