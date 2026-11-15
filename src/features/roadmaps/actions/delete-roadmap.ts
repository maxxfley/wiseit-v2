"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roadmapIdSchema } from "../schemas/roadmap-id.schema";
import type { DeleteRoadmapState } from "../types";

const error = (message: string): DeleteRoadmapState => ({ status: "error", message });

export async function deleteRoadmapAction(
  _prev: DeleteRoadmapState,
  formData: FormData,
): Promise<DeleteRoadmapState> {
  const user = await getCurrentUser();
  if (!user) return error("Tu sesión expiró. Volvé a ingresar.");

  const parsed = roadmapIdSchema.safeParse(formData.get("id"));
  if (!parsed.success) return error("Ruta inválida.");

  // RLS limita el borrado al dueño; `select` permite saber si realmente se borró una fila.
  const supabase = await createSupabaseServerClient();
  const { data, error: dbError } = await supabase.from("roadmaps").delete().eq("id", parsed.data).select("id");
  if (dbError) {
    console.error("[roadmaps/delete] Fallo al borrar", { code: dbError.code, message: dbError.message });
    return error("No pudimos eliminar la ruta. Intentá de nuevo.");
  }
  if (data.length === 0) return error("La ruta no existe o ya fue eliminada.");

  // Los nodos caen por ON DELETE CASCADE.
  revalidatePath(ROUTES.roadmaps);
  revalidatePath(ROUTES.dashboard);
  return { status: "idle" };
}
