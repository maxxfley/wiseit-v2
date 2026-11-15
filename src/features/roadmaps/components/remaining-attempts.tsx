import { AI_LIMITS } from "@/config/ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRemainingGenerations } from "../services/quota";

/** Intentos de hoy que le quedan al usuario. Lee cookies: va dentro de <Suspense>. */
export async function RemainingAttempts() {
  const supabase = await createSupabaseServerClient();
  const remaining = await getRemainingGenerations(supabase);
  if (remaining === null) return null;

  return (
    <p className="text-sm text-muted-foreground">
      Te quedan <span className="font-medium text-foreground">{remaining}</span> de {AI_LIMITS.dailyGenerations}{" "}
      intentos hoy.
    </p>
  );
}
