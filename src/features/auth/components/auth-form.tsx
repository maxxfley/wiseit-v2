"use client"; // useActionState requiere el cliente.

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { translateCode } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
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
  /** Ruta SIN idioma; si se pasa, muestra "¿Olvidaste tu contraseña?" bajo la contraseña. */
  forgotPath?: string;
}

/** Formulario de autenticación configurable, compartido por login, signup y recuperación. */
export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  fields,
  passwordAutoComplete = "new-password",
  passwordLabel,
  hidden = {},
  forgotPath,
}: AuthFormProps) {
  const { t, href } = useI18n();
  const [state, formAction] = useActionState(action, INITIAL_AUTH_STATE);
  // Los errores llegan como claves de validación: se traducen aquí, nunca se muestra la clave.
  const tr = (codes?: readonly string[]) =>
    codes?.map((code) => translateCode(t.validation, code, t.messages.generic));
  const errors = state.fieldErrors;

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-md border border-border bg-surface-raised p-4 text-foreground">
        {state.message ? t.messages[state.message] : null}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {fields.includes("email") ? (
        <FormField name="email" label={t.auth.fields.email} type="email" autoComplete="email" errors={tr(errors?.email)} />
      ) : null}
      {fields.includes("password") ? (
        <div>
          <PasswordField
            name="password"
            label={passwordLabel ?? t.auth.fields.password}
            autoComplete={passwordAutoComplete}
            errors={tr(errors?.password)}
          />
          {forgotPath ? (
            <Link href={href(forgotPath)} className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground">
              {t.auth.fields.forgot}
            </Link>
          ) : null}
        </div>
      ) : null}
      {fields.includes("confirmPassword") ? (
        <PasswordField
          name="confirmPassword"
          label={t.auth.fields.confirmPassword}
          autoComplete="new-password"
          errors={tr(errors?.confirmPassword)}
        />
      ) : null}
      {state.message ? (
        <p role="alert" className="text-sm text-danger">
          {t.messages[state.message]}
        </p>
      ) : null}
      <SubmitButton pendingLabel={pendingLabel} className="w-full">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
