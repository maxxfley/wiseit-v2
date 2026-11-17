import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_LIMITS, type AiUsageKind } from "@/config/plans";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type QuotaResult = { status: "granted"; usageId: string } | { status: "exhausted" } | { status: "error" };

export interface TokenUsage {
  input: number;
  output: number;
}

/**
 * Reserva un uso del día del tipo pedido (atómico en la base: `reserve_ai_usage`, que elige el
 * límite según el plan). Se reserva ANTES de llamar a la IA: los intentos fallidos también
 * consumen cupo, así nadie puede gastar llamadas sin límite provocando errores.
 */
export async function reserveAiUsage(
  supabase: Client,
  kind: AiUsageKind,
  limits: { free: number; premium: number },
): Promise<QuotaResult> {
  const { data, error } = await supabase.rpc("reserve_ai_usage", {
    p_kind: kind,
    p_free_limit: limits.free,
    p_premium_limit: limits.premium,
  });
  if (error) {
    console.error("[roadmaps/quota] Fallo al reservar cuota", { kind, code: error.code, message: error.message });
    return { status: "error" };
  }
  return data ? { status: "granted", usageId: data } : { status: "exhausted" };
}

/** Guarda modelo y tokens reales de una reserva (para medir el costo). Un fallo solo se registra. */
export async function recordAiUsage(supabase: Client, usageId: string, model: string, usage: TokenUsage): Promise<void> {
  const { error } = await supabase.rpc("record_ai_usage_tokens", {
    p_usage_id: usageId,
    p_model: model,
    p_input_tokens: usage.input,
    p_output_tokens: usage.output,
  });
  if (error) console.error("[roadmaps/quota] Fallo al registrar tokens", { code: error.code, message: error.message });
}

/** Generaciones que le quedan hoy (UTC) según el plan, o null si no se pudo consultar. */
export async function getRemainingGenerations(supabase: Client, premium: boolean): Promise<number | null> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("kind", "generation")
    .gte("created_at", startOfDay.toISOString());
  if (error) {
    console.error("[roadmaps/quota] Fallo al contar intentos", { code: error.code, message: error.message });
    return null;
  }
  return Math.max(0, dailyGenerationLimit(premium) - (count ?? 0));
}

export function dailyGenerationLimit(premium: boolean): number {
  return premium ? PLAN_LIMITS.premium.dailyGenerations : PLAN_LIMITS.free.dailyGenerations;
}

/**
 * ¿Llegó al máximo de rutas guardadas del plan gratis? Se consulta antes de gastar cupo y llamar a
 * la IA; la regla la hace cumplir el trigger `roadmaps_enforce_limit` al guardar.
 */
export async function hasReachedRoadmapLimit(supabase: Client, premium: boolean): Promise<boolean> {
  if (premium) return false;
  const { count, error } = await supabase.from("roadmaps").select("id", { count: "exact", head: true });
  if (error) {
    console.error("[roadmaps/quota] Fallo al contar rutas", { code: error.code, message: error.message });
    return false; // El trigger sigue protegiendo al guardar.
  }
  return (count ?? 0) >= PLAN_LIMITS.free.maxSavedRoadmaps;
}
