"use client"; // useActionState: muestra el error si no se pudo abrir el portal.

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { useI18n } from "@/lib/i18n/provider";
import { openPortalAction, type PortalState } from "../actions/open-portal";

const INITIAL: PortalState = {};

/** Lleva al portal de cliente de Paddle (la sesión se crea en el servidor). */
export function ManageSubscriptionButton({ className }: { className?: string }) {
  const { t, message } = useI18n();
  const [state, action] = useActionState(openPortalAction, INITIAL);
  return (
    <form action={action} className="space-y-2">
      <SubmitButton pendingLabel={t.plans.cta.manage} className={className}>
        {t.plans.cta.manage}
      </SubmitButton>
      {state.message ? (
        <p role="alert" className="text-sm text-danger">
          {message(state.message)}
        </p>
      ) : null}
    </form>
  );
}
