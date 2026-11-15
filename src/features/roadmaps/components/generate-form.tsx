"use client"; // useActionState requiere el cliente.

import { useActionState } from "react";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { generateRoadmapAction } from "../actions/generate-roadmap";
import { INITIAL_GENERATE_STATE } from "../types";

export function GenerateForm() {
  const [state, formAction] = useActionState(generateRoadmapAction, INITIAL_GENERATE_STATE);

  return (
    <div className="space-y-8">
      <form action={formAction} className="max-w-xl space-y-4" noValidate>
        <div>
          <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-foreground">
            ¿Qué querés aprender?
          </label>
          <Input
            id="topic"
            name="topic"
            required
            maxLength={200}
            placeholder="Ej: PostgreSQL, teoría musical, fotografía…"
            aria-invalid={Boolean(state.fieldErrors?.topic)}
            aria-describedby="topic-error"
          />
          <FieldError id="topic-error" messages={state.fieldErrors?.topic} />
        </div>
        {state.status === "error" && state.message ? (
          <p role="alert" className="text-sm text-danger">
            {state.message}
          </p>
        ) : null}
        <SubmitButton pendingLabel="Generando tu ruta…">Generar ruta</SubmitButton>
      </form>
    </div>
  );
}
