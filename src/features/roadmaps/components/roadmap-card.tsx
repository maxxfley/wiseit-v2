import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { plural } from "@/lib/i18n/format";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatDate } from "@/utils/format-date";
import type { RoadmapSummary } from "../services/queries";
import { DeleteRoadmapButton } from "./delete-roadmap-button";

export async function RoadmapCard({ roadmap }: { roadmap: RoadmapSummary }) {
  const locale = await getLocale();
  const t = (await getDictionary()).roadmaps.list;
  return (
    <Card className="flex flex-col gap-4 transition-colors hover:border-border-strong">
      <div className="min-w-0 flex-1 space-y-2">
        <p className="truncate font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent">
          {roadmap.topic}
        </p>
        <h3 className="font-display text-xl font-medium tracking-[-0.4px] text-foreground">
          <Link href={localizePath(locale, `${ROUTES.roadmaps}/${roadmap.id}`)} className="hover:text-primary-hover">
            {roadmap.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {plural(t.steps, roadmap.nodeCount, locale)} · {formatDate(roadmap.createdAt, locale)}
        </p>
      </div>
      <div className="flex justify-end">
        <DeleteRoadmapButton roadmapId={roadmap.id} title={roadmap.title} />
      </div>
    </Card>
  );
}
