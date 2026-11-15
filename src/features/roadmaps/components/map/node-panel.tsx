"use client"; // Panel interactivo del nodo seleccionado.

import { X } from "lucide-react";
import { deriveStatus, nodePercent, type RoadmapNodeView } from "../../utils/node-status";
import { ConceptChecklist } from "./concept-checklist";
import { NodePanelActions } from "./node-panel-actions";
import { NodeIconView } from "./node-visuals";
import { StatusBadge } from "./status-badge";

interface NodePanelProps {
  node: RoadmapNodeView;
  byId: ReadonlyMap<string, RoadmapNodeView>;
  pending: boolean;
  error: string | null;
  onUpdate: (completedConcepts: number[], markComplete: boolean) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const SECTION_TITLE = "mb-2 font-mono text-xs font-medium uppercase tracking-[0.6px] text-muted-foreground";

/** Panel lateral (escritorio) u hoja inferior (móvil) con el detalle y el progreso del nodo. */
export function NodePanel({ node, byId, pending, error, onUpdate, onSelect, onClose }: NodePanelProps) {
  const status = deriveStatus(node, byId);
  const percent = nodePercent(node);
  const missing = node.requires
    .map((id) => byId.get(id))
    .filter((req): req is RoadmapNodeView => req !== undefined && !req.completedAt);
  const toggle = (index: number) =>
    onUpdate(
      node.completedConcepts.includes(index)
        ? node.completedConcepts.filter((value) => value !== index)
        : [...node.completedConcepts, index],
      false,
    );

  return (
    <aside
      aria-label={`Detalle: ${node.title}`}
      className={
        "absolute inset-x-0 bottom-0 z-10 max-h-[70%] animate-fade-up overflow-y-auto rounded-t-2xl border-t " +
        "border-border-strong bg-surface-raised/95 p-5 shadow-float backdrop-blur-md " +
        "md:inset-y-4 md:right-4 md:left-auto md:max-h-none md:w-96 md:rounded-2xl md:border"
      }
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-background/60">
          <NodeIconView icon={node.icon} className="size-5 text-accent" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-subtle">{node.difficulty}</p>
          <h2 className="font-display text-xl font-medium leading-tight text-foreground">{node.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel"
          className="rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between">
          <StatusBadge status={status} />
          <span className="text-sm text-muted-foreground">{percent}% completado</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border-strong" aria-hidden="true">
          <div
            className={status === "completed" ? "h-full bg-success transition-[width] duration-500" : "h-full bg-info transition-[width] duration-500"}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-body">{node.description}</p>

      {missing.length > 0 ? (
        <div className="mt-5 rounded-md border border-border bg-background/40 p-3">
          <p className="text-sm text-muted-foreground">Completá antes:</p>
          <ul className="mt-1.5 space-y-1">
            {missing.map((req) => (
              <li key={req.id}>
                <button type="button" onClick={() => onSelect(req.id)} className="text-sm text-accent hover:text-foreground">
                  {req.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="mt-5">
        <h3 className={SECTION_TITLE}>Contenido</h3>
        <ConceptChecklist
          concepts={node.key_concepts}
          completed={node.completedConcepts}
          disabled={status === "locked" || pending}
          onToggle={toggle}
        />
      </section>

      {node.practice ? (
        <section className="mt-5">
          <h3 className={SECTION_TITLE}>Práctica</h3>
          <p className="rounded-md border border-border bg-background/40 p-3 text-sm text-body">{node.practice}</p>
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        <NodePanelActions
          status={status}
          pending={pending}
          onStart={() => onUpdate(node.completedConcepts, false)}
          onComplete={() => onUpdate(node.completedConcepts, true)}
          onReset={() => onUpdate([], false)}
        />
      </div>
    </aside>
  );
}
