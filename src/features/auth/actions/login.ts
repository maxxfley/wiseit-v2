"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirect } from "@/utils/safe-redirect";
import { loginSchema } from "../schemas/auth.schema";
import type { AuthFormState } from "../types";
import { formError, validationError } from "./form-state";

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    console.error("[auth/login] Fallo de inicio de sesión", { code: error.code, status: error.status });
    if (error.code === "email_not_confirmed") return formError("Confirmá tu email antes de ingresar.");
    if (error.code === "over_request_rate_limit") return formError("Demasiados intentos. Esperá un momento.");
    return formError("Credenciales inválidas.");
  }

  redirect(safeRedirect(formData.get("next")));
}
