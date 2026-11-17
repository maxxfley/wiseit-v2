"use client"; // Abre el checkout de Paddle: interacción del usuario.

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { PaddlePublicConfig } from "@/lib/paddle/public-config";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/locales/types";
import { createCheckoutAction } from "../actions/create-checkout";
import { usePaddleCheckout } from "../hooks/use-paddle-checkout";
import type { BillingInterval } from "./billing-toggle";

interface CheckoutButtonProps {
  interval: BillingInterval;
  paddle: PaddlePublicConfig | null;
}

/** Pide la transacción al servidor y abre el checkout overlay con ella. */
export function CheckoutButton({ interval, paddle }: CheckoutButtonProps) {
  const { t, message } = useI18n();
  const { ready, open } = usePaddleCheckout(paddle);
  const [error, setError] = useState<MessageKey | null>(null);
  const [pending, startTransition] = useTransition();

  const subscribe = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutAction({ interval });
      if (result.ok) open(result.transactionId, result.email);
      else setError(result.message);
    });
  };

  if (!paddle) return <p className="text-sm text-muted-foreground">{t.plans.notes.unavailable}</p>;
  return (
    <div className="space-y-2">
      <Button onClick={subscribe} disabled={!ready || pending} className="w-full cursor-pointer">
        {pending ? t.plans.cta.loading : t.plans.cta.subscribe}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {message(error)}
        </p>
      ) : null}
    </div>
  );
}
