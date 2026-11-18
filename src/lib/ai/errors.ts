import "server-only";
import Groq from "groq-sdk";

export type AiFailure = "rate_limited" | "unavailable" | "invalid_output";

/** Clasifica un error de una llamada a Groq (compartido por la generación y la búsqueda de material). */
export function classifyAiError(error: unknown): AiFailure {
  if (error instanceof SyntaxError) return "invalid_output"; // JSON.parse de una respuesta truncada
  // Groq valida el JSON Schema en su servidor y responde 400 si el modelo no lo cumple:
  // es una salida inválida del modelo, no una caída del servicio.
  if (error instanceof Groq.BadRequestError && error.message.includes("json_validate_failed")) return "invalid_output";
  if (error instanceof Groq.RateLimitError) return "rate_limited";
  return "unavailable";
}

/** Detalle seguro para el log (sin el cuerpo de la petición). */
export function aiErrorDetail(error: unknown): unknown {
  return error instanceof Groq.APIError ? { status: error.status, message: error.message } : error;
}
