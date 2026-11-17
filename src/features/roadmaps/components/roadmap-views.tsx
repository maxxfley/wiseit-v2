"use client"; // Selector Mapa / Lista con carga diferida del mapa.

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RoadmapTheme } from "@/config/roadmap-visuals";
import type { RoadmapNodeView } from "../utils/node-status";
import { ViewTabs, type RoadmapView } from "./view-tabs";

// React Flow + dagre solo se descargan en esta vista (code-splitting) y no se renderizan en el servidor.
const RoadmapMap = dynamic(() => import("./map/roadmap-map").then((mod) => mod.RoadmapMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[75vh] min-h-[520px] w-full rounded-2xl" />,
});

interface RoadmapViewsProps {
  roadmapId: string;
  theme: RoadmapTheme;
  nodes: RoadmapNodeView[];
  /** Premium: puede guardar progreso (el bloqueo real está en la base). */
  canTrackProgress: boolean;
  /** Vista de lista ya renderizada en el servidor (timeline). */
  list: ReactNode;
}

export function RoadmapViews({ roadmapId, theme, nodes, canTrackProgress, list }: RoadmapViewsProps) {
  const [view, setView] = useState<RoadmapView>("list"); // La lista es la vista inicial; el mapa se carga al pedirlo.

  return (
    <div className="space-y-4">
      <ViewTabs value={view} onChange={setView} />
      <div role="tabpanel">
        {view === "map" ? <RoadmapMap roadmapId={roadmapId} theme={theme} nodes={nodes} canTrackProgress={canTrackProgress} /> : list}
      </div>
    </div>
  );
}
