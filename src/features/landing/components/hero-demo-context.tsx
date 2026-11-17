"use client"; // Estado compartido entre la tarjeta de demo y la columna de texto del hero.

import { createContext, useContext, useState, type ReactNode } from "react";
import type { RoadmapView } from "@/features/roadmaps/components/view-tabs";

interface HeroDemoValue {
  view: RoadmapView;
  setView: (view: RoadmapView) => void;
  /** Se enciende la primera vez que se abre el mapa y queda así: el campo de tema no desaparece. */
  revealed: boolean;
}

const HeroDemoContext = createContext<HeroDemoValue | null>(null);

/** Envuelve el hero. Sus hijos siguen siendo Server Components; solo las hojas interactivas leen esto. */
export function HeroDemoProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<RoadmapView>("list");
  const [revealed, setRevealed] = useState(false);

  const setView = (next: RoadmapView) => {
    setViewState(next);
    if (next === "map") setRevealed(true);
  };

  return <HeroDemoContext.Provider value={{ view, setView, revealed }}>{children}</HeroDemoContext.Provider>;
}

export function useHeroDemo(): HeroDemoValue {
  const value = useContext(HeroDemoContext);
  if (!value) throw new Error("[landing] useHeroDemo debe usarse dentro de <HeroDemoProvider>");
  return value;
}
