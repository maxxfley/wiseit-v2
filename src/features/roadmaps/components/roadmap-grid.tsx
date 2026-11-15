import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import type { RoadmapSummary } from "../services/queries";
import { RoadmapCard } from "./roadmap-card";

export function RoadmapGrid({ roadmaps }: { roadmaps: readonly RoadmapSummary[] }) {
  if (roadmaps.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-4">
        <p className="text-lg text-foreground">Todavía no tenés rutas.</p>
        <p className="text-muted-foreground">Elegí un tema y generamos tu primera ruta de aprendizaje.</p>
        <Link href={ROUTES.dashboard} className={buttonStyles("primary")}>
          Crear una ruta
        </Link>
      </Card>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {roadmaps.map((roadmap) => (
        <li key={roadmap.id} className="flex">
          <div className="w-full">
            <RoadmapCard roadmap={roadmap} />
          </div>
        </li>
      ))}
    </ul>
  );
}
