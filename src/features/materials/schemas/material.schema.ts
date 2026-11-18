import { z } from "zod";
import { MATERIAL_KINDS, MATERIAL_LIMITS } from "@/config/materials";

/**
 * Lo que se le pide al modelo al elegir: NÚMEROS de candidato, nunca URLs. Así no puede inventar
 * un link ni colar uno ajeno: la URL sale siempre de los resultados reales de la búsqueda.
 * `kind` va como texto libre (un valor fuera del enum haría que Groq rechace toda la respuesta).
 */
export const materialPickWireSchema = z.object({
  items: z.array(
    z.object({
      candidate: z.number().int(),
      title: z.string(),
      kind: z.string(),
      reason: z.string(),
    }),
  ),
});

export function materialPickJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(materialPickWireSchema, { target: "draft-7" });
  return Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "$schema"));
}

/** Solo https: ni http, ni javascript:, ni data:. */
const httpsUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  });

/** Una fuente ya validada: es lo que se guarda en la caché y lo que ve el cliente. */
export const materialItemSchema = z.object({
  url: httpsUrl,
  title: z.string().trim().min(1).max(160),
  kind: z.enum(MATERIAL_KINDS).catch("article"),
  reason: z.string().trim().max(240).catch(""),
});

export type MaterialItem = z.infer<typeof materialItemSchema>;

/** Lectura de la caché (jsonb): lo que no cumpla el esquema se descarta, no rompe la página. */
export const materialItemsSchema = z
  .array(z.unknown())
  .transform((values) =>
    values
      .map((value) => materialItemSchema.safeParse(value))
      .flatMap((result) => (result.success ? [result.data] : []))
      .slice(0, MATERIAL_LIMITS.maxItems),
  )
  .catch([]);
