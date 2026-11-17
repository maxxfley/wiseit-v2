import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * ¿El usuario actual es Premium? Lo decide la base (`is_premium`, con el período pagado y los días
 * de gracia). La UI lo usa solo para mostrar u ocultar: los bloqueos reales están en la base.
 * Ante un error se asume gratis (lo más restrictivo). `cache`: una consulta por request.
 */
export const getIsPremium = cache(async (): Promise<boolean> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("is_premium");
  if (error) {
    console.error("[plans] Fallo al consultar el plan", { code: error.code, message: error.message });
    return false;
  }
  return data === true;
});
