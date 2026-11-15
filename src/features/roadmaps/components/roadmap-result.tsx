import { Card } from "@/components/ui/card";
import type { GeneratedRoadmap } from "../types";

/** Resultado provisional de la generación (el Paso 5 lo reemplaza por la vista de detalle). */
export function RoadmapResult({ roadmap }: { roadmap: GeneratedRoadmap }) {
  return (
    <Card className="animate-fade-up bg-surface-raised">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent">Ruta guardada</p>
      <h2 className="mt-2 font-display text-2xl font-medium tracking-[-0.5px] text-foreground">
        {roadmap.title}
      </h2>
      <ol className="mt-6 space-y-4 border-l border-border-strong pl-5">
        {roadmap.nodes.map((node) => (
          <li key={node.order_index}>
            <span className="font-mono text-xs font-medium tracking-[0.6px] text-accent">
              {node.difficulty}
            </span>
            <p className="font-medium text-foreground">{node.title}</p>
            <p className="text-sm text-muted-foreground">{node.description}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {node.key_concepts.map((concept) => (
                <li
                  key={concept}
                  className="rounded-xs border border-border px-2 py-0.5 font-mono text-xs text-body"
                >
                  {concept}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-body">
              <span className="font-medium text-foreground">Practicá: </span>
              {node.practice}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
