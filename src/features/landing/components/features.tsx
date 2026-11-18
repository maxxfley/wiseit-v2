import { Compass, FolderKanban, ListChecks, Sparkles, type LucideIcon } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/locales/types";
import { FeatureGrid } from "./feature-grid";
import { PLANS_SECTION_ID } from "./landing-pricing";

type FeatureKey = keyof Dictionary["landing"]["features"]["items"];

// Rejilla asimétrica (2+1 / 1+2): evita tres columnas iguales. El texto sale del diccionario.
const FEATURES: readonly { key: FeatureKey; icon: LucideIcon; wide?: boolean }[] = [
  { key: "routes", icon: Sparkles, wide: true },
  { key: "progress", icon: ListChecks },
  { key: "material", icon: Compass },
  { key: "saved", icon: FolderKanban, wide: true },
];

/** Qué incluye cada plan: cada card muestra Gratis y, por turnos o con hover, lo que suma Premium. */
export async function Features() {
  const t = (await getDictionary()).landing.features;
  const items = FEATURES.map(({ key, icon: Icon, wide }) => ({
    key,
    icon: <Icon aria-hidden="true" className="size-6" />,
    title: t.items[key].title,
    free: t.items[key].free,
    premium: t.items[key].premium,
    wide,
  }));
  return (
    <section data-snap-section className="mx-auto w-full max-w-page px-6 py-section">
      <FeatureGrid items={items} badges={t.badges} plansHref={`#${PLANS_SECTION_ID}`} />
    </section>
  );
}
