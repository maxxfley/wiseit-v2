import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerateForm } from "@/features/roadmaps/components/generate-form";
import { RecentRoadmaps } from "@/features/roadmaps/components/recent-roadmaps";
import { RemainingAttempts } from "@/features/roadmaps/components/remaining-attempts";
import { RoadmapListSkeleton } from "@/features/roadmaps/components/roadmap-list-skeleton";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-12">
      <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">Dashboard</h1>
      <section aria-labelledby="crear-ruta" className="space-y-4">
        <h2 id="crear-ruta" className="font-display text-2xl font-medium tracking-[-0.5px] text-foreground">
          Crear una ruta
        </h2>
        <GenerateForm />
        <Suspense fallback={<Skeleton className="h-5 w-48" />}>
          <RemainingAttempts />
        </Suspense>
      </section>
      <Suspense fallback={<RoadmapListSkeleton />}>
        <RecentRoadmaps />
      </Suspense>
    </div>
  );
}
