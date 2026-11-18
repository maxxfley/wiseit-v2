/** "Buscar material" (Paso 7c). Valores de negocio centralizados; las cuotas están en config/plans.ts. */
export const MATERIAL_LIMITS = {
  /** Fuentes que se guardan en la caché de cada tema (Premium las ve todas). */
  maxItems: 5,
  /** Fuentes visibles en el plan gratis: la mejor de la misma búsqueda. */
  freeVisibleItems: 1,
  /** Candidatos reales de la búsqueda que se le pasan al modelo para elegir. */
  maxCandidates: 30,
  /** Texto de cada candidato que ve el modelo (recortado: es contenido web no confiable). */
  candidateSnippetChars: 300,
  /** La búsqueda lee páginas: tokens de salida holgados por el razonamiento de gpt-oss. */
  searchMaxCompletionTokens: 4096,
  pickMaxCompletionTokens: 2048,
} as const;

export const MATERIAL_KINDS = ["article", "video", "docs", "forum", "course"] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];
