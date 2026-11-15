"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signupSchema } from "../schemas/auth.schema";
import type { AuthFormState } from "../types";
import { formError, validationError } from "./form-state";

const CHECK_EMAIL_MESSAGE =
  "Si el email es válido, te enviamos un link para confirmar tu cuenta. Revisá tu bandeja de entrada.";

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password });

  if (error) {
    console.error("[auth/signup] Fallo de registro", { code: error.code, status: error.status, message: error.message });
    if (error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit") {
      return formError("Demasiados intentos. Esperá un momento.");
    }
    if (error.code === "weak_password") return formError("Esa contraseña es demasiado débil.");
    return formError("No pudimos completar el registro. Intentá de nuevo más tarde.");
  }

  // Misma respuesta exista o no el email: no se revela qué cuentas están registradas.
  return { status: "success", message: CHECK_EMAIL_MESSAGE };
}
