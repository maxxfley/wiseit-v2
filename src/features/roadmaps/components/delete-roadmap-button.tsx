"use client"; // <dialog> + useActionState requieren el cliente.

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { deleteRoadmapAction } from "../actions/delete-roadmap";
import { INITIAL_DELETE_STATE } from "../types";

interface DeleteRoadmapButtonProps {
  roadmapId: string;
  title: string;
}

/** Botón + modal de confirmación con `<dialog>` nativo (foco, Esc y backdrop los maneja el navegador). */
export function DeleteRoadmapButton({ roadmapId, title }: DeleteRoadmapButtonProps) {
  const { t: dict, message } = useI18n();
  const t = dict.roadmaps.delete;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(deleteRoadmapAction, INITIAL_DELETE_STATE);

  return (
    <>
      <Button variant="ghost" onClick={() => dialogRef.current?.showModal()} aria-label={format(t.aria, { title })}>
        {t.button}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-title-${roadmapId}`}
        className="m-auto w-[min(92vw,26rem)] rounded-xl border border-border-strong bg-surface-raised p-6 text-body shadow-float backdrop:bg-background/80"
      >
        <h2 id={`delete-title-${roadmapId}`} className="font-display text-xl font-medium text-foreground">
          {t.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {format(t.body, { title })}
        </p>
        {state.status === "error" && state.message ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {message(state.message)}
          </p>
        ) : null}
        <form action={formAction} className="mt-6 flex justify-end gap-2">
          <input type="hidden" name="id" value={roadmapId} />
          <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
            {t.cancel}
          </Button>
          <SubmitButton pendingLabel={t.pending}>{t.button}</SubmitButton>
        </form>
      </dialog>
    </>
  );
}
