import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { RoadmapTimeline } from "@/features/roadmaps/components/roadmap-timeline";
import { RoadmapViews } from "@/features/roadmaps/components/roadmap-views";
import { getRoadmapDetail } from "@/features/roadmaps/services/roadmap-detail";
import { formatDate } from "@/utils/format-date";

export const metadata: Metadata = { title: "Ruta de aprendizaje" };

function LegacyNotice() {
  return (
    <p role="note" className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
      Esta ruta es anterior al mapa interactivo, así que solo se muestra como lista. Generala de nuevo para verla como
      mapa y registrar tu progreso.
    </p>
  );
}

async function RoadmapDetailView({ params }: { params: PageProps<"/roadmaps/[id]">["params"] }) {
  const { id } = await params;
  const roadmap = await getRoadmapDetail(id);
  if (!roadmap) notFound();

  const timeline = <RoadmapTimeline nodes={roadmap.nodes} />;
  return (
    <>
      <header className="space-y-3">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent">{roadmap.topic}</p>
        <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">{roadmap.title}</h1>
        <p className="text-sm text-muted-foreground">
          {roadmap.nodes.length} temas · creada el {formatDate(roadmap.createdAt)}
        </p>
      </header>
      {roadmap.hasGraph ? (
        <RoadmapViews roadmapId={roadmap.id} theme={roadmap.theme} nodes={roadmap.nodes} list={timeline} />
      ) : (
        <>
          <LegacyNotice />
          <div className="max-w-3xl">{timeline}</div>
        </>
      )}
    </>
  );
}

export default function RoadmapDetailPage({ params }: PageProps<"/roadmaps/[id]">) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <Link href={ROUTES.roadmaps} className="text-sm text-muted-foreground hover:text-foreground">
        ← Mis rutas
      </Link>
      <Suspense fallback={<Skeleton className="h-[75vh] w-full rounded-xl" />}>
        <RoadmapDetailView params={params} />
      </Suspense>
    </div>
  );
}
