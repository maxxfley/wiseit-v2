import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { DIFFICULTY_LEVELS } from "@/features/roadmaps/schemas/roadmap-output.schema";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { LandingRoadmapDemo } from "./landing-roadmap-demo";

/** Vista previa de un roadmap para la landing: contenido estático de demostración, un paso por nivel. */
export async function RoadmapPreview() {
  const t = await getDictionary();
  const locale = await getLocale();
  const steps = DIFFICULTY_LEVELS.map((level, index) => ({
    level: t.common.levels[level],
    title: t.landing.preview.steps[index] ?? "",
  }));

  // La lista se renderiza en el servidor; la demo solo alterna entre ella y el mapa de muestra.
  const list = (
    <ol className="space-y-4 border-l border-border-strong pl-5">
      {steps.map((step, index) => (
        <li key={step.level} className="animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
          <span className="font-mono text-xs font-medium tracking-[0.6px] text-accent">{step.level}</span>
          <p className="font-medium text-foreground">{step.title}</p>
        </li>
      ))}
    </ol>
  );

  return (
    <Card className="w-full max-w-md bg-surface-raised shadow-float">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-muted-foreground">
        {t.landing.preview.label}
      </p>
      <LandingRoadmapDemo list={list} />
      <Link
        href={localizePath(locale, ROUTES.signup)}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {t.landing.preview.cta}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </Card>
  );
}
