import type { es } from "./es";

/**
 * Forma de todos los diccionarios. Los otros idiomas se tipan con `Dictionary[...]`: si les falta
 * una clave (o sobra una), `npm run typecheck` falla.
 */
export type Dictionary = typeof es;

/** Claves que puede devolver una Server Action como mensaje. */
export type MessageKey = keyof Dictionary["messages"];

/** Claves que usan los esquemas de Zod como `message`. */
export type ValidationKey = keyof Dictionary["validation"];
