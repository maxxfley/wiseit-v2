import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { RoadmapTimeline } from "@/features/roadmaps/components/roadmap-timeline";
import { getIsPremium } from "@/features/plans/services/plan";
import { RoadmapViews } from "@/features/roadmaps/components/roadmap-views";
import { getRoadmapDetail } from "@/features/roadmaps/services/roadmap-detail";
import { format, plural } from "@/lib/i18n/format";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";
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
  const locale = await getLocale();
  const t = (await getDictionary()).roadmaps.detail;

  const timeline = <RoadmapTimeline nodes={roadmap.nodes} />;
  return (
    <>
      <header className="space-y-3">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent">{roadmap.topic}</p>
        <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">{roadmap.title}</h1>
        <p className="text-sm text-muted-foreground">
          {plural(t.topics, roadmap.nodes.length, locale)} · {format(t.created, { date: formatDate(roadmap.createdAt, locale) })}
        </p>
      </header>
      {roadmap.hasGraph ? (
        <RoadmapViews
          roadmapId={roadmap.id}
          theme={roadmap.theme}
          nodes={roadmap.nodes}
          canTrackProgress={premium}
          list={timeline}
        />
      ) : (
        <>
          <LegacyNotice text={t.legacy} />
          <div className="max-w-3xl">{timeline}</div>
        </>
      )}
    </>
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
