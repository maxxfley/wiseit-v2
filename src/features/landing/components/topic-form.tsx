"use client"; // useActionState requiere el cliente.

import { ArrowRight } from "lucide-react";
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
      <div className="flex gap-2">
        <Input
          id={`${id}-topic`}
          name="topic"
          required
          maxLength={AI_LIMITS.topicMaxLength}
          placeholder={t.landing.hero.topicPlaceholder}
          aria-invalid={Boolean(errors)}
          aria-describedby={`${id}-error`}
          className="min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={t.landing.hero.topicSubmit}
          title={t.landing.hero.topicSubmit}
          className={cn(
            "grid size-[42px] shrink-0 cursor-pointer place-items-center rounded-sm bg-primary text-primary-foreground",
            "transition-[background-color,box-shadow] duration-200 hover:bg-primary-hover hover:shadow-glow",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60",
          )}
        >
          <ArrowRight aria-hidden="true" className="size-5" />
        </button>
      </div>
      <FieldError id={`${id}-error`} messages={errors} />
    </form>
  );
}
