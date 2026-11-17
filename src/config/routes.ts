/** Rutas de la app centralizadas (evita hardcodear URLs en la lógica). */
export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  roadmaps: "/roadmaps",
  /** Pública: precios y suscripción (Paso 7b). */
  pricing: "/pricing",
} as const;

/** Requieren sesión: sin ella, el proxy redirige a login. */
const PROTECTED_PREFIXES: readonly string[] = [ROUTES.dashboard, ROUTES.roadmaps];

/**
 * Solo para usuarios sin sesión: con ella, el proxy redirige al dashboard.
 * `resetPassword` NO va aquí: el link del email debe funcionar aunque haya una sesión abierta.
 */
const AUTH_ONLY_ROUTES: readonly string[] = [ROUTES.login, ROUTES.signup, ROUTES.forgotPassword];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some((route) => matchesPrefix(pathname, route));
}
