import Link from "next/link";
import { PLAN_LIMITS } from "@/config/plans";
import { ROUTES } from "@/config/routes";
import { getIsPremium } from "@/features/plans/services/plan";
import { format } from "@/lib/i18n/format";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasReachedRoadmapLimit } from "../services/quota";

/**
 * Plan gratis con el máximo de rutas guardadas: avisa ANTES de que intente generar y lleva a
 * "Mis rutas" para elegir cuál borrar (nunca se borra nada automáticamente). Va en <Suspense>.
 */
export async function RoadmapLimitNotice() {
  const supabase = await createSupabaseServerClient();
  if (!(await hasReachedRoadmapLimit(supabase, await getIsPremium()))) return null;

  const t = (await getDictionary()).roadmaps.dashboard;
  return (
    <div role="note" className="max-w-xl rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-body">
      <p>{format(t.limitNotice, { limit: PLAN_LIMITS.free.maxSavedRoadmaps })}</p>
      <Link href={localizePath(await getLocale(), ROUTES.roadmaps)} className="mt-1 inline-block font-medium text-accent hover:text-primary-hover">
        {t.limitLink}
      </Link>
    </div>
  );
}
