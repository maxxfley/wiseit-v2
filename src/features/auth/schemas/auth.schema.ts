import { z } from "zod";
import type { ValidationKey } from "@/locales/types";

/** Los mensajes son CLAVES de `validation` (src/locales): el cliente las traduce a su idioma. */
const v = (key: ValidationKey): string => key;

const emailSchema = z.email(v("emailInvalid")).max(254, v("emailTooLong"));

/** 8–72 caracteres (72 es el límite de bcrypt) con al menos una letra y un número. */
const newPasswordSchema = z
  .string()
  .min(8, v("passwordMin"))
  .max(72, v("passwordMax"))
  .regex(/[A-Za-z]/, v("passwordLetter"))
  .regex(/\d/, v("passwordNumber"));

/** Login: no se re-valida la fortaleza (solo que venga algo); la verifica Supabase. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, v("passwordRequired")).max(72, v("passwordTooLong")),
});

const passwordPairShape = {
  password: newPasswordSchema,
  confirmPassword: z.string().min(1, v("confirmRequired")),
};

/** Las dos contraseñas deben coincidir; el error se asocia al campo de confirmación. */
function passwordsMatch(data: { password: string; confirmPassword: string }): boolean {
  // Con la confirmación vacía ya avisa `min(1)`; evita duplicar el mensaje.
  return data.confirmPassword === "" || data.password === data.confirmPassword;
}
const MISMATCH = { message: v("passwordsMismatch"), path: ["confirmPassword"] };

export const signupSchema = z.object({ email: emailSchema, ...passwordPairShape }).refine(passwordsMatch, MISMATCH);

export const forgotPasswordSchema = z.object({ email: emailSchema });

/** Parámetros del link del email de confirmación. Solo los tipos que Wiseit emite. */
export const confirmParamsSchema = z.object({
  token_hash: z.string().min(10).max(512),
  type: z.enum(["email", "signup"]),
});

/** Parámetros del link de recuperación. */
export const recoveryParamsSchema = z.object({
  token_hash: z.string().min(10).max(512),
  type: z.literal("recovery"),
});

export const resetPasswordSchema = z.object(passwordPairShape).refine(passwordsMatch, MISMATCH);
