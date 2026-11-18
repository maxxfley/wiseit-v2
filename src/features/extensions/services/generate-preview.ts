import "server-only";
import { EXTENSION_LIMITS } from "@/config/extensions";
import { aiErrorDetail, classifyAiError, type AiFailure } from "@/lib/ai/errors";
import { getGroqClient } from "@/lib/ai/groq";
import type { TokenUsage } from "@/features/roadmaps/services/quota";
import { previewJsonSchema, previewTitlesSchema, previewWireSchema } from "../schemas/extension.schema";
import { buildExtensionUserMessage, buildPreviewSystemPrompt, type ExtensionContext } from "./extension-prompt";

export type PreviewResult =
  | { ok: true; titles: string[]; usage: TokenUsage }
  | { ok: false; reason: AiFailure; usage: TokenUsage };

/** Títulos fantasma del plan gratis: una llamada corta con el modelo gratis (costo mínimo). */
export async function generatePreview(context: ExtensionContext, model: string): Promise<PreviewResult> {
  try {
    const completion = await getGroqClient().chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildPreviewSystemPrompt(context.locale) },
        { role: "user", content: buildExtensionUserMessage(context, false) },
      ],
      response_format: { type: "json_schema", json_schema: { name: "preview", strict: true, schema: previewJsonSchema() } },
      max_completion_tokens: EXTENSION_LIMITS.previewMaxCompletionTokens,
      reasoning_effort: "low",
    });
    const usage = { input: completion.usage?.prompt_tokens ?? 0, output: completion.usage?.completion_tokens ?? 0 };
    const content = completion.choices[0]?.message.content;
    const wire = previewWireSchema.safeParse(content ? JSON.parse(content) : null);
    const titles = previewTitlesSchema.safeParse(wire.success ? wire.data.titles : null);
    if (!titles.success) {
      console.error("[extensions/preview] Títulos inválidos", { wireOk: wire.success });
      return { ok: false, reason: "invalid_output", usage };
    }
    return { ok: true, titles: titles.data, usage };
  } catch (error) {
    console.error("[extensions/preview] Fallo al llamar a Groq", { detail: aiErrorDetail(error) });
    return { ok: false, reason: classifyAiError(error), usage: { input: 0, output: 0 } };
  }
}
