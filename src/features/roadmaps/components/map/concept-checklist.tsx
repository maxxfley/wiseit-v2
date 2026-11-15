import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

interface ConceptChecklistProps {
  concepts: readonly string[];
  completed: readonly number[];
  disabled: boolean;
  onToggle: (index: number) => void;
}

/** Conceptos clave del nodo como checklist: tildarlos todos completa el nodo. */
export function ConceptChecklist({ concepts, completed, disabled, onToggle }: ConceptChecklistProps) {
  if (concepts.length === 0) {
    return <p className="text-sm text-muted-foreground">Este tema no tiene conceptos clave cargados.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {concepts.map((concept, index) => {
        const done = completed.includes(index);
        return (
          <li key={concept}>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-2.5 py-2 text-sm transition-colors",
                "has-[:focus-visible]:border-ring",
                done ? "bg-success/10 text-foreground" : "text-body hover:bg-surface-raised",
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
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-4.5 shrink-0 place-items-center rounded-xs border transition-colors",
                  done ? "border-success bg-success text-background" : "border-border-strong",
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span className={cn(done && "line-through decoration-success/60")}>{concept}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
