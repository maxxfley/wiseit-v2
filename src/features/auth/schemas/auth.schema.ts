import { z } from "zod";

const emailSchema = z.email("Ingresá un email válido.").max(254, "El email es demasiado largo.");

/** 8–72 caracteres (72 es el límite de bcrypt) con al menos una letra y un número. */
const newPasswordSchema = z
  .string()
  .min(8, "Usá al menos 8 caracteres.")
  .max(72, "Usá como máximo 72 caracteres.")
  .regex(/[A-Za-z]/, "Incluí al menos una letra.")
  .regex(/\d/, "Incluí al menos un número.");

/** Login: no se re-valida la fortaleza (solo que venga algo); la verifica Supabase. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresá tu contraseña.").max(72, "La contraseña es demasiado larga."),
});

const passwordPairShape = {
  password: newPasswordSchema,
  confirmPassword: z.string().min(1, "Repetí tu contraseña."),
};

/** Las dos contraseñas deben coincidir; el error se asocia al campo de confirmación. */
function passwordsMatch(data: { password: string; confirmPassword: string }): boolean {
  // Con la confirmación vacía ya avisa `min(1)`; evita duplicar el mensaje.
  return data.confirmPassword === "" || data.password === data.confirmPassword;
}
const MISMATCH = { message: "Las contraseñas no coinciden.", path: ["confirmPassword"] };

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
