import { z } from "zod";
import { DEFAULT_NODE_ICON, NODE_ICONS } from "@/config/roadmap-visuals";

/**
 * `nodes.metadata` es jsonb libre. Las rutas antiguas no traen `key_concepts`, `practice` ni
 * `icon`: cualquier campo ausente o con forma inválida cae al valor por defecto.
 */
export const nodeMetadataSchema = z
  .object({
    key_concepts: z.array(z.string()).catch([]),
    practice: z.string().catch(""),
    icon: z.enum(NODE_ICONS).catch(DEFAULT_NODE_ICON),
  })
  .catch({ key_concepts: [], practice: "", icon: DEFAULT_NODE_ICON });

export type NodeMetadata = z.infer<typeof nodeMetadataSchema>;
