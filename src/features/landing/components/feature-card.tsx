"use client"; // Eventos de puntero y foco: solo existen en el navegador.

import { ArrowRight, Sparkles } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  free: string;
  premium: string;
  badges: { free: string; premium: string; cta: string };
  /** Destino del badge "Premium" (la sección de planes). */
  plansHref: string;
  wide?: boolean;
  /** Lo decide FeatureGrid (rotación automática o interacción). */
  active: boolean;
  /** true al entrar el cursor, enfocar o tocar; false al salir. */
  onInteract: (engaged: boolean) => void;
}

const LAYER = "col-start-1 row-start-1 transition-opacity duration-300 motion-reduce:transition-none";

/**
 * Card de Features: en reposo cuenta el plan gratis; activa, pasa a "modo Premium". Avisa al grid
 * de hover, foco y toque (en táctiles no hay hover: un toque alterna). Las dos versiones comparten
 * celda de grilla, así el alto no salta, y ambas quedan legibles para lectores de pantalla.
 */
export function FeatureCard({ icon, title, free, premium, badges, plansHref, wide, active, onInteract }: FeatureCardProps) {
  const pointerType = useRef<string>("mouse");

  return (
    <div
      tabIndex={0}
      onPointerDown={(event) => (pointerType.current = event.pointerType)}
      onPointerEnter={(event) => event.pointerType === "mouse" && onInteract(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && onInteract(false)}
      onClick={() => pointerType.current !== "mouse" && onInteract(!active)}
      onFocus={() => onInteract(true)}
      // Pasar el foco al badge (dentro de la card) no cuenta como salir.
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && onInteract(false)}
      className={cn(
        "relative cursor-default rounded-xl border bg-surface p-8 transition-[border-color,box-shadow,background-color] duration-300 motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active ? "border-primary/60 bg-surface-raised shadow-glow" : "border-border",
        wide && "md:col-span-2",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={cn("transition-colors duration-300", active ? "text-foreground" : "text-accent")}>{icon}</span>
        {active ? (
          <a
            href={plansHref}
            aria-label={badges.cta}
            // En táctiles, el toque no debe además alternar la card.
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "group/badge inline-flex items-center gap-1 rounded-sm bg-primary px-2 py-0.5 font-mono text-xs font-medium text-primary-foreground",
              "transition-shadow hover:shadow-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            )}
          >
            <Sparkles aria-hidden="true" className="size-3" />
            {badges.premium}
            <ArrowRight aria-hidden="true" className="size-3 transition-transform group-hover/badge:translate-x-0.5" />
          </a>
        ) : (
          <span aria-hidden="true" className="rounded-sm border border-border px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {badges.free}
          </span>
        )}
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
