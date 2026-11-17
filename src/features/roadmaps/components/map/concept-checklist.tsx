"use client"; // Lee los textos desde el contexto de idioma.

import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";

interface ConceptChecklistProps {
  concepts: readonly string[];
  completed: readonly number[];
  disabled: boolean;
  onToggle: (index: number) => void;
}

/** Fondo y texto de una fila de concepto según esté tildada. Lo comparte la demo de la landing. */
export function conceptRowTone(done: boolean): string {
  return done ? "bg-success/10 text-foreground" : "text-body";
}

/** Casilla visual (el `<input>` real queda oculto para lectores de pantalla y teclado). */
export function ConceptBox({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-4.5 shrink-0 place-items-center rounded-xs border transition-colors",
        done ? "border-success bg-success text-background" : "border-border-strong",
      )}
    >
      {done ? <Check className="size-3" strokeWidth={3} /> : null}
    </span>
  );
}

export function ConceptText({ done, children }: { done: boolean; children: string }) {
  return <span className={cn(done && "line-through decoration-success/60")}>{children}</span>;
}

/** Conceptos clave del nodo como checklist: tildarlos todos completa el nodo. */
export function ConceptChecklist({ concepts, completed, disabled, onToggle }: ConceptChecklistProps) {
  const { t } = useI18n();
  if (concepts.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.map.noConcepts}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {concepts.map((concept, index) => {
        const done = completed.includes(index);
        return (
          // Índice como key: la IA puede repetir un concepto y el índice es lo que se guarda en la base.
          <li key={index}>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-2.5 py-2 text-sm transition-colors",
                "has-[:focus-visible]:border-ring",
                conceptRowTone(done),
                !done && "hover:bg-surface-raised",
                disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
              )}
            >
              <input
                type="checkbox"
                checked={done}
                disabled={disabled}
                onChange={() => onToggle(index)}
                className="peer sr-only"
              />
              <ConceptBox done={done} />
              <ConceptText done={done}>{concept}</ConceptText>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
