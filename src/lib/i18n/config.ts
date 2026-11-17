/** Idiomas soportados. El primero es el idioma por defecto y la fuente de verdad de los textos. */
export const LOCALES = ["es", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

/** Cookie que recuerda el idioma elegido. No es sensible: solo guarda "es" | "en" | "ru". */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Cabecera interna con el idioma de la URL. La escribe el proxy en CADA request (pisando la que
 * pudiera mandar el cliente) y la leen las Server Actions, donde `next/root-params` no funciona.
 */
export const LOCALE_HEADER = "x-wiseit-locale";

/** Nombre de cada idioma en su propio idioma (para el selector). */
export const LOCALE_LABELS: Record<Locale, string> = { es: "Español", en: "English", ru: "Русский" };

/** Nombre del idioma para el prompt de la IA. */
export const LOCALE_AI_NAMES: Record<Locale, string> = { es: "español", en: "English", ru: "русский (Russian)" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.some((locale) => locale === value);
}
