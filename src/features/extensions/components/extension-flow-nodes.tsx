"use client"; // Nodos de React Flow (viven dentro del lienzo, solo en el cliente).

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NODE_WIDTH } from "@/features/roadmaps/components/map/map-layout";
import { ExtendControl } from "./extend-control";
import { EXTEND_WIDTH, type GhostFlowNode } from "./extension-flow";
import { GhostTopic } from "./ghost-topic";

const HANDLE = "!pointer-events-none !size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent";

export function GhostNodeCard({ data }: NodeProps<GhostFlowNode>) {
  return (
    <>
      <Handle type="target" position={Position.Top} isConnectable={false} className={HANDLE} />
      <div style={{ width: NODE_WIDTH }}>
        <GhostTopic title={data.title} />
      </div>
    </>
  );
}

/** `nodrag nopan`: los clics del botón no mueven el lienzo. */
export function ExtendNodeCard() {
  return (
    <div style={{ width: EXTEND_WIDTH }} className="nodrag nopan rounded-xl border border-border bg-surface-raised/90 p-3 backdrop-blur-sm">
      <ExtendControl />
    </div>
  );
}
