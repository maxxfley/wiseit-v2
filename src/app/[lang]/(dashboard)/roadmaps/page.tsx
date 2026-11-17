import type { Metadata } from "next";
import { Suspense } from "react";
import { RoadmapGrid } from "@/features/roadmaps/components/roadmap-grid";
import { RoadmapListSkeleton } from "@/features/roadmaps/components/roadmap-list-skeleton";
import { listRoadmaps } from "@/features/roadmaps/services/queries";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).roadmaps.list.title };
}

async function RoadmapList() {
  return <RoadmapGrid roadmaps={await listRoadmaps()} />;
}

export default async function RoadmapsPage() {
  const t = (await getDictionary()).roadmaps.list;
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">{t.title}</h1>
      <Suspense fallback={<RoadmapListSkeleton count={6} />}>
        <RoadmapList />
      </Suspense>
    </div>
  );
}
