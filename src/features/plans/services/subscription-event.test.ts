import { describe, expect, it } from "vitest";
import { toApplyArgs, type EventMeta, type SubscriptionPayload } from "./subscription-event";

const USER_ID = "11111111-1111-4111-8111-111111111111";

const META: EventMeta = {
  eventId: "evt_01",
  eventType: "subscription.activated",
  occurredAt: "2026-11-18T12:00:00.000Z",
};

function payload(overrides: Partial<SubscriptionPayload> = {}): SubscriptionPayload {
  return {
    id: "sub_01",
    status: "active",
    customerId: "ctm_01",
    customData: { user_id: USER_ID },
    currentBillingPeriod: { endsAt: "2026-12-18T12:00:00.000Z" },
    billingCycle: { interval: "month" },
    scheduledChange: null,
    ...overrides,
  };
}

describe("toApplyArgs", () => {
  it("traduce un evento completo a los argumentos de la RPC", () => {
    expect(toApplyArgs(META, payload())).toEqual({
      p_event_id: "evt_01",
      p_event_type: "subscription.activated",
      p_occurred_at: "2026-11-18T12:00:00.000Z",
      p_user_id: USER_ID,
      p_customer_id: "ctm_01",
      p_subscription_id: "sub_01",
      p_status: "active",
      p_billing_interval: "month",
      p_current_period_end: "2026-12-18T12:00:00.000Z",
      p_cancel_at_period_end: false,
    });
  });

  // El custom_data llega por la red: sin un user_id válido no se asocia el pago a ninguna cuenta.
  it.each([
    ["sin custom_data", null],
    ["sin user_id", { plan: "premium" }],
    ["user_id que no es uuid", { user_id: "admin" }],
    ["user_id numérico", { user_id: 1 }],
  ])("devuelve null %s", (_, customData) => {
    expect(toApplyArgs(META, payload({ customData }))).toBeNull();
  });

  it("acepta el intervalo anual", () => {
    expect(toApplyArgs(META, payload({ billingCycle: { interval: "year" } }))?.p_billing_interval).toBe("year");
  });

  it("deja vacío un intervalo que la columna no acepta", () => {
    expect(toApplyArgs(META, payload({ billingCycle: { interval: "week" } }))?.p_billing_interval).toBeUndefined();
  });

  it("deja vacío el fin de período si Paddle no lo manda", () => {
    expect(toApplyArgs(META, payload({ currentBillingPeriod: null }))?.p_current_period_end).toBeUndefined();
  });

  it("detecta la cancelación programada", () => {
    const args = toApplyArgs(META, payload({ scheduledChange: { action: "cancel" } }));
    expect(args?.p_cancel_at_period_end).toBe(true);
  });

  it("otro cambio programado no es una cancelación", () => {
    const args = toApplyArgs(META, payload({ scheduledChange: { action: "pause" } }));
    expect(args?.p_cancel_at_period_end).toBe(false);
  });
});
