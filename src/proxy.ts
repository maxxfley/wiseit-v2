import { NextResponse, type NextRequest } from "next/server";
import { ROUTES, isAuthOnlyPath, isProtectedPath } from "@/config/routes";
import { LOCALE_COOKIE, LOCALE_HEADER, type Locale } from "@/lib/i18n/config";
import { negotiateLocale } from "@/lib/i18n/negotiate";
import { localizePath, splitLocale } from "@/lib/i18n/paths";
import { redirectWithSession, updateSession } from "@/lib/supabase/proxy";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Recuerda el idioma de la URL para la próxima visita sin prefijo (ej. el link de un email). */
function rememberLocale(request: NextRequest, response: NextResponse, locale: Locale): NextResponse {
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }
  return response;
}

/**
 * Proxy de Next.js 16 (antes "middleware"):
 * 1. URL sin idioma → redirige a la misma ruta con el idioma elegido (cookie > navegador > "es").
 * 2. Refresca la sesión y aplica las redirecciones de acceso sobre la ruta SIN el prefijo.
 * NO es la única barrera: cada Server Action verifica al usuario y RLS protege los datos.
 */
export async function proxy(request: NextRequest) {
  const { locale, path } = splitLocale(request.nextUrl.pathname);

  if (!locale) {
    const target = negotiateLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"));
    const url = request.nextUrl.clone(); // conserva la query (token_hash de los emails, ?next=…)
    url.pathname = localizePath(target, request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Se pisa SIEMPRE: el cliente no puede inyectar otro idioma en las Server Actions.
  request.headers.set(LOCALE_HEADER, locale);
  const { response, userId } = await updateSession(request);

  if (!userId && isProtectedPath(path)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = localizePath(locale, ROUTES.login);
    loginUrl.search = "";
    loginUrl.searchParams.set("next", path); // sin idioma: el login lo vuelve a anteponer
    return rememberLocale(request, redirectWithSession(loginUrl, response), locale);
  }

  if (userId && isAuthOnlyPath(path)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = localizePath(locale, ROUTES.dashboard);
    dashboardUrl.search = "";
    return rememberLocale(request, redirectWithSession(dashboardUrl, response), locale);
  }

  return rememberLocale(request, response, locale);
}

export const config = {
  // Excluye assets estáticos para no ejecutar lógica de auth sobre CSS/JS/imágenes.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
