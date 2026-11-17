"use client"; // Selector Mapa / Lista con carga diferida del mapa.

import { List, Map as MapIcon, type LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoadmapTheme } from "@/config/roadmap-visuals";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";
import type { RoadmapNodeView } from "../utils/node-status";

// React Flow + dagre solo se descargan en esta vista (code-splitting) y no se renderizan en el servidor.
const RoadmapMap = dynamic(() => import("./map/roadmap-map").then((mod) => mod.RoadmapMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[75vh] min-h-[520px] w-full rounded-2xl" />,
});

type View = "map" | "list";

interface Tab {
  value: View;
  icon: LucideIcon;
  /** Clases según esté activa o no. El Mapa usa el acento morado para invitar a explorarlo. */
  active: string;
  idle: string;
}

const TABS: Tab[] = [
  {
    value: "list",
    icon: List,
    active: "bg-surface-raised text-foreground",
    idle: "text-muted-foreground hover:text-foreground",
  },
  {
    value: "map",
    icon: MapIcon,
    active: "bg-primary text-primary-foreground shadow-glow",
    idle: "bg-primary/15 text-accent hover:bg-primary hover:text-primary-foreground hover:shadow-glow",
  },
];

interface RoadmapViewsProps {
  roadmapId: string;
  theme: RoadmapTheme;
  nodes: RoadmapNodeView[];
  /** Vista de lista ya renderizada en el servidor (timeline). */
  list: ReactNode;
}

export function RoadmapViews({ roadmapId, theme, nodes, list }: RoadmapViewsProps) {
  const { t } = useI18n();
  const [view, setView] = useState<View>("list"); // La lista es la vista inicial; el mapa se carga al pedirlo.

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label={t.roadmaps.views.label} className="inline-flex gap-1 rounded-md border border-border bg-surface p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={view === tab.value}
            onClick={() => setView(tab.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm px-4 py-1.5 text-sm font-medium",
              "transition-[background-color,color,box-shadow] duration-200",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              view === tab.value ? tab.active : tab.idle,
            )}
          >
            <tab.icon aria-hidden="true" className="size-4" />
            {t.roadmaps.views[tab.value]}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {view === "map" ? <RoadmapMap roadmapId={roadmapId} theme={theme} nodes={nodes} /> : list}
      </div>
    </div>
  );
}
