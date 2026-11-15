"use client"; // Componente de nodo de React Flow (vive dentro del lienzo, solo en el cliente).

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/utils/cn";
import type { ConceptFlowNode } from "./map-flow";
import { NODE_HEIGHT, NODE_WIDTH } from "./map-layout";
import { NodeIconView, STATUS_META } from "./node-visuals";
import { ProgressRing } from "./progress-ring";
import { StatusBadge } from "./status-badge";

// Los handles solo anclan las aristas: invisibles y sin interacción (el mapa no se edita).
const HANDLE = "!pointer-events-none !size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent";

/** Tarjeta del nodo. Es un <button>: se enfoca con Tab y se abre con Enter/Espacio. */
export function MapNodeCard({ data }: NodeProps<ConceptFlowNode>) {
  const { node, status, percent, selected, onSelect } = data;
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={false} className={HANDLE} />
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        aria-pressed={selected}
        aria-label={`${node.title}. ${STATUS_META[status].label}, ${percent}%`}
        style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
        className={cn(
          "flex items-center gap-3 rounded-xl border bg-surface/90 px-3.5 py-3 text-left backdrop-blur-sm",
          "transition-[border-color,box-shadow,transform,opacity] duration-300 ease-out",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
          STATUS_META[status].card,
          selected && "-translate-y-0.5 bg-surface-raised ring-2 ring-ring",
        )}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background/60">
          <NodeIconView icon={node.icon} className={cn("size-5", status === "locked" ? "text-subtle" : "text-accent")} />
        </span>
        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="line-clamp-2 block text-sm font-medium leading-snug text-foreground">{node.title}</span>
          <StatusBadge status={status} />
        </span>
        {status === "in_progress" ? <ProgressRing percent={percent} size={26} /> : null}
      </button>
      <Handle type="source" position={Position.Bottom} isConnectable={false} className={HANDLE} />
    </>
  );
}
