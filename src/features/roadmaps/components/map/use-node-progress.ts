"use client"; // Hooks de estado optimista: solo en el cliente.

import { useCallback, useOptimistic, useState, useTransition } from "react";
import { updateNodeProgressAction } from "../../actions/update-node-progress";
import { applyProgress, type RoadmapNodeView } from "../../utils/node-status";

interface ProgressUpdate {
  nodeId: string;
  completedConcepts: number[];
  markComplete: boolean;
  now: string;
}

function reducer(nodes: RoadmapNodeView[], update: ProgressUpdate): RoadmapNodeView[] {
  return nodes.map((node) =>
    node.id === update.nodeId ? applyProgress(node, update.completedConcepts, update.markComplete, update.now) : node,
  );
}

/**
 * Progreso con UI optimista: el mapa cambia al instante (incluido el desbloqueo de nodos, con
 * las mismas reglas que la base) y, si el servidor rechaza el cambio, vuelve al estado real y
 * muestra el motivo. Al confirmar, `revalidatePath` trae los datos reales del servidor.
 */
export function useNodeProgress(roadmapId: string, serverNodes: RoadmapNodeView[]) {
  const [nodes, applyOptimistic] = useOptimistic(serverNodes, reducer);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (nodeId: string, completedConcepts: number[], markComplete: boolean) => {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ nodeId, completedConcepts, markComplete, now: new Date().toISOString() });
      const result = await updateNodeProgressAction({ roadmapId, nodeId, completedConcepts, markComplete });
      if (!result.ok) setError(result.message);
    });
  };

  const clearError = useCallback(() => setError(null), []);
  return { nodes, update, error, pending, clearError };
}
