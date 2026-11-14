import type { NextRequest } from "next/server";
import { ROUTES, isAuthOnlyPath, isProtectedPath } from "@/config/routes";
import { redirectWithSession, updateSession } from "@/lib/supabase/proxy";

/**
 * Proxy de Next.js 16 (antes "middleware"): refresca la sesión en cada request y
 * aplica redirecciones de acceso. NO es la única barrera: cada Server Action y Route
 * Handler verifica al usuario por su cuenta, y RLS protege los datos en la base.
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!userId && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.login;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return redirectWithSession(loginUrl, response);
  }

  if (userId && isAuthOnlyPath(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = ROUTES.dashboard;
    dashboardUrl.search = "";
    return redirectWithSession(dashboardUrl, response);
  }

  return response;
}

export const config = {
  // Excluye assets estáticos para no ejecutar lógica de auth sobre CSS/JS/imágenes.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
