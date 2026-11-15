/** Límites del motor de generación. Valores de negocio centralizados (no hardcodear en la lógica). */
export const AI_LIMITS = {
  /** Intentos de generación por usuario y día (UTC). Se miden en `ai_usage`, no en rutas guardadas. */
  dailyGenerations: 6,
  topicMinLength: 2,
  topicMaxLength: 200,
  minNodes: 9,
  maxNodes: 18,
  /** Incluye los tokens de razonamiento de gpt-oss, por eso es holgado. */
  maxCompletionTokens: 8192,
  timeoutMs: 60_000,
  maxRetries: 1,
} as const;
