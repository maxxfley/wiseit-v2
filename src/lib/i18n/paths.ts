import { isLocale, type Locale } from "./config";

/** Antepone el idioma a una ruta interna: ("ru", "/dashboard") → "/ru/dashboard"; ("en", "/") → "/en". */
export function localizePath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Separa el idioma de la URL: "/ru/roadmaps/1" → { locale: "ru", path: "/roadmaps/1" }. */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (!isLocale(first)) return { locale: null, path: pathname };
  return { locale: first, path: `/${rest.join("/")}` };
}

/** Misma página en otro idioma (para el selector): "/ru/dashboard" + "en" → "/en/dashboard". */
export function switchLocale(pathname: string, target: Locale): string {
  return localizePath(target, splitLocale(pathname).path);
}
