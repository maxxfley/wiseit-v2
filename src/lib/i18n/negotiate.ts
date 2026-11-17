import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "./config";

/** Idiomas del header `Accept-Language` ordenados por preferencia (q). Ej.: "ru-RU,ru;q=0.9,en;q=0.8". */
function preferredLanguages(header: string): string[] {
  return header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number.parseFloat(q.slice(2)) : 1;
      return { tag: tag.toLowerCase(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter(({ tag, weight }) => tag !== "" && weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
    .map(({ tag }) => tag);
}

/**
 * Elige el idioma para una URL sin prefijo: primero la cookie (elección explícita), luego el
 * idioma del navegador (solo el subtag principal: "ru-RU" → "ru") y por último el de defecto.
 */
export function negotiateLocale(cookieValue: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  for (const tag of preferredLanguages(acceptLanguage ?? "")) {
    const primary = tag.split("-")[0];
    const match = LOCALES.find((locale) => locale === primary);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}
