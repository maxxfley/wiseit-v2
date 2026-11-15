import { Card } from "@/components/ui/card";

interface PreviewStep {
  level: "Básico" | "Intermedio" | "Avanzado";
  title: string;
}

// Contenido estático de demostración para la landing (no proviene de la base de datos).
const STEPS: readonly PreviewStep[] = [
  { level: "Básico", title: "Qué es una base de datos relacional" },
  { level: "Intermedio", title: "Joins, índices y normalización" },
  { level: "Avanzado", title: "Planes de ejecución y particionado" },
];

/** Vista previa de un roadmap: muestra la progresión por niveles. */
export function RoadmapPreview() {
  return (
    <Card className="w-full max-w-md bg-surface-raised shadow-float">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-muted-foreground">
        Ruta · PostgreSQL
      </p>
      <ol className="mt-4 space-y-4 border-l border-border-strong pl-5">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="animate-fade-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <span className="font-mono text-xs font-medium tracking-[0.6px] text-accent">
              {step.level}
            </span>
            <p className="font-medium text-foreground">{step.title}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
