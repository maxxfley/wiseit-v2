import { Check } from "lucide-react";
import { ProgressRing } from "@/features/roadmaps/components/map/progress-ring";
import { cn } from "@/utils/cn";

/** Nodos por capa (entrada → ocultas → salida) y en qué paso de la timeline se enciende cada capa. */
const LAYERS = [3, 4, 4, 3] as const;
const LAYER_STEP = [1, 2, 2, 3] as const;
const WIDTH = 300;
const HEIGHT = 220;
const NODE_GAP = 50;

interface Point {
  x: number;
  y: number;
}

/** Coordenadas fijas: capas repartidas a lo ancho y nodos centrados en vertical. */
const COLUMNS: Point[][] = LAYERS.map((count, layer) => {
  const x = 30 + (layer * (WIDTH - 60)) / (LAYERS.length - 1);
  return Array.from({ length: count }, (_, index) => ({ x, y: HEIGHT / 2 + (index - (count - 1) / 2) * NODE_GAP }));
});

const layerLit = (layer: number, step: number) => step >= (LAYER_STEP[layer] ?? Infinity);

interface NeuralNetworkProps {
  step: number;
  total: number;
  label: string;
}

/**
 * Ilustración decorativa: la "IA" procesando el tema. Cada capa se enciende con su paso de la timeline
 * (entrada = el tema, ocultas = la IA pensando, salida = la ruta) y el anillo llega a 100% al final.
 * Los nodos encendidos titilan suave; con "reducir movimiento" quedan fijos.
 */
export function NeuralNetwork({ step, total, label }: NeuralNetworkProps) {
  const percent = Math.round((step / total) * 100);
  const done = step >= total;

  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-6">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-[22rem] overflow-visible">
        {COLUMNS.slice(1).map((column, offset) => {
          const lit = layerLit(offset + 1, step);
          return (COLUMNS[offset] ?? []).flatMap((from, i) =>
            column.map((to, j) => (
              <line
                key={`${offset}-${i}-${j}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                strokeWidth={1}
                className={cn(
                  "transition-[stroke,opacity] duration-700",
                  lit ? "stroke-primary opacity-50" : "stroke-border-strong opacity-40",
                )}
              />
            )),
          );
        })}
        {COLUMNS.map((column, layer) =>
          column.map((node, index) => {
            const lit = layerLit(layer, step);
            return (
              <circle
                key={`${layer}-${index}`}
                cx={node.x}
                cy={node.y}
                r={7}
                strokeWidth={1.5}
                // Retraso "pseudoaleatorio" pero fijo: cada nodo titila a destiempo de sus vecinos.
                style={{ animationDelay: `${((layer * 3 + index * 7) % 10) * 0.26}s` }}
                className={cn(
                  "transition-[fill,stroke] duration-700",
                  lit
                    ? "animate-twinkle fill-primary stroke-accent [filter:drop-shadow(0_0_6px_var(--primary))] motion-reduce:animate-none"
                    : "fill-surface-raised stroke-border-strong",
                )}
              />
            );
          }),
        )}
      </svg>
      <div className="flex items-center gap-4">
        <span className="relative grid place-items-center">
          {/* 1400 ms = STEP_MS de how-it-works-timeline.tsx: el anillo avanza al ritmo del riel. */}
          <ProgressRing percent={percent} size={64} stroke={5} tone="text-primary" label={label} durationClassName="duration-[1400ms]" />
          <span className="absolute inset-0 grid place-items-center font-mono text-sm font-medium text-foreground">
            {done ? <Check className="size-6 text-success" strokeWidth={3} /> : `${percent}%`}
          </span>
        </span>
        <span className={cn("text-sm font-medium transition-colors duration-500", done ? "text-success" : "text-muted-foreground")}>
          {label}
        </span>
      </div>
    </div>
  );
}
