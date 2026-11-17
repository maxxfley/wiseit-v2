"use server";

import { redirect } from "next/navigation";
import { localizedActionPath } from "@/lib/i18n/action-locale";
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
    console.error("[auth/login] Fallo de inicio de sesión", { code: error.code, status: error.status, message: error.message });
    if (error.code === "email_not_confirmed") return formError("emailNotConfirmed");
    if (error.code === "over_request_rate_limit") return formError("rateLimited");
    return formError("invalidCredentials");
  }

  // `next` llega sin idioma (lo quita el proxy); se antepone el de la request.
  redirect(await localizedActionPath(safeRedirect(formData.get("next"))));
}
