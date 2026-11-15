import { z } from "zod";
import { AI_LIMITS } from "@/config/ai";

/** Tema pedido por el usuario. Mismos límites que el check de `roadmaps.topic` en la base. */
export const generateInputSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(AI_LIMITS.topicMinLength, "Escribí un tema de al menos 2 caracteres.")
    .max(AI_LIMITS.topicMaxLength, "El tema es demasiado largo (máximo 200 caracteres)."),
});

export type GenerateInput = z.infer<typeof generateInputSchema>;
