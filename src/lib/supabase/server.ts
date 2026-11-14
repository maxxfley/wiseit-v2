import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { SESSION_COOKIE_OPTIONS, withSessionCookieOptions } from "./cookies";
import { getSupabaseEnv } from "./env";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Debe crearse uno por request (nunca reutilizar entre requests).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, withSessionCookieOptions(options));
          }
        } catch (error) {
          // Los Server Components no pueden escribir cookies. Es esperable: el proxy
          // (src/proxy.ts) ya refrescó la sesión antes de renderizar.
          console.warn("[supabase/server] No se pudieron escribir cookies en este contexto", error);
        }
      },
    },
  });
}
