"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { localizedActionPath } from "@/lib/i18n/action-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recoveryParamsSchema, resetPasswordSchema } from "../schemas/auth.schema";
import type { AuthFormState } from "../types";
import { formError, validationError } from "./form-state";

/**
 * Valida las contraseñas ANTES de consumir el token (que es de un solo uso), y recién entonces
 * ejecuta verifyOtp + updateUser. Corre como Server Action disparada por un botón: la navegación
 * final es del mismo sitio y la cookie SameSite=Strict viaja.
 */
export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const params = recoveryParamsSchema.safeParse({
    token_hash: formData.get("token_hash"),
    type: formData.get("type"),
  });
  if (!params.success) return formError("recoveryInvalid");

  const passwords = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!passwords.success) return validationError(passwords.error);

  const supabase = await createSupabaseServerClient();
  const verified = await supabase.auth.verifyOtp({ token_hash: params.data.token_hash, type: params.data.type });
  if (verified.error) {
    console.error("[auth/reset] Fallo al verificar el token", { code: verified.error.code, status: verified.error.status, message: verified.error.message });
    return formError("recoveryExpired");
  }

  const { error } = await supabase.auth.updateUser({ password: passwords.data.password });
  if (error) {
    console.error("[auth/reset] Fallo al actualizar la contraseña", { code: error.code, status: error.status, message: error.message });
    // El token ya se consumió: se cierra la sesión de recuperación y se pide un link nuevo.
    await supabase.auth.signOut();
    if (error.code === "same_password") return formError("samePassword");
    return formError("passwordSaveFailed");
  }

  redirect(await localizedActionPath(ROUTES.dashboard));
}
