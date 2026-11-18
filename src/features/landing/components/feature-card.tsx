"use client"; // Alterna Gratis/Premium con hover, foco o toque: necesita estado en el navegador.

import { Sparkles } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  free: string;
  premium: string;
  badges: { free: string; premium: string };
  wide?: boolean;
}

const LAYER = "col-start-1 row-start-1 transition-opacity duration-300 motion-reduce:transition-none";

/**
 * Card de Features: en reposo cuenta el plan gratis; con el cursor encima (o foco de teclado) pasa
 * a "modo Premium". En táctiles no hay hover: un toque alterna. Las dos versiones comparten celda
 * de grilla, así el alto no salta, y ambas quedan legibles para lectores de pantalla.
 */
export function FeatureCard({ icon, title, free, premium, badges, wide }: FeatureCardProps) {
  const [active, setActive] = useState(false);
  const pointerType = useRef<string>("mouse");

  return (
    <div
      tabIndex={0}
      onPointerDown={(event) => (pointerType.current = event.pointerType)}
      onPointerEnter={(event) => event.pointerType === "mouse" && setActive(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setActive(false)}
      onClick={() => pointerType.current !== "mouse" && setActive((value) => !value)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className={cn(
        "relative cursor-default rounded-xl border bg-surface p-8 transition-[border-color,box-shadow,background-color] duration-300 motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active ? "border-primary/60 bg-surface-raised shadow-glow" : "border-border",
        wide && "md:col-span-2",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={cn("transition-colors duration-300", active ? "text-foreground" : "text-accent")}>{icon}</span>
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-xs font-medium transition-colors duration-300",
            active ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
          )}
        >
          {active ? <Sparkles className="size-3" /> : null}
          {active ? badges.premium : badges.free}
        </span>
      </div>
      <h3 className="mt-6 text-xl font-semibold text-foreground">{title}</h3>
      <div className="mt-2 grid max-w-[60ch]">
        <p className={cn(LAYER, "text-muted-foreground", active ? "opacity-0" : "opacity-100")}>
          <span className="sr-only">{badges.free}: </span>
          {free}
        </p>
        <p className={cn(LAYER, "text-foreground", active ? "opacity-100" : "opacity-0")}>
          <span className="sr-only">{badges.premium}: </span>
          {premium}
        </p>
      </div>
    </div>
  );
}
