import { getDictionary } from "@/lib/i18n/server";
import { HowItWorksTimeline } from "./how-it-works-timeline";

/** Timeline vertical con riel lateral (DESIGN.md › Grid & Container), animada al entrar en pantalla. */
export async function HowItWorks() {
  const t = (await getDictionary()).landing.how;
  return (
    <section data-snap-section className="mx-auto w-full max-w-page px-6 py-section">
      <h2 className="max-w-[20ch] font-display text-4xl font-medium tracking-[-0.8px] text-foreground">{t.title}</h2>
      <HowItWorksTimeline steps={t.steps} generatingLabel={t.visual.generating} readyLabel={t.visual.ready} />
    </section>
  );
}
