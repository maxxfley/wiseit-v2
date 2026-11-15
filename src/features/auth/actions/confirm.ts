"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { confirmParamsSchema } from "../schemas/auth.schema";
import type { AuthFormState } from "../types";
import { formError } from "./form-state";

/**
 * Consume el token del email (verifyOtp). Corre como Server Action disparada por un botón,
 * así la navegación final es del mismo sitio y la cookie SameSite=Strict viaja.
 */
export async function confirmEmailAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = confirmParamsSchema.safeParse({
    token_hash: formData.get("token_hash"),
    type: formData.get("type"),
  });
  if (!parsed.success) return formError("El link de confirmación no es válido.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.token_hash,
    type: parsed.data.type,
  });

  if (error) {
    console.error("[auth/confirm] Fallo al verificar el token", { code: error.code, status: error.status, message: error.message });
    return formError("El link expiró o ya fue usado. Registrate de nuevo para recibir otro.");
  }

  redirect(ROUTES.dashboard);
}
