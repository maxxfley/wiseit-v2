import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { HeroDemoProvider } from "./hero-demo-context";
import { RoadmapPreview } from "./roadmap-preview";
import { TopicReveal } from "./topic-reveal";

/**
 * El CTA siempre apunta a /signup: con sesión activa, el proxy ya redirige al dashboard.
 * Layout: la columna de texto no cambia nunca; al abrir el mapa solo se estira la tarjeta.
 */
export async function Hero() {
  const t = (await getDictionary()).landing.hero;
  const locale = await getLocale();
  return (
    <HeroDemoProvider>
      <section data-snap-section className="mx-auto grid w-full max-w-page gap-12 px-6 py-section md:grid-cols-2 md:gap-16">
        <div className="animate-fade-up">
          <p className="mb-4 font-display text-xs font-medium uppercase tracking-[0.6px] text-accent">{t.eyebrow}</p>
          <h1 className="font-display text-hero font-medium text-foreground">{t.title}</h1>
          <p className="mt-6 max-w-[72ch] text-lg text-muted-foreground">{t.body}</p>
          <div className="mt-8">
            {/* Espacio reservado en escritorio: el campo aparece sin mover los botones. En celular va en la tarjeta (PreviewFooter). */}
            <TopicReveal className="mb-5 hidden max-w-lg md:block" />
            <div className="flex flex-wrap gap-4">
              <Link href={localizePath(locale, ROUTES.signup)} className={buttonStyles("primary")}>
                {t.primaryCta}
              </Link>
              <Link href={localizePath(locale, ROUTES.login)} className={buttonStyles("secondary")}>
                {t.secondaryCta}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex items-start justify-center md:justify-end">
          <RoadmapPreview />
        </div>
      </section>
    </HeroDemoProvider>
  );
}
