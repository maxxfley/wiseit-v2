import { getDictionary } from "@/lib/i18n/server";

interface PricingHeaderProps {
  /** h1 en /pricing (es el título de la página); h2 en la landing (una sección más). */
  as?: "h1" | "h2";
}

/** Encabezado de los planes, compartido por /pricing y la landing para que no se desincronicen. */
export async function PricingHeader({ as: Heading = "h1" }: PricingHeaderProps) {
  const t = (await getDictionary()).plans;
  return (
    <header className="mx-auto max-w-2xl space-y-4 text-center">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent">{t.eyebrow}</p>
      <Heading className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground sm:text-5xl">{t.title}</Heading>
      <p className="text-body">{t.subtitle}</p>
    </header>
  );
}
