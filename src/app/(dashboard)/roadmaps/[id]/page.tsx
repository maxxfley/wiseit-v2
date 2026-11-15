import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { RoadmapTimeline } from "@/features/roadmaps/components/roadmap-timeline";
import { getRoadmapDetail } from "@/features/roadmaps/services/queries";
import { formatDate } from "@/utils/format-date";

export const metadata: Metadata = { title: "Ruta de aprendizaje" };

async function RoadmapDetailView({ params }: { params: PageProps<"/roadmaps/[id]">["params"] }) {
  const { id } = await params;
  const roadmap = await getRoadmapDetail(id);
  if (!roadmap) notFound();

  return (
    <>
      <header className="space-y-3">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent">{roadmap.topic}</p>
        <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">{roadmap.title}</h1>
        <p className="text-sm text-muted-foreground">
          {roadmap.nodes.length} pasos · creada el {formatDate(roadmap.createdAt)}
        </p>
      </header>
      <RoadmapTimeline nodes={roadmap.nodes} />
    </>
  );
}

export default function RoadmapDetailPage({ params }: PageProps<"/roadmaps/[id]">) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <Link href={ROUTES.roadmaps} className="text-sm text-muted-foreground hover:text-foreground">
        ← Mis rutas
      </Link>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <RoadmapDetailView params={params} />
      </Suspense>
    </div>
  );
}
