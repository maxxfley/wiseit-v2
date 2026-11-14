import "server-only";
import { createServerClient } from "@supabase/ssr";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";
import { SESSION_COOKIE_OPTIONS, withSessionCookieOptions } from "./cookies";
import { getSupabaseEnv } from "./env";

export interface SessionResult {
  response: NextResponse;
  /** `sub` del JWT verificado, o null si no hay sesión válida. */
  userId: string | null;
}

/**
 * Refresca la sesión (si el token expiró) y devuelve la respuesta con las cookies
 * actualizadas. Usa getClaims(), que VERIFICA la firma del JWT; getSession() no lo hace.
 */
export async function updateSession(request: NextRequest): Promise<SessionResult> {
  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, withSessionCookieOptions(options));
        }
        // Cabeceras anti-caché: evitan que un CDN sirva la sesión de un usuario a otro.
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  if (error && !isAuthSessionMissingError(error)) {
    console.error("[supabase/proxy] Error verificando la sesión", { code: error.code, status: error.status });
  }

  return { response, userId: data?.claims.sub ?? null };
}

/** Redirige conservando las cookies refrescadas por updateSession. */
export function redirectWithSession(destination: URL, sessionResponse: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(destination);
  for (const cookie of sessionResponse.cookies.getAll()) redirect.cookies.set(cookie);
  sessionResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "cache-control" || key.toLowerCase() === "expires") {
      redirect.headers.set(key, value);
    }
  });
  return redirect;
}
