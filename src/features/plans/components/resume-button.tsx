"use client"; // useActionState: confirma la reactivación o muestra el error.

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { useI18n } from "@/lib/i18n/provider";
import { resumeSubscriptionAction, type ResumeState } from "../actions/resume-subscription";
import { AutoRefresh } from "./auto-refresh";

const INITIAL: ResumeState = { status: "idle" };

/** Reactiva una suscripción cancelada. Tras el OK espera al webhook refrescando la página. */
export function ResumeButton({ className }: { className?: string }) {
  const { t, message } = useI18n();
  const [state, action] = useActionState(resumeSubscriptionAction, INITIAL);

  if (state.status === "done") {
    return (
      <div role="status" className="text-sm text-success">
        <p>{t.plans.cancellation.resumed}</p>
        <AutoRefresh intervalMs={2000} maxAttempts={5} slowMessage={t.plans.activation.slow} />
      </div>
    );
  }
  return (
    <form action={action} className="space-y-2">
      <SubmitButton pendingLabel={t.plans.cancellation.resuming} className={className}>
        {t.plans.cancellation.resume}
      </SubmitButton>
      {state.message ? (
        <p role="alert" className="text-sm text-danger">
          {message(state.message)}
        </p>
      ) : null}
    </form>
  );
}
