import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface OwnSubscription {
  customerId: string | null;
  subscriptionId: string | null;
  status: string;
  billingInterval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Suscripción del usuario actual (RLS: solo la propia), o null si nunca tuvo una.
 * Se usa para el portal del cliente y para reutilizar el customer de Paddle al volver a suscribirse.
 */
export const getOwnSubscription = cache(async (): Promise<OwnSubscription | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("paddle_customer_id, paddle_subscription_id, status, billing_interval, current_period_end, cancel_at_period_end")
    .maybeSingle();
  if (error) {
    console.error("[plans] Fallo al leer la suscripción", { code: error.code, message: error.message });
    return null;
  }
  if (!data) return null;
  return {
    customerId: data.paddle_customer_id,
    subscriptionId: data.paddle_subscription_id,
    status: data.status,
    billingInterval: data.billing_interval,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  };
});
