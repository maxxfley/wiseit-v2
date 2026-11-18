/**
 * Límites por plan (Paso 7). Valores de negocio centralizados: la base los recibe de aquí
 * (`reserve_ai_usage`) salvo `maxSavedRoadmaps` y los 10 días de gracia de un cobro fallido,
 * que viven en la migración `20261117100000_plans.sql` (si se cambian, cambiar los dos).
 */
export const PLAN_LIMITS = {
  free: {
    /** Generaciones por día (UTC). */
    dailyGenerations: 4,
    /** Rutas guardadas a la vez (trigger `roadmaps_enforce_limit`). */
    maxSavedRoadmaps: 4,
    /** "Buscar material": 1 link por ruta, hasta este total por cuenta, para siempre (7c). */
    materialLinksPerAccount: 4,
  },
  premium: {
    dailyGenerations: 10,
    /** "Buscar material" (7c). */
    dailyMaterialSearches: 15,
    /** "Avanzar más" (7d). */
    dailyExtensions: 3,
    maxExtensionsPerRoadmap: 4,
  },
} as const;

/** Precios de referencia (US$, IVA incluido). Los reales los define Paddle; esto es para mostrar. */
export const PLAN_PRICES = {
  monthly: 4.99,
  yearly: 44.99,
} as const;

export type AiUsageKind = "generation" | "material" | "extension" | "preview";
