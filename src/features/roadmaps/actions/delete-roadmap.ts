"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/config/routes";
import type { MessageKey } from "@/locales/types";
import { getCurrentUser } from "@/features/auth/services/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roadmapIdSchema } from "../schemas/roadmap-id.schema";
import type { DeleteRoadmapState } from "../types";

const error = (message: MessageKey): DeleteRoadmapState => ({ status: "error", message });

export async function deleteRoadmapAction(
  _prev: DeleteRoadmapState,
  formData: FormData,
): Promise<DeleteRoadmapState> {
  const user = await getCurrentUser();
  if (!user) return error("sessionExpired");

  const parsed = roadmapIdSchema.safeParse(formData.get("id"));
  if (!parsed.success) return error("roadmapInvalid");

  // RLS limita el borrado al dueño; `select` permite saber si realmente se borró una fila.
  const supabase = await createSupabaseServerClient();
  const { data, error: dbError } = await supabase.from("roadmaps").delete().eq("id", parsed.data).select("id");
  if (dbError) {
    console.error("[roadmaps/delete] Fallo al borrar", { code: dbError.code, message: dbError.message });
    return error("deleteFailed");
  }
  if (data.length === 0) return error("roadmapGone");

  // Los nodos caen por ON DELETE CASCADE. Se revalida el patrón de ruta: cubre los tres idiomas.
  revalidatePath(`/[lang]${ROUTES.roadmaps}`, "page");
  revalidatePath(`/[lang]${ROUTES.dashboard}`, "page");
  return { status: "idle" };
}
