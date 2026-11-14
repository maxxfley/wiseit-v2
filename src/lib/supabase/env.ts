import "server-only";
import { z } from "zod";

const supabaseEnvSchema = z.object({
  // Solo el origen (https://<ref>.supabase.co): supabase-js agrega /rest/v1, /auth/v1, etc.
  NEXT_PUBLIC_SUPABASE_URL: z
    .url({ protocol: /^https?$/ })
    .refine((value) => new URL(value).pathname === "/", {
      message: "Debe ser solo el origen, sin ruta (ej. sin /rest/v1/)",
    }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

let cached: SupabaseEnv | null = null;

/**
 * Lee y valida las variables de Supabase la primera vez que se usan.
 * Si falta alguna o es inválida, falla con un mensaje claro en vez de un error críptico.
 */
export function getSupabaseEnv(): SupabaseEnv {
  if (cached) return cached;

  const parsed = supabaseEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`[supabase/env] Variables de entorno inválidas o ausentes: ${fields}`);
  }

  cached = {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
  return cached;
}
