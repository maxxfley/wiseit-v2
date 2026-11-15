import dagre from "@dagrejs/dagre";
import type { RoadmapNodeView } from "../../utils/node-status";

export const NODE_WIDTH = 236;
export const NODE_HEIGHT = 92;

export interface Point {
  x: number;
  y: number;
}

/** Desplazamiento determinista por id (siempre el mismo): rompe la rigidez de la grilla. */
function jitter(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return (Math.abs(hash) % 41) - 20;
}

/**
 * Posiciones por capas con dagre (de arriba hacia abajo, prerrequisitos arriba). Solo depende de
 * la ESTRUCTURA (nodos y aristas), no del progreso: el mapa no se reacomoda al tildar conceptos.
 */
export function layoutPositions(nodes: readonly RoadmapNodeView[]): Map<string, Point> {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: "TB", nodesep: 56, ranksep: 100, marginx: 32, marginy: 32 });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const node of nodes) {
    for (const requiredId of node.requires) graph.setEdge(requiredId, node.id);
  }
  dagre.layout(graph);

  return new Map(
    nodes.map((node) => {
      const { x = 0, y = 0 } = graph.node(node.id) ?? {};
      const offset = jitter(node.id);
      return [node.id, { x: x - NODE_WIDTH / 2 + offset, y: y - NODE_HEIGHT / 2 + offset / 3 }];
    }),
  );
}
