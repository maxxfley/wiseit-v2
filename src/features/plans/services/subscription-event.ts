import "server-only";
import { z } from "zod";
import type { Database } from "@/types/database.types";

/** Forma mínima que comparten todas las notificaciones `subscription.*` del SDK de Paddle. */
export interface SubscriptionPayload {
  id: string;
  status: "active" | "canceled" | "past_due" | "paused" | "trialing";
  customerId: string;
  customData: Record<string, unknown> | null;
  currentBillingPeriod: { endsAt: string } | null;
  billingCycle: { interval: string };
  scheduledChange: { action: string } | null;
}

export interface EventMeta {
  eventId: string;
  eventType: string;
  occurredAt: string;
}

type ApplyArgs = Database["public"]["Functions"]["apply_subscription_event"]["Args"];

// El user_id lo puso NUESTRO servidor al crear la transacción; igual se valida (llega por la red).
const customDataSchema = z.object({ user_id: z.uuid() });

/**
 * Traduce un evento de Paddle a los argumentos de `apply_subscription_event`.
 * Devuelve null si el evento no trae un user_id válido (no se puede asociar a ninguna cuenta).
 */
export function toApplyArgs(meta: EventMeta, subscription: SubscriptionPayload): ApplyArgs | null {
  const custom = customDataSchema.safeParse(subscription.customData);
  if (!custom.success) return null;

  const interval = subscription.billingCycle.interval;
  const periodEnd = subscription.currentBillingPeriod?.endsAt;
  return {
    p_event_id: meta.eventId,
    p_event_type: meta.eventType,
    p_occurred_at: meta.occurredAt,
    p_user_id: custom.data.user_id,
    p_customer_id: subscription.customerId,
    p_subscription_id: subscription.id,
    p_status: subscription.status,
    // La columna solo acepta month/year (los únicos precios que creamos); otro valor queda vacío.
    p_billing_interval: interval === "month" || interval === "year" ? interval : undefined,
    p_current_period_end: periodEnd ?? undefined,
    // Cancelación programada: sigue Premium hasta `current_period_end` (lo resuelve is_premium).
    p_cancel_at_period_end: subscription.scheduledChange?.action === "cancel",
  };
}
