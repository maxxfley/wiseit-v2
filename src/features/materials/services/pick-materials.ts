import "server-only";
import { MATERIAL_LIMITS } from "@/config/materials";
import { aiErrorDetail, classifyAiError, type AiFailure } from "@/lib/ai/errors";
import { getGroqClient } from "@/lib/ai/groq";
import type { TokenUsage } from "@/features/roadmaps/services/quota";
import { materialItemSchema, materialPickJsonSchema, materialPickWireSchema, type MaterialItem } from "../schemas/material.schema";
import { buildPickSystemPrompt, buildSearchUserMessage, type MaterialTopic } from "./material-prompt";
import type { SearchCandidate } from "./search-web";

export type PickResult =
  | { ok: true; items: MaterialItem[]; usage: TokenUsage }
  | { ok: false; reason: AiFailure; usage: TokenUsage };

/**
 * Convierte la elección del modelo en fuentes: cada número se resuelve contra los candidatos
 * reales; se descartan números inválidos, repetidos y un segundo resultado del mismo sitio.
 */
function resolve(picks: { candidate: number; title: string; kind: string; reason: string }[], candidates: SearchCandidate[]) {
  const items: MaterialItem[] = [];
  const hosts = new Set<string>();
  for (const pick of picks) {
    const candidate = candidates[pick.candidate];
    if (!candidate) continue;
    const host = new URL(candidate.url).hostname.replace(/^www\./, "");
    if (hosts.has(host)) continue;
    const parsed = materialItemSchema.safeParse({
      url: candidate.url,
      title: pick.title.trim() || candidate.title,
      kind: pick.kind,
      reason: pick.reason,
    });
    if (!parsed.success) continue;
    hosts.add(host);
    items.push(parsed.data);
    if (items.length === MATERIAL_LIMITS.maxItems) break;
  }
  return items;
}

/** Paso 2: con Structured Outputs, el modelo elige y describe las mejores fuentes (por número). */
export async function pickMaterials(topic: MaterialTopic, candidates: SearchCandidate[], model: string): Promise<PickResult> {
  const list = candidates.map((candidate, index) => ({ candidate: index, ...candidate }));
  try {
    const completion = await getGroqClient().chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildPickSystemPrompt(topic.language, MATERIAL_LIMITS.maxItems) },
        { role: "user", content: `${buildSearchUserMessage(topic)}\n\nCandidates (JSON):\n${JSON.stringify(list)}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "materials", strict: true, schema: materialPickJsonSchema() },
      },
      max_completion_tokens: MATERIAL_LIMITS.pickMaxCompletionTokens,
      reasoning_effort: "low",
    });
    const usage = { input: completion.usage?.prompt_tokens ?? 0, output: completion.usage?.completion_tokens ?? 0 };
    const content = completion.choices[0]?.message.content;
    const parsed = materialPickWireSchema.safeParse(content ? JSON.parse(content) : null);
    const items = parsed.success ? resolve(parsed.data.items, candidates) : [];
    if (items.length === 0) {
      console.error("[materials/pick] La elección no dejó fuentes válidas", { schemaOk: parsed.success });
      return { ok: false, reason: "invalid_output", usage };
    }
    return { ok: true, items, usage };
  } catch (error) {
    console.error("[materials/pick] Fallo al elegir con Groq", { detail: aiErrorDetail(error) });
    return { ok: false, reason: classifyAiError(error), usage: { input: 0, output: 0 } };
  }
}
