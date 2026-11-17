"use client"; // Lee los textos del contexto de idioma y avisa el cambio de pestaña.

import { List, Map as MapIcon, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";

export type RoadmapView = "map" | "list";

interface Tab {
  value: RoadmapView;
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

interface ViewTabsProps {
  value: RoadmapView;
  onChange: (view: RoadmapView) => void;
  className?: string;
}

/** Selector Lista / Mapa interactivo. Lo comparten el detalle de una ruta y la demo de la landing. */
export function ViewTabs({ value, onChange, className }: ViewTabsProps) {
  const { t } = useI18n();
  return (
    <div
      role="tablist"
      aria-label={t.roadmaps.views.label}
      className={cn("inline-flex gap-1 rounded-md border border-border bg-surface p-1", className)}
    >
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "inline-flex items-center gap-2 rounded-sm px-4 py-1.5 text-sm font-medium",
            "transition-[background-color,color,box-shadow] duration-200",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            value === tab.value ? tab.active : tab.idle,
          )}
        >
          <tab.icon aria-hidden="true" className="size-4" />
          {t.roadmaps.views[tab.value]}
        </button>
      ))}
    </div>
  );
}
