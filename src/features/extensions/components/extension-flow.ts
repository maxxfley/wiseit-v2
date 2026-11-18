import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { NODE_HEIGHT, NODE_WIDTH, type Point } from "@/features/roadmaps/components/map/map-layout";
import type { RoadmapNodeView } from "@/features/roadmaps/utils/node-status";

export const EXTEND_WIDTH = 280;
const GAP_Y = 110;
const GHOST_GAP_X = 40;

export type GhostFlowNode = Node<{ title: string }, "ghost">;
export type ExtendFlowNode = Node<Record<string, never>, "extend">;

/** Finales de la ruta: pasos de los que no depende ninguno (ahí se engancha lo que sigue). */
export function routeEnds(nodes: readonly RoadmapNodeView[]): string[] {
  const required = new Set(nodes.flatMap((node) => node.requires));
  return nodes.filter((node) => !required.has(node.id)).map((node) => node.id);
}

/**
 * Nodos extra del mapa, debajo del último tema: los fantasma (gratis, si ya se pidieron) y el
 * botón "Avanzar más". Se ubican a partir del layout real, centrados bajo la ruta.
 */
export function buildExtensionFlow(
  positions: ReadonlyMap<string, Point>,
  ends: readonly string[],
  ghosts: readonly string[],
): { nodes: (GhostFlowNode | ExtendFlowNode)[]; edges: Edge[] } {
  const points = [...positions.values()];
  if (points.length === 0) return { nodes: [], edges: [] };
  const bottom = Math.max(...points.map((point) => point.y)) + NODE_HEIGHT;
  const centerX = (Math.min(...points.map((point) => point.x)) + Math.max(...points.map((point) => point.x)) + NODE_WIDTH) / 2;

  const rowWidth = ghosts.length * NODE_WIDTH + Math.max(0, ghosts.length - 1) * GHOST_GAP_X;
  const ghostNodes: GhostFlowNode[] = ghosts.map((title, index) => ({
    id: `ghost-${index}`,
    type: "ghost",
    position: { x: centerX - rowWidth / 2 + index * (NODE_WIDTH + GHOST_GAP_X), y: bottom + GAP_Y },
    data: { title },
    selectable: false,
  }));
  const edges: Edge[] = ghostNodes.flatMap((ghost, index) => {
    const source = ends[index % Math.max(1, ends.length)];
    if (!source) return [];
    return [{
      id: `${source}->${ghost.id}`,
      source,
      target: ghost.id,
      style: { stroke: "var(--border-strong)", strokeWidth: 1.5, strokeDasharray: "4 6" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--border-strong)", width: 14, height: 14 },
    }];
  });

  const extendY = ghosts.length > 0 ? bottom + GAP_Y * 2 + NODE_HEIGHT : bottom + GAP_Y * 0.8;
  const extend: ExtendFlowNode = {
    id: "extend",
    type: "extend",
    position: { x: centerX - EXTEND_WIDTH / 2, y: extendY },
    data: {},
    selectable: false,
  };
  return { nodes: [...ghostNodes, extend], edges };
}
