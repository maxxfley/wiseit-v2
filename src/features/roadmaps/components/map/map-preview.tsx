"use client"; // Usa StatusBadge y los textos del contexto de idioma.

import { Fragment } from "react";
import type { NodeIcon } from "@/config/roadmap-visuals";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";
import type { NodeStatus } from "../../utils/node-status";
import { ConceptBox, ConceptText, conceptRowTone } from "./concept-checklist";
import { NodeIconView, STATUS_META } from "./node-visuals";
import { ProgressRing } from "./progress-ring";
import { StatusBadge } from "./status-badge";

export interface PreviewConcept {
  label: string;
  done: boolean;
}

export interface PreviewNode {
  title: string;
  icon: NodeIcon;
  status: NodeStatus;
  percent: number;
  /** Si viene, el nodo se muestra desplegado con su checklist (como el panel de una ruta real). */
  concepts?: readonly PreviewConcept[];
}

/** Arista entre dos nodos: verde y sólida si el requisito está cumplido; punteada si no (igual que map-flow.ts). */
function PreviewEdge({ satisfied }: { satisfied: boolean }) {
  const color = satisfied ? "var(--success)" : "var(--border-strong)";
  return (
    <svg width="16" height="32" viewBox="0 0 16 32" aria-hidden="true" className="mx-auto block">
      <line x1="8" y1="0" x2="8" y2="24" stroke={color} strokeWidth="2" strokeDasharray={satisfied ? undefined : "4 4"} />
      <path d="M3 22 L8 30 L13 22 Z" fill={color} />
    </svg>
  );
}

/** Checklist de solo lectura (la demo no se puede tildar): mismas filas que el panel de una ruta real. */
function PreviewConcepts({ concepts }: { concepts: readonly PreviewConcept[] }) {
  const { t } = useI18n();
  return (
    <ul className="mt-3 space-y-1 border-t border-border pt-3">
      {concepts.map((concept) => (
        <li key={concept.label} className={cn("flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm", conceptRowTone(concept.done))}>
          <ConceptBox done={concept.done} />
          <ConceptText done={concept.done}>{concept.label}</ConceptText>
          {/* El tachado y la casilla son visuales: el estado también se anuncia como texto. */}
          {concept.done ? <span className="sr-only">({t.map.status.completed})</span> : null}
        </li>
      ))}
    </ul>
  );
}

function PreviewNodeCard({ node }: { node: PreviewNode }) {
  const { t } = useI18n();
  return (
    <div className={cn("rounded-xl border bg-surface/90 px-3.5 py-3", STATUS_META[node.status].card)}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background/60">
          <NodeIconView icon={node.icon} className={cn("size-5", node.status === "locked" ? "text-subtle" : "text-accent")} />
        </span>
        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="line-clamp-2 block text-sm font-medium leading-snug text-foreground">{node.title}</span>
          <StatusBadge status={node.status} />
        </span>
        {node.status === "in_progress" ? (
          <ProgressRing percent={node.percent} size={26} label={format(t.map.percentDone, { percent: node.percent })} />
        ) : null}
      </div>
      {node.concepts?.length ? <PreviewConcepts concepts={node.concepts} /> : null}
    </div>
  );
}

interface MapPreviewProps {
  nodes: readonly PreviewNode[];
  label: string;
}

/**
 * Mapa de muestra, estático y sin React Flow: unos pocos nodos en cadena con los mismos estilos que el mapa real.
 * Es liviano a propósito porque vive en la landing (no suma el bundle de React Flow + dagre).
 */
export function MapPreview({ nodes, label }: MapPreviewProps) {
  return (
    <ol
      aria-label={label}
      className="rounded-lg border border-border bg-background/40 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] p-4"
    >
      {nodes.map((node, index) => (
        <Fragment key={node.title}>
          {index > 0 ? (
            <li aria-hidden="true">
              <PreviewEdge satisfied={nodes[index - 1]?.status === "completed"} />
            </li>
          ) : null}
          <li className="animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
            <PreviewNodeCard node={node} />
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
