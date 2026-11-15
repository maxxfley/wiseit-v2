import { z } from "zod";

/** Payload de la acción de progreso. Los límites reflejan los de la base (máx. 10 conceptos). */
export const nodeProgressInputSchema = z.object({
  roadmapId: z.uuid(),
  nodeId: z.uuid(),
  completedConcepts: z.array(z.int().min(0).max(9)).max(10),
  markComplete: z.boolean(),
});

export type NodeProgressInput = z.infer<typeof nodeProgressInputSchema>;
