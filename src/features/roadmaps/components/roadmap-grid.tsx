import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import type { RoadmapSummary } from "../services/queries";
import { RoadmapCard } from "./roadmap-card";

export async function RoadmapGrid({ roadmaps }: { roadmaps: readonly RoadmapSummary[] }) {
  if (roadmaps.length === 0) {
    const t = (await getDictionary()).roadmaps.list;
    return (
      <Card className="flex flex-col items-start gap-4">
        <p className="text-lg text-foreground">{t.emptyTitle}</p>
        <p className="text-muted-foreground">{t.emptyBody}</p>
        <Link href={localizePath(await getLocale(), ROUTES.dashboard)} className={buttonStyles("primary")}>
          {t.emptyCta}
        </Link>
      </Card>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {roadmaps.map((roadmap) => (
        <li key={roadmap.id} className="flex">
          <div className="w-full">
            <RoadmapCard roadmap={roadmap} />
          </div>
        </li>
      ))}
    </ul>
  );
}
