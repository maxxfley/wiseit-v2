import "server-only";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
}

/**
 * Usuario de la request actual, o null. Usa getClaims() (verifica la firma del JWT);
 * nunca getSession() para autorizar. `cache` evita repetir la lectura en un mismo render.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error && !isAuthSessionMissingError(error)) {
    console.error("[auth/session] Error verificando la sesión", { code: error.code });
  }
  if (!data) return null;

  const { sub, email } = data.claims;
  return { id: sub, email: typeof email === "string" ? email : null };
});
