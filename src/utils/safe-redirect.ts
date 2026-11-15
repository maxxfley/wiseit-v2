import { ROUTES } from "@/config/routes";

const BASE = "http://wiseit.invalid";

/**
 * Devuelve una ruta interna segura para redirigir tras el login (`?next=`).
 * Rechaza URLs absolutas, `//host`, `/\host`, `javascript:` y caracteres de control,
 * que permitirían un open redirect. Ante cualquier duda, usa `fallback`.
 */
export function safeRedirect(value: unknown, fallback: string = ROUTES.dashboard): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const url = new URL(value, BASE);
    if (url.origin !== BASE) return fallback;
    const normalized = `${url.pathname}${url.search}${url.hash}`;
    // La normalización resuelve `..` y puede dejar `//host` (ej. "/..//evil.com").
    return normalized.startsWith("//") ? fallback : normalized;
  } catch (error) {
    console.warn("[safeRedirect] Ruta inválida descartada", error);
    return fallback;
  }
}
