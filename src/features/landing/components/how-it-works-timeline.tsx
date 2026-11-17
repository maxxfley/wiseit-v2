"use client"; // Anima la timeline cuando la sección entra en pantalla.

import { cn } from "@/utils/cn";
import { useInViewOnce } from "../hooks/use-in-view-once";
import { useStepSequence } from "../hooks/use-step-sequence";
import { NeuralNetwork } from "./neural-network";

/** Duración de cada paso: el riel tarda esto en llegar al punto siguiente (y el anillo, en avanzar). */
const STEP_MS = 1400;

interface Step {
  title: string;
  description: string;
}

interface HowItWorksTimelineProps {
  steps: readonly Step[];
  /** Texto del anillo mientras carga y al terminar. */
  generatingLabel: string;
  readyLabel: string;
}

/**
 * Al llegar a la sección, el riel se llena de arriba hacia abajo (01 → 02 → 03) y cada punto se enciende
 * cuando la barra llega a él. A la derecha, la red neuronal y el anillo avanzan sincronizados (solo escritorio).
 * Se reproduce una vez; con "reducir movimiento" se muestra directo el estado final.
 */
export function HowItWorksTimeline({ steps, generatingLabel, readyLabel }: HowItWorksTimelineProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const step = useStepSequence(inView, steps.length, STEP_MS);

  return (
    <div ref={ref} className="mt-12 grid items-center gap-16 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <ol className="max-w-2xl space-y-10 pl-8">
        {steps.map((item, index) => {
          const reached = step >= index + 1;
          const isLast = index === steps.length - 1;
          return (
            <li key={item.title} className="relative">
              {isLast ? null : (
                // Tramo del riel hasta el punto siguiente: gris de fondo + relleno morado que "carga".
                <span aria-hidden="true" className="absolute -left-[33px] top-[11px] h-[calc(100%+2.5rem)] w-px bg-border-strong">
                  <span
                    style={{ transitionDuration: `${STEP_MS}ms` }}
                    className={cn(
                      "absolute inset-0 origin-top bg-accent shadow-[0_0_8px_var(--primary)] transition-transform ease-linear",
                      reached ? "scale-y-100" : "scale-y-0",
                    )}
                  />
                </span>
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -left-[37px] top-1.5 z-10 size-2.5 rounded-full transition-[background-color,box-shadow,transform] duration-500",
                  reached
                    ? "scale-125 bg-accent shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_35%,transparent),0_0_16px_var(--primary)]"
                    : "bg-surface-raised ring-1 ring-border-strong",
                )}
              />
              <span className="font-mono text-xs font-medium tracking-[0.6px] text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-muted-foreground">{item.description}</p>
            </li>
          );
        })}
      </ol>
      <div className="hidden md:block">
        <NeuralNetwork step={step} total={steps.length} label={step >= steps.length ? readyLabel : generatingLabel} />
      </div>
    </div>
  );
}
