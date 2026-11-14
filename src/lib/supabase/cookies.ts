import type { CookieOptions } from "@supabase/ssr";

/**
 * Opciones forzadas en TODAS las cookies de sesión (CLAUDE.md §5).
 * - httpOnly: el JS del navegador no puede leer el token (mitiga robo por XSS).
 *   Consecuencia: no existe cliente Supabase de navegador; todo pasa por el servidor.
 * - secure: solo HTTPS en producción (en desarrollo, http://localhost).
 * - sameSite strict: la cookie no viaja en peticiones iniciadas desde otros sitios (CSRF).
 */
export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

/** Aplica las opciones de seguridad por encima de las que propone la librería. */
export function withSessionCookieOptions(options: CookieOptions): CookieOptions {
  return { ...options, ...SESSION_COOKIE_OPTIONS };
}
