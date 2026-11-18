import "server-only";
import type { AiFailure } from "@/lib/ai/errors";
import type { TokenUsage } from "@/features/roadmaps/services/quota";
import type { MaterialItem } from "../schemas/material.schema";
import type { MaterialTopic } from "./material-prompt";
import { pickMaterials } from "./pick-materials";
import { searchWeb } from "./search-web";

export type FindResult =
  | { ok: true; items: MaterialItem[]; usage: TokenUsage }
  | { ok: false; reason: AiFailure; usage: TokenUsage };

/**
 * "Buscar material" en dos pasos, porque `browser_search` no admite Structured Outputs:
 * 1) búsqueda web real; 2) elección validada sobre esos resultados. Los tokens se suman.
 */
export async function findMaterials(topic: MaterialTopic, model: string): Promise<FindResult> {
  const search = await searchWeb(topic, model);
  if (!search.ok) return search;

  const pick = await pickMaterials(topic, search.candidates, model);
  const usage = { input: search.usage.input + pick.usage.input, output: search.usage.output + pick.usage.output };
  return pick.ok ? { ok: true, items: pick.items, usage } : { ok: false, reason: pick.reason, usage };
}
