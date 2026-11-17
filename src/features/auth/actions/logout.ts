"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { localizedActionPath } from "@/lib/i18n/action-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("[auth/logout] Fallo al cerrar sesión", { code: error.code });
  redirect(await localizedActionPath(ROUTES.home));
}
