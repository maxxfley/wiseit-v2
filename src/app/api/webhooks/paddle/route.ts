import { EventName, type EventEntity } from "@paddle/paddle-node-sdk";
import { toApplyArgs } from "@/features/plans/services/subscription-event";
import { getPaddleEnv } from "@/lib/paddle/env";
import { getPaddle } from "@/lib/paddle/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const SUBSCRIPTION_EVENTS: ReadonlySet<EventName> = new Set([
  EventName.SubscriptionCreated,
  EventName.SubscriptionActivated,
  EventName.SubscriptionUpdated,
  EventName.SubscriptionTrialing,
  EventName.SubscriptionPastDue,
  EventName.SubscriptionPaused,
  EventName.SubscriptionResumed,
  EventName.SubscriptionCanceled,
]);

type SubscriptionEventName =
  | EventName.SubscriptionCreated
  | EventName.SubscriptionActivated
  | EventName.SubscriptionUpdated
  | EventName.SubscriptionTrialing
  | EventName.SubscriptionPastDue
  | EventName.SubscriptionPaused
  | EventName.SubscriptionResumed
  | EventName.SubscriptionCanceled;
type SubscriptionEvent = Extract<EventEntity, { eventType: SubscriptionEventName }>;

function isSubscriptionEvent(event: EventEntity): event is SubscriptionEvent {
  return SUBSCRIPTION_EVENTS.has(event.eventType);
}

const LOG = "[webhooks/paddle]";

/**
 * Webhook de Paddle. Seguridad: la firma (HMAC con el secreto del destino, sobre el cuerpo CRUDO)
 * se verifica antes de leer nada; sin firma válida, 401. Responde rápido (Paddle espera < 5 s) y
 * con 2xx solo cuando el evento quedó aplicado o descartado a propósito: con 500, Paddle reintenta.
 */
export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("paddle-signature");
  const body = await request.text();
  if (!signature || !body) return new Response("Bad request", { status: 400 });

  let event: EventEntity;
  try {
    event = await getPaddle().webhooks.unmarshal(body, getPaddleEnv().PADDLE_WEBHOOK_SECRET, signature);
  } catch (error) {
    console.warn(`${LOG} Firma inválida o cuerpo ilegible`, { error: error instanceof Error ? error.message : "desconocido" });
    return new Response("Invalid signature", { status: 401 });
  }

  // Solo interesan las suscripciones; el resto se confirma para que Paddle no reintente.
  if (!isSubscriptionEvent(event)) {
    return new Response("Ignored", { status: 200 });
  }

  const meta = { eventId: event.eventId, eventType: event.eventType, occurredAt: event.occurredAt };
  const args = toApplyArgs(meta, event.data);
  if (!args) {
    console.error(`${LOG} Evento sin user_id válido en custom_data`, meta);
    return new Response("Missing user", { status: 200 }); // Reintentar no lo arreglaría.
  }

  const { data, error } = await getSupabaseAdmin().rpc("apply_subscription_event", args);
  if (error) {
    console.error(`${LOG} Fallo al aplicar el evento`, { ...meta, code: error.code, message: error.message });
    return new Response("Error", { status: 500 });
  }

  if (data !== "applied") console.warn(`${LOG} Evento no aplicado`, { ...meta, result: data });
  else console.info(`${LOG} Evento aplicado`, { ...meta, status: args.p_status });
  return new Response("OK", { status: 200 });
}
