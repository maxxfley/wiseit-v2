import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { listRoadmaps } from "../services/queries";
import { RoadmapGrid } from "./roadmap-grid";

/** Últimas rutas del usuario para el dashboard. Consulta datos de sesión: va dentro de <Suspense>. */
export async function RecentRoadmaps() {
  const roadmaps = await listRoadmaps(3);
  const t = (await getDictionary()).roadmaps.dashboard;
  return (
    <section aria-labelledby="ultimas-rutas" className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 id="ultimas-rutas" className="font-display text-2xl font-medium tracking-[-0.5px] text-foreground">
          {t.recentHeading}
        </h2>
        {roadmaps.length > 0 ? (
          <Link href={localizePath(await getLocale(), ROUTES.roadmaps)} className="text-sm text-accent hover:text-primary-hover">
            {t.viewAll}
          </Link>
        ) : null}
      </div>
      <RoadmapGrid roadmaps={roadmaps} />
    </section>
  );
}
