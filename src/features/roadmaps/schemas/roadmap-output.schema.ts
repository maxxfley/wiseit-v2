import { z } from "zod";
import { AI_LIMITS } from "@/config/ai";

export const DIFFICULTY_LEVELS = ["Básico", "Intermedio", "Avanzado"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

/**
 * Forma que se le exige a Groq (Structured Outputs estricto). Sin longitudes ni conteos:
 * la documentación no garantiza que el modo estricto los soporte, así que se validan abajo.
 */
export const roadmapWireSchema = z.object({
  title: z.string(),
  nodes: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      difficulty: z.enum(DIFFICULTY_LEVELS),
    }),
  ),
});

/** JSON Schema para `response_format` (generado desde Zod: una sola fuente de verdad). */
export function roadmapJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(roadmapWireSchema, { target: "draft-7" });
  return Object.fromEntries(Object.entries(schema).filter(([key]) => key !== "$schema"));
}

const nodeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(1500),
  difficulty: z.enum(DIFFICULTY_LEVELS),
});

/** Validación real de la respuesta: los datos de la IA no son confiables hasta pasar por aquí. */
export const roadmapOutputSchema = z.object({
  title: z.string().trim().min(1).max(200),
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
