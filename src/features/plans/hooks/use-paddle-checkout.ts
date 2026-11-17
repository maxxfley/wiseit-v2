"use client"; // Paddle.js vive en el navegador.

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { useI18n } from "@/lib/i18n/provider";
import { localizePath } from "@/lib/i18n/paths";
import type { PaddlePublicConfig } from "@/lib/paddle/public-config";

// Tras el pago, Paddle muestra su confirmación; se espera un instante antes de ir al dashboard.
const REDIRECT_DELAY_MS = 1500;

/**
 * Carga Paddle.js (una vez) y expone `open(transactionId)`. Al completarse el pago lleva al
 * dashboard con `?checkout=success`, donde se espera la confirmación del webhook.
 */
export function usePaddleCheckout(config: PaddlePublicConfig | null) {
  const { locale } = useI18n();
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const token = config?.token;
  const environment = config?.environment;

  useEffect(() => {
    if (!token || !environment) return;
    let active = true;
    let instance: Paddle | undefined;
    const successPath = `${localizePath(locale, ROUTES.dashboard)}?checkout=success`;

    initializePaddle({
      token,
      environment,
      checkout: { settings: { displayMode: "overlay", theme: "dark", locale } },
      eventCallback: (event) => {
        if (event.name !== "checkout.completed") return;
        setTimeout(() => {
          instance?.Checkout.close();
          router.push(successPath);
        }, REDIRECT_DELAY_MS);
      },
    })
      .then((loaded) => {
        instance = loaded;
        if (active && loaded) setPaddle(loaded);
      })
      .catch((error: unknown) => {
        console.error("[plans/checkout] No se pudo cargar Paddle.js", error);
      });
    return () => {
      active = false;
    };
  }, [token, environment, locale, router]);

  const open = (transactionId: string, email: string | null) => {
    paddle?.Checkout.open({ transactionId, ...(email ? { customer: { email } } : {}) });
  };

  return { ready: paddle !== null, open };
}
