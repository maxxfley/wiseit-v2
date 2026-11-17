import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { en } from "@/locales/en";
import { es } from "@/locales/es";
import { ru } from "@/locales/ru";
import type { Dictionary } from "@/locales/types";
import { isLocale, type Locale } from "./config";

// Solo servidor (`next/root-params` falla en el build si se importa desde un Client Component).
const DICTIONARIES: Record<Locale, Dictionary> = { es, en, ru };

/** Idioma de la URL actual (segmento `[lang]`). Uno inválido renderiza el 404. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

/** Diccionario del idioma actual, para Server Components y `generateMetadata`. */
export async function getDictionary(): Promise<Dictionary> {
  return DICTIONARIES[await getLocale()];
}

export function dictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
