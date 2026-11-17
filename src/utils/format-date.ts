import type { Locale } from "@/lib/i18n/config";

const formatters = new Map<Locale, Intl.DateTimeFormat>();

/** Fecha corta en el idioma indicado (UTC, para que servidor y cliente coincidan). */
export function formatDate(iso: string, locale: Locale): string {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
    formatters.set(locale, formatter);
  }
  return formatter.format(new Date(iso));
}
