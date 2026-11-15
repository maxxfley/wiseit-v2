import type { Metadata } from "next";
import { Suspense } from "react";
import { RoadmapGrid } from "@/features/roadmaps/components/roadmap-grid";
import { RoadmapListSkeleton } from "@/features/roadmaps/components/roadmap-list-skeleton";
import { listRoadmaps } from "@/features/roadmaps/services/queries";

export const metadata: Metadata = { title: "Mis rutas" };

async function RoadmapList() {
  return <RoadmapGrid roadmaps={await listRoadmaps()} />;
}

export default function RoadmapsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">Mis rutas</h1>
      <Suspense fallback={<RoadmapListSkeleton count={6} />}>
        <RoadmapList />
      </Suspense>
    </div>
  );
}
