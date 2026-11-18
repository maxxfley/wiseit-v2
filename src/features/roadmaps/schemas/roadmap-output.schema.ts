import { z } from "zod";
import { AI_LIMITS } from "@/config/ai";
import { DEFAULT_NODE_ICON, DEFAULT_ROADMAP_THEME, NODE_ICONS, ROADMAP_THEMES } from "@/config/roadmap-visuals";

export const DIFFICULTY_LEVELS = ["Básico", "Intermedio", "Avanzado"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

/**
 * Forma que se le exige a Groq (Structured Outputs estricto). Sin longitudes ni conteos:
 * la documentación no garantiza que el modo estricto los soporte, así que se validan abajo.
 * `theme` e `icon` van como texto libre A PROPÓSITO: Groq rechaza con 400 toda la respuesta si
 * el modelo elige un valor fuera de un enum, y un ícono no debe tumbar una ruta. La lista
 * permitida va en el prompt y aquí abajo un valor desconocido cae al de por defecto.
 */
export const roadmapWireSchema = z.object({
  title: z.string(),
  theme: z.string(),
  nodes: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      difficulty: z.enum(DIFFICULTY_LEVELS),
      requires: z.array(z.string()),
      icon: z.string(),
      key_concepts: z.array(z.string()),
      practice: z.string(),
    }),
  ),
});

/** JSON Schema para `response_format` (generado desde Zod: una sola fuente de verdad). */
export function roadmapJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(roadmapWireSchema, { target: "draft-7" });
  return Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "$schema"));
}

export const nodeSchema = z.object({
  id: z.string().trim().min(1).max(20),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1500),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  // Referencias crudas: se filtran y validan como grafo en normalize-nodes.ts.
  requires: z.array(z.string().trim().max(20)).max(10),
  // Lo visual nunca invalida una ruta: un valor fuera de la lista cae al de por defecto.
  icon: z.enum(NODE_ICONS).catch(DEFAULT_NODE_ICON),
  key_concepts: z.array(z.string().trim().min(1).max(160)).min(3).max(5),
  practice: z.string().trim().min(1).max(500),
});

/** Validación real de la respuesta: los datos de la IA no son confiables hasta pasar por aquí. */
export const roadmapOutputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  theme: z.enum(ROADMAP_THEMES).catch(DEFAULT_ROADMAP_THEME),
  nodes: z
    .array(nodeSchema)
    .min(AI_LIMITS.minNodes)
    .max(AI_LIMITS.maxNodes)
    .refine((nodes) => DIFFICULTY_LEVELS.every((level) => nodes.filter((n) => n.difficulty === level).length >= 2), {
      message: "La ruta debe incluir al menos 2 pasos de cada nivel.",
    }),
});

export type RoadmapOutput = z.infer<typeof roadmapOutputSchema>;
export type RoadmapNode = RoadmapOutput["nodes"][number];
