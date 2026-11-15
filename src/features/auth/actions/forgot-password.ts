"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "../schemas/auth.schema";
import type { AuthFormState } from "../types";
import { formError, validationError } from "./form-state";

const SENT_MESSAGE =
  "Si el email está registrado, te enviamos un link para restablecer tu contraseña. Revisá tu bandeja de entrada.";

export async function forgotPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createSupabaseServerClient();
  // El link lo arma la plantilla del email ({{ .SiteURL }}/reset-password?token_hash=…), no un redirectTo.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);

  if (error) {
    console.error("[auth/forgot] Fallo al pedir la recuperación", { code: error.code, status: error.status, message: error.message });
    if (error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit") {
      return formError("Demasiados intentos. Esperá un momento.");
    }
    return formError("No pudimos enviar el email. Intentá de nuevo más tarde.");
  }

  // Misma respuesta exista o no el email: no se revela qué cuentas están registradas.
  return { status: "success", message: SENT_MESSAGE };
}
