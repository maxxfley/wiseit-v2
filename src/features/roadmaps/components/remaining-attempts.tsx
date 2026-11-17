import { AI_LIMITS } from "@/config/ai";
import { getDictionary } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRemainingGenerations } from "../services/quota";

/** Intentos de hoy que le quedan al usuario. Lee cookies: va dentro de <Suspense>. */
export async function RemainingAttempts() {
  const supabase = await createSupabaseServerClient();
  const remaining = await getRemainingGenerations(supabase);
  if (remaining === null) return null;

  // La plantilla tiene {remaining} y {limit}; {remaining} se resalta, así que se parte en piezas.
  const template = (await getDictionary()).roadmaps.dashboard.remaining;
  const parts = template.split(/(\{remaining\}|\{limit\})/);
  return (
    <p className="text-sm text-muted-foreground">
      {parts.map((part, index) =>
        part === "{remaining}" ? (
          <span key={index} className="font-medium text-foreground">
            {remaining}
          </span>
        ) : part === "{limit}" ? (
          AI_LIMITS.dailyGenerations
        ) : (
          part
        ),
      )}
    </p>
  );
}
