"use client"; // useActionState requiere el cliente.

import { useActionState, useId } from "react";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { AI_LIMITS } from "@/config/ai";
import { INITIAL_GENERATE_STATE } from "@/features/roadmaps/types";
import { translateCode } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";
import { startWithTopicAction } from "../actions/start-with-topic";

/** Campo "Creá la tuya": guarda el tema y lleva al registro. La validación real ocurre en el servidor. */
export function TopicForm({ className }: { className?: string }) {
  const { t } = useI18n();
  const id = useId(); // Hay dos instancias (escritorio y celular): los ids no pueden repetirse.
  const [state, formAction, pending] = useActionState(startWithTopicAction, INITIAL_GENERATE_STATE);
  const errors = state.fieldErrors?.topic?.map((code) => translateCode(t.validation, code, t.messages.generic));

  return (
    <form action={formAction} noValidate className={className}>
      <label htmlFor={`${id}-topic`} className="sr-only">
        {t.landing.hero.topicLabel}
      </label>
      {/* Sin botón: con un único campo, Enter envía el formulario de forma nativa. */}
      <Input
        id={`${id}-topic`}
        name="topic"
        required
        maxLength={AI_LIMITS.topicMaxLength}
        placeholder={t.landing.hero.topicPlaceholder}
        enterKeyHint="go"
        readOnly={pending}
        aria-busy={pending}
        aria-invalid={Boolean(errors)}
        aria-describedby={`${id}-error`}
        className={cn(pending && "cursor-wait opacity-60")}
      />
      <FieldError id={`${id}-error`} messages={errors} />
    </form>
  );
}
