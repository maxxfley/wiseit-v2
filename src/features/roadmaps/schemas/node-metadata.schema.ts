import { z } from "zod";

/**
 * `nodes.metadata` es jsonb libre. Las rutas antiguas (p. ej. "Astronomía") no traen
 * `key_concepts` ni `practice`: cualquier campo ausente o con forma inválida cae al valor por defecto.
 */
export const nodeMetadataSchema = z
  .object({
    key_concepts: z.array(z.string()).catch([]),
    practice: z.string().catch(""),
  })
  .catch({ key_concepts: [], practice: "" });

export type NodeMetadata = z.infer<typeof nodeMetadataSchema>;
