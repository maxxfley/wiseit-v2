import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerateForm } from "@/features/roadmaps/components/generate-form";
import { RecentRoadmaps } from "@/features/roadmaps/components/recent-roadmaps";
import { RemainingAttempts } from "@/features/roadmaps/components/remaining-attempts";
import { RoadmapListSkeleton } from "@/features/roadmaps/components/roadmap-list-skeleton";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Tope de ejecución (s) para las Server Actions de esta página (Next lo exige a nivel
 * de página y como literal estático). Peor caso de `generateRoadmapAction`: 2 intentos
 * por salida inválida × 2 llamadas del SDK por timeout × 60 s (`AI_LIMITS`) = 240 s.
 * 300 s es el máximo del plan Hobby de Vercel con Fluid Compute.
 */
export const maxDuration = 300;

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
