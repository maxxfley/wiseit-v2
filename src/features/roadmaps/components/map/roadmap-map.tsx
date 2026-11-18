"use client"; // Lienzo interactivo de React Flow: zoom, arrastre y selección de nodos.

import "@xyflow/react/dist/style.css";
import { Background, BackgroundVariant, Controls, ReactFlow, type NodeTypes } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import type { RoadmapTheme } from "@/config/roadmap-visuals";
import { buildExtensionFlow, routeEnds } from "@/features/extensions/components/extension-flow";
import { ExtendNodeCard, GhostNodeCard } from "@/features/extensions/components/extension-flow-nodes";
import { useExtensions } from "@/features/extensions/components/extensions-provider";
import { useI18n } from "@/lib/i18n/provider";
import { deriveStatus, type NodeStatus, type RoadmapNodeView } from "../../utils/node-status";
import { buildFlowEdges, buildFlowNodes } from "./map-flow";
import { layoutPositions } from "./map-layout";
import { MapNodeCard } from "./map-node";
import { MapLegend, OverallProgress } from "./map-overlays";
import { NodePanel } from "./node-panel";
import { useNodeProgress } from "./use-node-progress";

// Fuera del componente: React Flow exige una referencia estable.
const NODE_TYPES: NodeTypes = { concept: MapNodeCard, ghost: GhostNodeCard, extend: ExtendNodeCard };

interface RoadmapMapProps {
  roadmapId: string;
  theme: RoadmapTheme;
  nodes: RoadmapNodeView[];
  canTrackProgress: boolean;
}

export function RoadmapMap({ roadmapId, theme, nodes: serverNodes, canTrackProgress }: RoadmapMapProps) {
  const { t, message } = useI18n();
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
  // "Avanzar más": botón (y temas fantasma del plan gratis) debajo del último tema.
  const { ghosts } = useExtensions();
  const extension = useMemo(() => buildExtensionFlow(positions, routeEnds(serverNodes), ghosts), [positions, serverNodes, ghosts]);
  const allNodes = useMemo(() => [...flowNodes, ...extension.nodes], [flowNodes, extension.nodes]);
  const flowEdges = useMemo(
    () => [...buildFlowEdges(nodes, byId, selectedId), ...extension.edges],
    [nodes, byId, selectedId, extension.edges],
  );

  const counts = useMemo(() => {
    const result: Record<NodeStatus, number> = { completed: 0, in_progress: 0, available: 0, locked: 0 };
    for (const node of nodes) result[deriveStatus(node, byId)]++;
    return result;
  }, [nodes, byId]);

  const selected = selectedId ? byId.get(selectedId) : undefined;
  // Gratis: progreso solo en el primer tema (misma regla que `update_node_progress`).
  const firstOrder = useMemo(() => Math.min(...nodes.map((node) => node.orderIndex)), [nodes]);

  return (
    <div
      data-map-theme={theme}
      className="roadmap-map relative h-[75vh] min-h-[520px] overflow-hidden rounded-2xl border border-border"
    >
      <ReactFlow
        nodes={allNodes}
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
        onNodeClick={(_, node) => node.type === "concept" && select(node.id)}
        onPaneClick={() => select(null)}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="var(--border-strong)" />
        <Controls showInteractive={false} position="bottom-left" aria-label={t.map.zoomControls} />
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
          canTrackProgress={canTrackProgress || selected.orderIndex === firstOrder}
          error={error ? message(error) : null}
          onUpdate={(concepts, markComplete) => update(selected.id, concepts, markComplete)}
          onSelect={select}
          onClose={() => select(null)}
        />
      ) : null}
    </div>
  );
}
