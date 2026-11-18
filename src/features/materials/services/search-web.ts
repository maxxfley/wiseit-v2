import "server-only";
import { MATERIAL_LIMITS } from "@/config/materials";
import { aiErrorDetail, classifyAiError, type AiFailure } from "@/lib/ai/errors";
import { getGroqClient } from "@/lib/ai/groq";
import type { TokenUsage } from "@/features/roadmaps/services/quota";
import { buildSearchSystemPrompt, buildSearchUserMessage, type MaterialTopic } from "./material-prompt";

/** Un resultado REAL devuelto por la herramienta de búsqueda (no texto escrito por el modelo). */
export interface SearchCandidate {
  url: string;
  title: string;
  snippet: string;
}

export type SearchResult =
  | { ok: true; candidates: SearchCandidate[]; usage: TokenUsage }
  | { ok: false; reason: AiFailure; usage: TokenUsage };

// Páginas del propio buscador (la herramienta las "abre" para leer resultados): no son material.
const IGNORED_HOSTS = new Set(["exa.ai"]);

function normalize(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || IGNORED_HOSTS.has(url.hostname.replace(/^www\./, ""))) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Paso 1: el modelo busca con `browser_search` (herramienta integrada de Groq). Se guardan solo las
 * URLs que devolvió la herramienta en `executed_tools[].search_results`, sin repetir. El texto
 * final del modelo se descarta: no se confía en URLs escritas por él.
 */
export async function searchWeb(topic: MaterialTopic, model: string): Promise<SearchResult> {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSearchSystemPrompt(topic.language) },
        { role: "user", content: buildSearchUserMessage(topic) },
      ],
      tools: [{ type: "browser_search" }],
      tool_choice: "required",
      max_completion_tokens: MATERIAL_LIMITS.searchMaxCompletionTokens,
      reasoning_effort: "low",
    });
    const usage = { input: completion.usage?.prompt_tokens ?? 0, output: completion.usage?.completion_tokens ?? 0 };

    const byUrl = new Map<string, SearchCandidate>();
    for (const tool of completion.choices[0]?.message.executed_tools ?? []) {
      for (const result of tool.search_results?.results ?? []) {
        const url = result.url ? normalize(result.url) : null;
        if (!url || byUrl.has(url)) continue; // El primero gana: el de la búsqueda trae mejor título.
        byUrl.set(url, {
          url,
          title: (result.title ?? "").trim() || new URL(url).hostname,
          snippet: (result.content ?? "").replace(/\s+/g, " ").slice(0, MATERIAL_LIMITS.candidateSnippetChars),
        });
      }
    }
    const candidates = [...byUrl.values()].slice(0, MATERIAL_LIMITS.maxCandidates);
    if (candidates.length === 0) {
      console.error("[materials/search] La búsqueda no devolvió resultados", { model });
      return { ok: false, reason: "invalid_output", usage };
    }
    return { ok: true, candidates, usage };
  } catch (error) {
    console.error("[materials/search] Fallo al buscar con Groq", { detail: aiErrorDetail(error) });
    return { ok: false, reason: classifyAiError(error), usage: { input: 0, output: 0 } };
  }
}
