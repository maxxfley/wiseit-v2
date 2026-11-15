import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { formatDate } from "@/utils/format-date";
import type { RoadmapSummary } from "../services/queries";
import { DeleteRoadmapButton } from "./delete-roadmap-button";

export function RoadmapCard({ roadmap }: { roadmap: RoadmapSummary }) {
  return (
    <Card className="flex flex-col gap-4 transition-colors hover:border-border-strong">
      <div className="min-w-0 flex-1 space-y-2">
        <p className="truncate font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent">
          {roadmap.topic}
        </p>
        <h3 className="font-display text-xl font-medium tracking-[-0.4px] text-foreground">
          <Link href={`${ROUTES.roadmaps}/${roadmap.id}`} className="hover:text-primary-hover">
            {roadmap.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {roadmap.nodeCount} {roadmap.nodeCount === 1 ? "paso" : "pasos"} · {formatDate(roadmap.createdAt)}
        </p>
      </div>
      <div className="flex justify-end">
        <DeleteRoadmapButton roadmapId={roadmap.id} title={roadmap.title} />
      </div>
    </Card>
  );
}
