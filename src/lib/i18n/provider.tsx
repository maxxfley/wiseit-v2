"use client"; // Contexto de React: los Client Components leen el idioma y los textos desde aquí.

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "@/locales/types";
import type { Locale } from "./config";
import { localizePath } from "./paths";

interface I18nValue {
  locale: Locale;
  t: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Lo monta el layout raíz con el diccionario del idioma actual (solo ese, no los tres).
 * Trade-off aceptado: el diccionario viaja una vez en el payload del layout (~15 KB).
 */
interface I18nProviderProps {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}

export function I18nProvider({ locale, dictionary, children }: I18nProviderProps) {
  return <I18nContext.Provider value={{ locale, t: dictionary }}>{children}</I18nContext.Provider>;
}

/** Idioma, textos y un helper para armar links con el prefijo de idioma. */
export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("[i18n] useI18n debe usarse dentro de <I18nProvider>");
  return { ...value, href: (path: string) => localizePath(value.locale, path) };
}
