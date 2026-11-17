"use server";

import type { MessageKey } from "@/locales/types";
import { getCurrentUser } from "@/features/auth/services/session";
import { getPaddle } from "@/lib/paddle/server";
import { getOwnSubscription } from "../services/subscription";

export interface ResumeState {
  status: "idle" | "done" | "error";
  message?: MessageKey;
}

/**
 * Quita la cancelación programada (el usuario se arrepintió antes del fin del período). Solo
 * actúa sobre la suscripción PROPIA (RLS). El cambio vuelve por el webhook `subscription.updated`,
 * que es quien actualiza la base: aquí no se escribe nada localmente.
 */
export async function resumeSubscriptionAction(): Promise<ResumeState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "sessionExpired" };

  const subscription = await getOwnSubscription();
  if (!subscription?.subscriptionId || !subscription.cancelAtPeriodEnd) {
    return { status: "error", message: "resumeFailed" };
  }

  try {
    await getPaddle().subscriptions.update(subscription.subscriptionId, { scheduledChange: null });
    return { status: "done" };
  } catch (error) {
    console.error("[plans/resume] Fallo al reactivar la suscripción", {
      error: error instanceof Error ? error.message : "desconocido",
    });
    return { status: "error", message: "resumeFailed" };
  }
}
