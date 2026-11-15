"use client"; // useActionState requiere el cliente.

import { useActionState } from "react";
import { INITIAL_AUTH_STATE, type AuthAction } from "../types";
import { FormField } from "./form-field";
import { SubmitButton } from "@/components/ui/submit-button";

interface AuthFormProps {
  action: AuthAction;
  submitLabel: string;
  pendingLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  /** Ruta interna validada por el servidor; solo se usa en el login. */
  next?: string;
}

/** Formulario de email + contraseña compartido por login y signup. */
export function AuthForm({ action, submitLabel, pendingLabel, passwordAutoComplete, next }: AuthFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_AUTH_STATE);

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-md border border-border bg-surface-raised p-4 text-foreground">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormField name="email" label="Email" type="email" autoComplete="email" errors={state.fieldErrors?.email} />
      <FormField
        name="password"
        label="Contraseña"
        type="password"
        autoComplete={passwordAutoComplete}
        errors={state.fieldErrors?.password}
      />
      {state.message ? (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      ) : null}
      <SubmitButton pendingLabel={pendingLabel} className="w-full">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
