"use client"; // Selector Mapa / Lista con carga diferida del mapa.

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoadmapTheme } from "@/config/roadmap-visuals";
import { cn } from "@/utils/cn";
import type { RoadmapNodeView } from "../utils/node-status";

// React Flow + dagre solo se descargan en esta vista (code-splitting) y no se renderizan en el servidor.
const RoadmapMap = dynamic(() => import("./map/roadmap-map").then((mod) => mod.RoadmapMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[75vh] min-h-[520px] w-full rounded-2xl" />,
});

type View = "map" | "list";

const TABS: { value: View; label: string }[] = [
  { value: "map", label: "Mapa" },
  { value: "list", label: "Lista" },
];

interface RoadmapViewsProps {
  roadmapId: string;
  theme: RoadmapTheme;
  nodes: RoadmapNodeView[];
  /** Vista de lista ya renderizada en el servidor (timeline). */
  list: ReactNode;
}

export function RoadmapViews({ roadmapId, theme, nodes, list }: RoadmapViewsProps) {
  const [view, setView] = useState<View>("map");

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Vista de la ruta" className="inline-flex rounded-md border border-border bg-surface p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={view === tab.value}
            onClick={() => setView(tab.value)}
            className={cn(
              "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              view === tab.value ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {view === "map" ? <RoadmapMap roadmapId={roadmapId} theme={theme} nodes={nodes} /> : list}
      </div>
    </div>
  );
}
