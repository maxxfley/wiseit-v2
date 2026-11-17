import { getDictionary } from "@/lib/i18n/server";

/** Timeline vertical con riel lateral (DESIGN.md › Grid & Container). */
export async function HowItWorks() {
  const t = (await getDictionary()).landing.how;
  return (
    <section data-snap-section className="mx-auto w-full max-w-page px-6 py-section">
      <h2 className="max-w-[20ch] font-display text-4xl font-medium tracking-[-0.8px] text-foreground">{t.title}</h2>
      <ol className="mt-12 max-w-2xl space-y-10 border-l border-border-strong pl-8">
        {t.steps.map((step, index) => (
          <li key={step.title} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[37px] top-1.5 size-2.5 rounded-full bg-primary"
            />
            <span className="font-mono text-xs font-medium tracking-[0.6px] text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 text-xl font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
