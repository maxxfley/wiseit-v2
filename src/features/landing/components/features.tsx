import { Compass, FolderKanban, ListChecks, Sparkles, type LucideIcon } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/locales/types";
import { FeatureCard } from "./feature-card";

type FeatureKey = keyof Dictionary["landing"]["features"]["items"];

// Rejilla asimétrica (2+1 / 1+2): evita tres columnas iguales. El texto sale del diccionario.
const FEATURES: readonly { key: FeatureKey; icon: LucideIcon; wide?: boolean }[] = [
  { key: "routes", icon: Sparkles, wide: true },
  { key: "progress", icon: ListChecks },
  { key: "material", icon: Compass },
  { key: "saved", icon: FolderKanban, wide: true },
];

/** Qué incluye cada plan: cada card muestra Gratis y, con hover/foco/toque, lo que suma Premium. */
export async function Features() {
  const t = (await getDictionary()).landing.features;
  return (
    <section data-snap-section className="mx-auto w-full max-w-page px-6 py-section">
      <p className="mb-6 text-center font-mono text-xs text-subtle">
        <span className="pointer-coarse:hidden">{t.hint.pointer}</span>
        <span className="hidden pointer-coarse:inline">{t.hint.touch}</span>
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ key, icon: Icon, wide }) => (
          <FeatureCard
            key={key}
            icon={<Icon aria-hidden="true" className="size-6" />}
            title={t.items[key].title}
            free={t.items[key].free}
            premium={t.items[key].premium}
            badges={t.badges}
            wide={wide}
          />
        ))}
      </div>
    </section>
  );
}
