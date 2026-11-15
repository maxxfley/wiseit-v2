"use client"; // useActionState requiere el cliente.

import { useActionState } from "react";
import { confirmEmailAction } from "../actions/confirm";
import { INITIAL_AUTH_STATE } from "../types";
import { SubmitButton } from "./submit-button";

interface ConfirmFormProps {
  tokenHash: string;
  type: "email" | "signup";
}

/** Botón explícito: el token solo se consume cuando la persona lo pulsa (no al abrir el link). */
export function ConfirmForm({ tokenHash, type }: ConfirmFormProps) {
  const [state, formAction] = useActionState(confirmEmailAction, INITIAL_AUTH_STATE);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      {state.message ? (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Confirmando…" className="w-full">
        Confirmar mi email
      </SubmitButton>
    </form>
  );
}
