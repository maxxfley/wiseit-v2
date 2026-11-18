import { z } from "zod";
import { EXTENSION_LIMITS } from "@/config/extensions";
import { nodeSchema } from "@/features/roadmaps/schemas/roadmap-output.schema";

/**
 * Lo que se le pide al modelo para extender: como una ruta, pero sin `difficulty` (los pasos
 * nuevos son siempre "Avanzado") y con `requires` que apunta a pasos existentes ("e3") o a
 * pasos nuevos anteriores ("x1"). Sin longitudes: se validan abajo (ver roadmap-output.schema).
 */
export const extensionWireSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      requires: z.array(z.string()),
      icon: z.string(),
      key_concepts: z.array(z.string()),
      practice: z.string(),
    }),
  ),
});

export const extensionOutputSchema = z.object({
  nodes: z
    .array(nodeSchema.omit({ difficulty: true }))
    .min(EXTENSION_LIMITS.minNodes)
    .max(EXTENSION_LIMITS.maxNodes),
});

export type ExtensionNode = z.infer<typeof extensionOutputSchema>["nodes"][number];

/** Títulos fantasma (plan gratis): solo los nombres de lo que vendría. */
export const previewWireSchema = z.object({ titles: z.array(z.string()) });

export const previewTitlesSchema = z
  .array(z.string().trim().min(1).max(120))
  .min(1)
  .transform((titles) => titles.slice(0, EXTENSION_LIMITS.previewTitles));

/** Lectura de `roadmap_previews.titles` (jsonb): si no cumple, no se muestran fantasmas. */
export const storedPreviewSchema = previewTitlesSchema.catch([]);

function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: "draft-7" });
  return Object.fromEntries(Object.entries(json).filter(([key]) => key !== "$schema"));
}

export const extensionJsonSchema = () => toJsonSchema(extensionWireSchema);
export const previewJsonSchema = () => toJsonSchema(previewWireSchema);
