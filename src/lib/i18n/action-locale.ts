import "server-only";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER, type Locale } from "./config";
import { localizePath } from "./paths";

/**
 * Idioma para Server Actions (donde `next/root-params` no está disponible). Lo escribe el proxy
 * a partir de la URL en cada request; si faltara, se usa el idioma por defecto.
 */
export async function getActionLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Ruta interna con el idioma de la request actual, para `redirect()` desde una acción. */
export async function localizedActionPath(path: string): Promise<string> {
  return localizePath(await getActionLocale(), path);
}
