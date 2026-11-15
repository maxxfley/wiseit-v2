import "server-only";
import Groq from "groq-sdk";
import { AI_LIMITS } from "@/config/ai";
import { getAiEnv } from "./env";

let client: Groq | null = null;

/** Cliente de Groq reutilizable (no guarda estado por usuario). */
export function getGroqClient(): Groq {
  client ??= new Groq({
    apiKey: getAiEnv().GROQ_API_KEY,
    timeout: AI_LIMITS.timeoutMs,
    maxRetries: AI_LIMITS.maxRetries,
  });
  return client;
}
