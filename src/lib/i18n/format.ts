import type { Locale } from "./config";

/** Formas de plural de CLDR que usan es/en/ru (el ruso necesita one/few/many: 1 тема, 2 темы, 5 тем). */
export interface PluralForms {
  one: string;
  few: string;
  many: string;
  other: string;
}

/** Reemplaza `{nombre}` por su valor: format("Paso {n}", { n: 3 }) → "Paso 3". */
export function format(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  );
}

/** Elige la forma de plural con `Intl.PluralRules` y reemplaza `{count}`. */
export function plural(forms: PluralForms, count: number, locale: Locale): string {
  const category = new Intl.PluralRules(locale).select(count);
  const template =
    category === "one" ? forms.one : category === "few" ? forms.few : category === "many" ? forms.many : forms.other;
  return format(template, { count });
}

/**
 * Traduce un código devuelto por el servidor (mensaje de acción o de validación de Zod).
 * Si el código no existe en la tabla, usa `fallback`: nunca se muestra un código crudo.
 */
export function translateCode(table: Readonly<Record<string, string>>, code: string | undefined, fallback: string): string {
  if (code === undefined) return fallback;
  return Object.hasOwn(table, code) ? (table[code] ?? fallback) : fallback;
}
