"use server";

import { redirect } from "next/navigation";
import type { MessageKey } from "@/locales/types";
import { getCurrentUser } from "@/features/auth/services/session";
import { getPaddle } from "@/lib/paddle/server";
import { getOwnSubscription } from "../services/subscription";

export interface PortalState {
  message?: MessageKey;
}

/**
 * Abre el portal de cliente de Paddle (cancelar, cambiar tarjeta, ver facturas). La sesión del
 * portal se crea en el servidor con el customer guardado por el webhook: nadie abre el de otro.
 */
export async function openPortalAction(): Promise<PortalState> {
  const user = await getCurrentUser();
  if (!user) return { message: "sessionExpired" };

  const subscription = await getOwnSubscription();
  if (!subscription?.customerId) return { message: "portalFailed" };

  let url: string;
  try {
    const subscriptionIds = subscription.subscriptionId ? [subscription.subscriptionId] : [];
    const session = await getPaddle().customerPortalSessions.create(subscription.customerId, subscriptionIds);
    url = session.urls.general.overview;
  } catch (error) {
    console.error("[plans/portal] Fallo al crear la sesión del portal", {
      error: error instanceof Error ? error.message : "desconocido",
    });
    return { message: "portalFailed" };
  }

  // redirect lanza una excepción interna de Next: fuera del try/catch.
  redirect(url);
}
