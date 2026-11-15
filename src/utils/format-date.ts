const formatter = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeZone: "UTC" });

/** Fecha corta en español (UTC, para que servidor y cliente coincidan). */
export function formatDate(iso: string): string {
  return formatter.format(new Date(iso));
}
