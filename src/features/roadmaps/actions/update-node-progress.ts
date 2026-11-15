"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nodeProgressInputSchema } from "../schemas/node-progress.schema";

export type NodeProgressResult = { ok: true } | { ok: false; message: string };

// Códigos propios de `update_node_progress` (ver la migración del Paso 6).
const DB_ERRORS: Record<string, string> = {
  WS423: "Este tema está bloqueado: completá antes sus requisitos.",
  WS404: "No encontramos este tema.",
  "22023": "El progreso enviado no es válido.",
};

/**
 * Actualiza el progreso de un nodo. Se llama desde el mapa (no desde un <form>), con la UI
 * optimista; si falla, el cliente revierte. El bloqueo lo hace cumplir la base, no la UI.
 */
export async function updateNodeProgressAction(input: unknown): Promise<NodeProgressResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Tu sesión expiró. Volvé a ingresar." };

  const parsed = nodeProgressInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "El progreso enviado no es válido." };
  const { roadmapId, nodeId, completedConcepts, markComplete } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_node_progress", {
    p_node_id: nodeId,
    p_completed_concepts: completedConcepts,
    p_mark_complete: markComplete,
  });

  if (error) {
    console.error("[roadmaps/progress] Fallo al actualizar el progreso", { code: error.code, message: error.message });
    return { ok: false, message: DB_ERRORS[error.code] ?? "No pudimos guardar tu progreso. Intentá de nuevo." };
  }

  revalidatePath(`${ROUTES.roadmaps}/${roadmapId}`);
  return { ok: true };
}
