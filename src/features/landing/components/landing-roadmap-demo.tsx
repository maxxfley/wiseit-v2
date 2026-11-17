"use client"; // Solo guarda qué pestaña de la demo está activa.

import { useState, type ReactNode } from "react";
import { MapPreview, type PreviewNode } from "@/features/roadmaps/components/map/map-preview";
import { ViewTabs, type RoadmapView } from "@/features/roadmaps/components/view-tabs";
import { useI18n } from "@/lib/i18n/provider";
import { useAnimatedHeight } from "../hooks/use-animated-height";

/** Íconos y estados de la ruta de muestra: un tema completado, uno en proceso y uno bloqueado. */
const DEMO_NODES: readonly Omit<PreviewNode, "title">[] = [
  { icon: "data", status: "completed", percent: 100 },
  { icon: "puzzle", status: "in_progress", percent: 60 },
  { icon: "chart", status: "locked", percent: 0 },
];

interface LandingRoadmapDemoProps {
  /** Vista de lista ya renderizada en el servidor. */
  list: ReactNode;
}

/** Demo de la landing: el mismo selector Lista / Mapa que tienen las rutas reales, con un mapa de muestra. */
export function LandingRoadmapDemo({ list }: LandingRoadmapDemoProps) {
  const { t } = useI18n();
  const [view, setView] = useState<RoadmapView>("list");
  const { ref, height } = useAnimatedHeight<HTMLDivElement>();
  // Los títulos son los mismos de la lista: las dos vistas cuentan la misma ruta.
  const nodes = DEMO_NODES.map((node, index) => ({ ...node, title: t.landing.preview.steps[index] ?? "" }));

  return (
    <div className="mt-4 space-y-4">
      <ViewTabs value={view} onChange={setView} className="flex w-full [&>button]:flex-1 [&>button]:justify-center" />
      {/* El alto se anima: el contenido cambia al instante y el recuadro se estira o encoge con suavidad. */}
      <div
        role="tabpanel"
        style={{ height }}
        className="overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <div ref={ref}>{view === "map" ? <MapPreview nodes={nodes} label={t.landing.preview.mapAria} /> : list}</div>
      </div>
    </div>
  );
}
