import "server-only";
import { AI_LIMITS } from "@/config/ai";
import { EXTENSION_LIMITS } from "@/config/extensions";
import { aiErrorDetail, classifyAiError, type AiFailure } from "@/lib/ai/errors";
import { getGroqClient } from "@/lib/ai/groq";
import type { TokenUsage } from "@/features/roadmaps/services/quota";
import { extensionJsonSchema, extensionOutputSchema, type ExtensionNode } from "../schemas/extension.schema";
import { buildExtensionSystemPrompt, buildExtensionUserMessage, type ExtensionContext } from "./extension-prompt";

export type ExtensionResult =
  | { ok: true; nodes: ExtensionNode[]; usage: TokenUsage }
  | { ok: false; reason: AiFailure; usage: TokenUsage };

async function requestExtension(context: ExtensionContext, model: string, attempt: number): Promise<ExtensionResult> {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildExtensionSystemPrompt(context.locale) },
        { role: "user", content: buildExtensionUserMessage(context, true) },
      ],
      response_format: { type: "json_schema", json_schema: { name: "extension", strict: true, schema: extensionJsonSchema() } },
      max_completion_tokens: EXTENSION_LIMITS.maxCompletionTokens,
      reasoning_effort: "low",
    });
    const usage = { input: completion.usage?.prompt_tokens ?? 0, output: completion.usage?.completion_tokens ?? 0 };
    const content = completion.choices[0]?.message.content;
    const parsed = extensionOutputSchema.safeParse(content ? JSON.parse(content) : null);
    if (!parsed.success) {
      console.error("[extensions/generate] La extensión no cumple el esquema", {
        attempt,
        issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      });
      return { ok: false, reason: "invalid_output", usage };
    }
    return { ok: true, nodes: parsed.data.nodes, usage };
  } catch (error) {
    console.error("[extensions/generate] Fallo al llamar a Groq", { attempt, detail: aiErrorDetail(error) });
    return { ok: false, reason: classifyAiError(error), usage: { input: 0, output: 0 } };
  }
}

/** Genera la extensión; si la salida es inválida se reintenta dentro de la MISMA reserva. */
export async function generateExtension(context: ExtensionContext, model: string): Promise<ExtensionResult> {
  let result = await requestExtension(context, model, 1);
  let usage = result.usage;
  for (let retry = 1; retry <= AI_LIMITS.invalidOutputRetries; retry++) {
    if (result.ok || result.reason !== "invalid_output") break;
    result = await requestExtension(context, model, retry + 1);
    usage = { input: usage.input + result.usage.input, output: usage.output + result.usage.output };
  }
  return { ...result, usage };
}
