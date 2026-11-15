"use client"; // useActionState requiere el cliente.

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { INITIAL_AUTH_STATE, type AuthAction } from "../types";
import { FormField } from "./form-field";
import { PasswordField } from "./password-field";

interface AuthFormProps {
  action: AuthAction;
  submitLabel: string;
  pendingLabel: string;
  /** Campos a mostrar, en orden. */
  fields: readonly ("email" | "password" | "confirmPassword")[];
  passwordAutoComplete?: "current-password" | "new-password";
  passwordLabel?: string;
  /** Valores ocultos (ruta `next` validada, token de recuperación…). */
  hidden?: Readonly<Record<string, string>>;
  /** Si se pasa, muestra el enlace "¿Olvidaste tu contraseña?" bajo la contraseña. */
  forgotHref?: string;
}

/** Formulario de autenticación configurable, compartido por login, signup y recuperación. */
export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  fields,
  passwordAutoComplete = "new-password",
  passwordLabel = "Contraseña",
  hidden = {},
  forgotHref,
}: AuthFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_AUTH_STATE);
  const errors = state.fieldErrors;

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-md border border-border bg-surface-raised p-4 text-foreground">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {fields.includes("email") ? (
        <FormField name="email" label="Email" type="email" autoComplete="email" errors={errors?.email} />
      ) : null}
      {fields.includes("password") ? (
        <div>
          <PasswordField name="password" label={passwordLabel} autoComplete={passwordAutoComplete} errors={errors?.password} />
          {forgotHref ? (
            <Link href={forgotHref} className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground">
              ¿Olvidaste tu contraseña?
            </Link>
          ) : null}
        </div>
      ) : null}
      {fields.includes("confirmPassword") ? (
        <PasswordField
          name="confirmPassword"
          label="Repetí tu contraseña"
          autoComplete="new-password"
          errors={errors?.confirmPassword}
        />
      ) : null}
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
