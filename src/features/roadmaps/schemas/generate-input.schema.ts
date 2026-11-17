import { z } from "zod";
import { AI_LIMITS } from "@/config/ai";
import type { ValidationKey } from "@/locales/types";

/** Los mensajes son claves de `validation`: el cliente las traduce. */
const v = (key: ValidationKey): string => key;

/** Tema pedido por el usuario. Mismos límites que el check de `roadmaps.topic` en la base. */
export const generateInputSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(AI_LIMITS.topicMinLength, v("topicMin"))
    .max(AI_LIMITS.topicMaxLength, v("topicMax")),
});

export type GenerateInput = z.infer<typeof generateInputSchema>;
