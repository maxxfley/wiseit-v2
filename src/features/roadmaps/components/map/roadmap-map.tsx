"use client"; // Lienzo interactivo de React Flow: zoom, arrastre y selección de nodos.

import "@xyflow/react/dist/style.css";
import { Background, BackgroundVariant, Controls, ReactFlow, type NodeTypes } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import type { RoadmapTheme } from "@/config/roadmap-visuals";
import { deriveStatus, type NodeStatus, type RoadmapNodeView } from "../../utils/node-status";
import { buildFlowEdges, buildFlowNodes } from "./map-flow";
import { layoutPositions } from "./map-layout";
import { MapNodeCard } from "./map-node";
import { MapLegend, OverallProgress } from "./map-overlays";
import { NodePanel } from "./node-panel";
import { useNodeProgress } from "./use-node-progress";

// Fuera del componente: React Flow exige una referencia estable.
const NODE_TYPES: NodeTypes = { concept: MapNodeCard };

interface RoadmapMapProps {
  roadmapId: string;
  theme: RoadmapTheme;
  nodes: RoadmapNodeView[];
}

export function RoadmapMap({ roadmapId, theme, nodes: serverNodes }: RoadmapMapProps) {
  const { nodes, update, error, pending, clearError } = useNodeProgress(roadmapId, serverNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const select = useCallback(
    (id: string | null) => {
      clearError();
      setSelectedId(id);
    },
    [clearError],
  );

  // El layout depende solo de la estructura: se recalcula si llegan otros nodos, no al tildar.
  const positions = useMemo(() => layoutPositions(serverNodes), [serverNodes]);
  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const flowNodes = useMemo(
    () => buildFlowNodes(nodes, byId, positions, selectedId, select),
    [nodes, byId, positions, selectedId, select],
  );
  const flowEdges = useMemo(() => buildFlowEdges(nodes, byId, selectedId), [nodes, byId, selectedId]);

  const counts = useMemo(() => {
    const result: Record<NodeStatus, number> = { completed: 0, in_progress: 0, available: 0, locked: 0 };
    for (const node of nodes) result[deriveStatus(node, byId)]++;
    return result;
  }, [nodes, byId]);

  const selected = selectedId ? byId.get(selectedId) : undefined;

  return (
    <div
      data-map-theme={theme}
      className="roadmap-map relative h-[75vh] min-h-[520px] overflow-hidden rounded-2xl border border-border"
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={NODE_TYPES}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.25}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        // Imprescindible: sin onNodeClick (y con nodos no seleccionables ni arrastrables) React Flow
        // les pone pointer-events: none y el clic cae en el lienzo, que cierra el panel.
        onNodeClick={(_, node) => select(node.id)}
        onPaneClick={() => select(null)}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="var(--border-strong)" />
        <Controls showInteractive={false} position="bottom-left" aria-label="Controles de zoom" />
      </ReactFlow>

      <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto">
          <OverallProgress completed={counts.completed} total={nodes.length} />
        </div>
        <div className="pointer-events-auto hidden lg:block">{selected ? null : <MapLegend counts={counts} />}</div>
      </div>

      {selected ? (
        <NodePanel
          node={selected}
          byId={byId}
          pending={pending}
          error={error}
          onUpdate={(concepts, markComplete) => update(selected.id, concepts, markComplete)}
          onSelect={select}
          onClose={() => select(null)}
        />
      ) : null}
    </div>
  );
}
