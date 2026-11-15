import { z } from "zod";

const emailSchema = z.email("Ingresá un email válido.").max(254, "El email es demasiado largo.");

/** Login: no se re-valida la fortaleza (solo que venga algo); la verifica Supabase. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresá tu contraseña.").max(72, "La contraseña es demasiado larga."),
});

/** Signup: 8–72 caracteres (72 es el límite de bcrypt) con al menos una letra y un número. */
export const signupSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "Usá al menos 8 caracteres.")
    .max(72, "Usá como máximo 72 caracteres.")
    .regex(/[A-Za-z]/, "Incluí al menos una letra.")
    .regex(/\d/, "Incluí al menos un número."),
});

/** Parámetros del link del email. Solo se aceptan los tipos que Wiseit emite. */
export const confirmParamsSchema = z.object({
  token_hash: z.string().min(10).max(512),
  type: z.enum(["email", "signup"]),
});
