/** "Avanzar más" (Paso 7d). Las cuotas (3 por día, 4 por ruta) están en config/plans.ts. */
export const EXTENSION_LIMITS = {
  minNodes: 3,
  maxNodes: 6,
  /** Un paso nuevo sin requisitos se engancha a los finales actuales de la ruta (hasta este número). */
  attachToEnds: 2,
  /** Títulos "fantasma" del plan gratis. */
  previewTitles: 3,
  /** Plan gratis: generaciones de títulos fantasma por día (1 por ruta; esto frena el abuso). */
  previewDaily: 6,
  maxCompletionTokens: 8192,
  previewMaxCompletionTokens: 1024,
} as const;
