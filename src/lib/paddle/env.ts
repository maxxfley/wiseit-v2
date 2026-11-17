import "server-only";
import { z } from "zod";

const paddleEnvSchema = z.object({
  PADDLE_API_KEY: z.string().min(20),
  PADDLE_WEBHOOK_SECRET: z.string().min(10),
  PADDLE_PRICE_MONTHLY: z.string().startsWith("pri_"),
  PADDLE_PRICE_YEARLY: z.string().startsWith("pri_"),
  NEXT_PUBLIC_PADDLE_ENV: z.enum(["sandbox", "production"]),
});

export type PaddleEnv = z.infer<typeof paddleEnvSchema>;

let cached: PaddleEnv | null = null;

/** Variables de Paddle (solo servidor). Falla con un mensaje claro si falta alguna. */
export function getPaddleEnv(): PaddleEnv {
  if (cached) return cached;

  const parsed = paddleEnvSchema.safeParse({
    PADDLE_API_KEY: process.env.PADDLE_API_KEY,
    PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,
    PADDLE_PRICE_MONTHLY: process.env.PADDLE_PRICE_MONTHLY,
    PADDLE_PRICE_YEARLY: process.env.PADDLE_PRICE_YEARLY,
    NEXT_PUBLIC_PADDLE_ENV: process.env.NEXT_PUBLIC_PADDLE_ENV,
  });
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`[paddle/env] Variables de entorno inválidas o ausentes: ${fields}`);
  }

  cached = parsed.data;
  return cached;
}
