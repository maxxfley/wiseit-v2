"use client"; // useActionState requiere el cliente.

import { useActionState } from "react";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { AI_LIMITS } from "@/config/ai";
import { format, translateCode } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { generateRoadmapAction } from "../actions/generate-roadmap";
import { INITIAL_GENERATE_STATE } from "../types";

interface GenerateFormProps {
  /** Tema escrito en la landing antes de registrarse (ya validado en el servidor). */
  defaultTopic?: string;
}

export function GenerateForm({ defaultTopic }: GenerateFormProps) {
  const { t, message } = useI18n();
  const copy = t.roadmaps.dashboard;
  const [state, formAction] = useActionState(generateRoadmapAction, INITIAL_GENERATE_STATE);
  const topicErrors = state.fieldErrors?.topic?.map((code) => translateCode(t.validation, code, t.messages.generic));

  return (
    <div className="space-y-8">
      <form action={formAction} className="max-w-xl space-y-4" noValidate>
        <div>
          <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-foreground">
            {copy.topicLabel}
          </label>
          <Input
            id="topic"
            name="topic"
            required
            maxLength={AI_LIMITS.topicMaxLength}
            placeholder={copy.topicPlaceholder}
            defaultValue={defaultTopic}
            aria-invalid={Boolean(topicErrors)}
            aria-describedby={defaultTopic ? "topic-error topic-draft" : "topic-error"}
          />
          {defaultTopic ? (
            <p id="topic-draft" className="mt-1.5 text-sm text-muted-foreground">
              {copy.draftHint}
            </p>
          ) : null}
          <FieldError id="topic-error" messages={topicErrors} />
        </div>
        {state.status === "error" && state.message ? (
          <p role="alert" className="text-sm text-danger">
            {format(message(state.message), { limit: AI_LIMITS.dailyGenerations })}
          </p>
        ) : null}
        <SubmitButton pendingLabel={copy.generating}>{copy.generate}</SubmitButton>
      </form>
    </div>
  );
}
