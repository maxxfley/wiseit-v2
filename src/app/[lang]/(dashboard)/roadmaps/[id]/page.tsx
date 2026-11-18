import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { RoadmapTimeline } from "@/features/roadmaps/components/roadmap-timeline";
import { ExtendSection } from "@/features/extensions/components/extend-section";
import { ExtensionsProvider } from "@/features/extensions/components/extensions-provider";
import { getExtensionAccess } from "@/features/extensions/services/extensions-repo";
import { MaterialsProvider } from "@/features/materials/components/materials-provider";
import { getRoadmapMaterials } from "@/features/materials/services/materials-repo";
import { getIsPremium } from "@/features/plans/services/plan";
import { RoadmapViews } from "@/features/roadmaps/components/roadmap-views";
import { getRoadmapDetail } from "@/features/roadmaps/services/roadmap-detail";
import { format, plural } from "@/lib/i18n/format";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/utils/format-date";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).roadmaps.detail.metaTitle };
}

function LegacyNotice({ text }: { text: string }) {
  return (
    <p role="note" className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
      {text}
    </p>
  );
}

async function RoadmapDetailView({ params }: { params: PageProps<"/[lang]/roadmaps/[id]">["params"] }) {
  const { id } = await params;
  const [roadmap, premium] = await Promise.all([getRoadmapDetail(id), getIsPremium()]);
  if (!roadmap) notFound();
  // Fuentes ya encontradas (recortadas por plan en el servidor) y cupo gratis de "Buscar material".
  const supabase = await createSupabaseServerClient();
  const [materials, extensions] = await Promise.all([
    getRoadmapMaterials(supabase, roadmap.id, premium),
    getExtensionAccess(supabase, roadmap.id, premium),
  ]);
  const locale = await getLocale();
  const t = (await getDictionary()).roadmaps.detail;

  const timeline = <RoadmapTimeline nodes={roadmap.nodes} />;
  return (
    <MaterialsProvider initialItems={materials.byNode} initialAccess={materials.access}>
      <header className="space-y-3">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent">{roadmap.topic}</p>
        <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">{roadmap.title}</h1>
        <p className="text-sm text-muted-foreground">
          {plural(t.topics, roadmap.nodes.length, locale)} · {format(t.created, { date: formatDate(roadmap.createdAt, locale) })}
        </p>
      </header>
      {roadmap.hasGraph ? (
        <ExtensionsProvider roadmapId={roadmap.id} initialAccess={extensions}>
          <RoadmapViews
            roadmapId={roadmap.id}
            theme={roadmap.theme}
            nodes={roadmap.nodes}
            canTrackProgress={premium}
            list={
              <>
                {timeline}
                <ExtendSection />
              </>
            }
          />
        </ExtensionsProvider>
      ) : (
        <>
          <LegacyNotice text={t.legacy} />
          <div className="max-w-3xl">{timeline}</div>
        </>
      )}
    </MaterialsProvider>
  );
}

export default async function RoadmapDetailPage({ params }: PageProps<"/[lang]/roadmaps/[id]">) {
  const t = (await getDictionary()).roadmaps.detail;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <Link href={localizePath(await getLocale(), ROUTES.roadmaps)} className="text-sm text-muted-foreground hover:text-foreground">
        {t.back}
      </Link>
      <Suspense fallback={<Skeleton className="h-[75vh] w-full rounded-xl" />}>
        <RoadmapDetailView params={params} />
      </Suspense>
    </div>
  );
}
