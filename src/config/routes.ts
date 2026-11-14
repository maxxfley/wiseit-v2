/** Rutas de la app centralizadas (evita hardcodear URLs en la lógica). */
export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  roadmaps: "/roadmaps",
} as const;

/** Requieren sesión: sin ella, el proxy redirige a login. */
const PROTECTED_PREFIXES: readonly string[] = [ROUTES.dashboard, ROUTES.roadmaps];

/** Solo para usuarios sin sesión: con ella, el proxy redirige al dashboard. */
const AUTH_ONLY_ROUTES: readonly string[] = [ROUTES.login, ROUTES.signup];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some((route) => matchesPrefix(pathname, route));
}
