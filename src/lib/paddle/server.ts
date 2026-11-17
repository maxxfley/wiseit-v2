import "server-only";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { getPaddleEnv } from "./env";

let instance: Paddle | null = null;

/** Cliente de la API de Paddle (servidor). Sandbox o producción según `NEXT_PUBLIC_PADDLE_ENV`. */
export function getPaddle(): Paddle {
  if (instance) return instance;
  const env = getPaddleEnv();
  instance = new Paddle(env.PADDLE_API_KEY, {
    environment: env.NEXT_PUBLIC_PADDLE_ENV === "production" ? Environment.production : Environment.sandbox,
  });
  return instance;
}
