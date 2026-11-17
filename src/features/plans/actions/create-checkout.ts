"use server";

import { z } from "zod";
import type { MessageKey } from "@/locales/types";
import { getCurrentUser } from "@/features/auth/services/session";
import { getPaddleEnv } from "@/lib/paddle/env";
import { getPaddle } from "@/lib/paddle/server";
import { getIsPremium } from "../services/plan";
import { getOwnSubscription } from "../services/subscription";

export type CheckoutResult =
  | { ok: true; transactionId: string; email: string | null }
  | { ok: false; message: MessageKey };

const inputSchema = z.object({ interval: z.enum(["month", "year"]) });

/**
 * Crea la transacción en Paddle DESDE EL SERVIDOR: el precio sale de nuestras variables de entorno
 * y el `user_id` de la sesión (va en `custom_data` y vuelve en el webhook). El navegador solo
 * recibe el id para abrir el checkout: no puede elegir otro precio ni otra cuenta.
 */
export async function createCheckoutAction(input: unknown): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "sessionExpired" };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "checkoutFailed" };
  if (await getIsPremium()) return { ok: false, message: "alreadyPremium" };

  try {
    const env = getPaddleEnv();
    const priceId = parsed.data.interval === "year" ? env.PADDLE_PRICE_YEARLY : env.PADDLE_PRICE_MONTHLY;
    // Si ya fue cliente (suscripción vencida o cancelada), se reutiliza su customer de Paddle.
    const customerId = (await getOwnSubscription())?.customerId ?? null;

    const transaction = await getPaddle().transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { user_id: user.id },
      ...(customerId ? { customerId } : {}),
    });
    return { ok: true, transactionId: transaction.id, email: customerId ? null : (user.email ?? null) };
  } catch (error) {
    console.error("[plans/checkout] Fallo al crear la transacción", {
      error: error instanceof Error ? error.message : "desconocido",
    });
    return { ok: false, message: "checkoutFailed" };
  }
}
