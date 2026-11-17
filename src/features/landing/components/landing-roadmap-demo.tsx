"use client"; // Solo guarda qué pestaña de la demo está activa.

import { useState, type ReactNode } from "react";
import { MapPreview, type PreviewNode } from "@/features/roadmaps/components/map/map-preview";
import { ViewTabs, type RoadmapView } from "@/features/roadmaps/components/view-tabs";
import { useI18n } from "@/lib/i18n/provider";
import { useAnimatedHeight } from "../hooks/use-animated-height";

/** Íconos y estados de la ruta de muestra: un tema completado, uno en proceso y uno bloqueado. */
const DEMO_NODES: readonly Omit<PreviewNode, "title">[] = [
  { icon: "data", status: "completed", percent: 100 },
  { icon: "puzzle", status: "in_progress", percent: 0 }, // El % se calcula con los conceptos tildados.
  { icon: "chart", status: "locked", percent: 0 },
];

/** Conceptos tildados del nodo en proceso (de los 3 del diccionario): 2 de 3 → 67%. */
const DEMO_CONCEPTS_DONE = 2;

interface LandingRoadmapDemoProps {
  /** Vista de lista ya renderizada en el servidor. */
  list: ReactNode;
}

/** Demo de la landing: el mismo selector Lista / Mapa que tienen las rutas reales, con un mapa de muestra. */
export function LandingRoadmapDemo({ list }: LandingRoadmapDemoProps) {
  const { t } = useI18n();
  const [view, setView] = useState<RoadmapView>("list");
  const { ref, height } = useAnimatedHeight<HTMLDivElement>();
  // El nodo en proceso se muestra desplegado: sus conceptos explican el porcentaje del anillo.
  const concepts = t.landing.preview.concepts.map((label, index) => ({ label, done: index < DEMO_CONCEPTS_DONE }));
  const percent = Math.round((DEMO_CONCEPTS_DONE / concepts.length) * 100);
  // Los títulos son los mismos de la lista: las dos vistas cuentan la misma ruta.
  const nodes: PreviewNode[] = DEMO_NODES.map((node, index) => {
    const base = { ...node, title: t.landing.preview.steps[index] ?? "" };
    return node.status === "in_progress" ? { ...base, concepts, percent } : base;
  });

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
