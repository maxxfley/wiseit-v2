import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AI_LIMITS } from "@/config/ai";
import type { Database } from "@/types/database.types";

export type QuotaResult = "granted" | "exhausted" | "error";

/**
 * Reserva un intento de generación del día (atómico en la base: ver `reserve_generation`).
 * Se reserva ANTES de llamar a la IA: los intentos fallidos también consumen cupo, así nadie
 * puede gastar llamadas de forma ilimitada provocando errores.
 */
export async function reserveGeneration(supabase: SupabaseClient<Database>): Promise<QuotaResult> {
  const { data, error } = await supabase.rpc("reserve_generation", {
    p_daily_limit: AI_LIMITS.dailyGenerations,
  });
  if (error) {
    console.error("[roadmaps/quota] Fallo al reservar cuota", { code: error.code, message: error.message });
    return "error";
  }
  return data ? "granted" : "exhausted";
}
