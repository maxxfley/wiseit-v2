import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerateFormWithDraft } from "@/features/roadmaps/components/generate-form-with-draft";
import { RecentRoadmaps } from "@/features/roadmaps/components/recent-roadmaps";
import { RemainingAttempts } from "@/features/roadmaps/components/remaining-attempts";
import { RoadmapLimitNotice } from "@/features/roadmaps/components/roadmap-limit-notice";
import { RoadmapListSkeleton } from "@/features/roadmaps/components/roadmap-list-skeleton";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).roadmaps.dashboard.title };
}

/**
 * Tope de ejecución (s) para las Server Actions de esta página (Next lo exige a nivel
 * de página y como literal estático). Peor caso de `generateRoadmapAction`: 2 intentos
 * por salida inválida × 2 llamadas del SDK por timeout × 60 s (`AI_LIMITS`) = 240 s
 * (igual con el modelo Premium: el timeout es por llamada).
 * 300 s es el máximo del plan Hobby de Vercel con Fluid Compute.
 */
export const maxDuration = 300;

export default async function DashboardPage() {
  const t = (await getDictionary()).roadmaps.dashboard;
  return (
    <div className="mx-auto w-full max-w-4xl space-y-12">
      <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">{t.title}</h1>
      <section aria-labelledby="crear-ruta" className="space-y-4">
        <h2 id="crear-ruta" className="font-display text-2xl font-medium tracking-[-0.5px] text-foreground">
          {t.createHeading}
        </h2>
        <Suspense fallback={null}>
          <RoadmapLimitNotice />
        </Suspense>
        {/* Lee la cookie del tema escrito en la landing: con `cacheComponents` debe ir en <Suspense>. */}
        <Suspense fallback={<Skeleton className="h-36 w-full max-w-xl" />}>
          <GenerateFormWithDraft />
        </Suspense>
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
