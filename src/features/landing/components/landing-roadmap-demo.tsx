"use client"; // Solo guarda qué pestaña de la demo está activa.

import { useState, type ReactNode } from "react";
import { MapPreview, type PreviewNode } from "@/features/roadmaps/components/map/map-preview";
import { ViewTabs, type RoadmapView } from "@/features/roadmaps/components/view-tabs";
import { useI18n } from "@/lib/i18n/provider";

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
  // Los títulos son los mismos de la lista: las dos vistas cuentan la misma ruta.
  const nodes = DEMO_NODES.map((node, index) => ({ ...node, title: t.landing.preview.steps[index] ?? "" }));

  return (
    <div className="mt-4 space-y-4">
      <ViewTabs value={view} onChange={setView} className="flex w-full [&>button]:flex-1 [&>button]:justify-center" />
      <div role="tabpanel">{view === "map" ? <MapPreview nodes={nodes} label={t.landing.preview.mapAria} /> : list}</div>
    </div>
  );
}
