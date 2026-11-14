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
    <Card className="w-full max-w-md">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Ruta · PostgreSQL
      </p>
      <ol className="mt-4 space-y-4 border-l border-border pl-5">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="animate-fade-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <span className="text-xs font-medium tracking-wide text-accent">{step.level}</span>
            <p className="font-medium">{step.title}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
