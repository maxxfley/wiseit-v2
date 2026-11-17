/**
 * Cabeceras de seguridad HTTP aplicadas a todas las rutas (OWASP Secure Headers).
 * No incluye una CSP completa: una política estricta con nonces obliga a renderizar
 * todo dinámicamente y choca con `cacheComponents`. Solo se fija `frame-ancestors`.
 */
export const SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  // Fuerza HTTPS durante 2 años, incluidos subdominios. Sin `preload`: inscribir un
  // dominio propio en la lista de precarga es difícil de revertir; se decide al comprarlo.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Impide que el navegador "adivine" el tipo MIME (mitiga ataques por contenido).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al navegar a otro sitio solo se envía el origen, nunca la ruta (que incluye IDs).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desactiva APIs del navegador que la app no usa.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Anti-clickjacking: ningún sitio puede embeber la app. X-Frame-Options cubre navegadores viejos.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
];
