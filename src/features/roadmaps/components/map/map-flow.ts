import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { deriveStatus, nodePercent, type NodeStatus, type RoadmapNodeView } from "../../utils/node-status";
import type { Point } from "./map-layout";

export type ConceptNodeData = {
  node: RoadmapNodeView;
  status: NodeStatus;
  percent: number;
  selected: boolean;
  onSelect: (id: string) => void;
};

export type ConceptFlowNode = Node<ConceptNodeData, "concept">;

/** Nodos de React Flow: posición fija (layout) + estado derivado del progreso actual. */
export function buildFlowNodes(
  nodes: readonly RoadmapNodeView[],
  byId: ReadonlyMap<string, RoadmapNodeView>,
  positions: ReadonlyMap<string, Point>,
  selectedId: string | null,
  onSelect: (id: string) => void,
): ConceptFlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: "concept",
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    data: { node, status: deriveStatus(node, byId), percent: nodePercent(node), selected: node.id === selectedId, onSelect },
  }));
}

/**
 * Aristas curvas (bezier). Requisito cumplido: verde y sólida. Pendiente: punteada y tenue.
 * Llevan al nodo seleccionado: se resaltan para mostrar de dónde viene y hacia dónde va.
 */
export function buildFlowEdges(
  nodes: readonly RoadmapNodeView[],
  byId: ReadonlyMap<string, RoadmapNodeView>,
  selectedId: string | null,
): Edge[] {
  return nodes.flatMap((node) =>
    node.requires.map((requiredId) => {
      const satisfied = Boolean(byId.get(requiredId)?.completedAt);
      const highlighted = selectedId !== null && (node.id === selectedId || requiredId === selectedId);
      const color = satisfied ? "var(--success)" : highlighted ? "var(--accent)" : "var(--border-strong)";
      return {
        id: `${requiredId}->${node.id}`,
        source: requiredId,
        target: node.id,
        type: "default",
        animated: highlighted && !satisfied,
        style: { stroke: color, strokeWidth: highlighted ? 2.5 : 2, strokeDasharray: satisfied ? undefined : "6 6" },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
      };
    }),
  );
}
