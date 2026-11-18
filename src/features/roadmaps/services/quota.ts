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
 * límite según el plan). Se reserva ANTES de llamar a la IA. Un intento en el que el modelo
 * trabajó y falló se consume (nadie gasta tokens provocando errores); uno que la IA rechazó sin
 * procesarlo se devuelve con `settleAiUsage`.
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

/** Resultado de una llamada a la IA, lo justo para decidir qué hacer con su reserva. */
interface AiOutcome {
  ok: boolean;
  reason?: "rate_limited" | "unavailable" | "invalid_output";
  usage: TokenUsage;
}

/**
 * Cierra una reserva según cómo terminó la llamada. Si la IA rechazó el pedido SIN procesarlo
 * ("saturado" o "no disponible", 0 tokens), se devuelve el cupo: no hubo costo y el usuario no lo
 * provocó. En cualquier otro caso se registran modelo y tokens (el intento queda consumido).
 * Devuelve true si el cupo se devolvió.
 */
export async function settleAiUsage(supabase: Client, usageId: string, model: string, outcome: AiOutcome): Promise<boolean> {
  const rejected = !outcome.ok && outcome.reason !== "invalid_output" && outcome.usage.input === 0 && outcome.usage.output === 0;
  if (!rejected) {
    await recordAiUsage(supabase, usageId, model, outcome.usage);
    return false;
  }
  const { data, error } = await supabase.rpc("release_ai_usage", { p_usage_id: usageId });
  if (error) console.error("[roadmaps/quota] Fallo al devolver el cupo", { code: error.code, message: error.message });
  return data === true;
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
