import { Layers, LayoutDashboard, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/locales/types";
import { cn } from "@/utils/cn";

type FeatureKey = keyof Dictionary["landing"]["features"];

// Rejilla asimétrica (2+1 / 1+2): evita tres columnas iguales. El texto sale del diccionario.
const FEATURES: readonly { key: FeatureKey; icon: LucideIcon; wide?: boolean }[] = [
  { key: "levels", icon: Layers, wide: true },
  { key: "strict", icon: Sparkles },
  { key: "privacy", icon: ShieldCheck },
  { key: "panel", icon: LayoutDashboard, wide: true },
];

export async function Features() {
  const t = (await getDictionary()).landing.features;
  return (
    <section data-snap-section className="mx-auto w-full max-w-page px-6 py-section">
      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ key, icon: Icon, wide }) => (
          <Card key={key} className={cn("p-8", wide && "md:col-span-2")}>
            <Icon aria-hidden="true" className="size-6 text-accent" />
            <h3 className="mt-6 text-xl font-semibold text-foreground">{t[key].title}</h3>
            <p className="mt-2 max-w-[60ch] text-muted-foreground">{t[key].description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
