import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database.types";
import { getSupabaseEnv } from "./env";

let instance: SupabaseClient<Database> | null = null;

/**
 * Cliente con la SECRET key (saltea RLS). Uso EXCLUSIVO del webhook de Paddle, que no tiene
 * sesión de usuario y es el único que escribe `subscriptions`. Nunca en código de cliente.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (instance) return instance;

  const secret = z.string().min(20).safeParse(process.env.SUPABASE_SECRET_KEY);
  if (!secret.success) throw new Error("[supabase/admin] Falta SUPABASE_SECRET_KEY o es inválida");

  instance = createClient<Database>(getSupabaseEnv().url, secret.data, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return instance;
}
