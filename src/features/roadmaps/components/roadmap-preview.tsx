import { Card } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/server";
import { DIFFICULTY_LEVELS } from "../schemas/roadmap-output.schema";

/** Vista previa de un roadmap para la landing: contenido estático de demostración, un paso por nivel. */
export async function RoadmapPreview() {
  const t = await getDictionary();
  const steps = DIFFICULTY_LEVELS.map((level, index) => ({
    level: t.common.levels[level],
    title: t.landing.preview.steps[index] ?? "",
  }));

  return (
    <Card className="w-full max-w-md bg-surface-raised shadow-float">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-muted-foreground">
        {t.landing.preview.label}
      </p>
      <ol className="mt-4 space-y-4 border-l border-border-strong pl-5">
        {steps.map((step, index) => (
          <li key={step.level} className="animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
            <span className="font-mono text-xs font-medium tracking-[0.6px] text-accent">{step.level}</span>
            <p className="font-medium text-foreground">{step.title}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
