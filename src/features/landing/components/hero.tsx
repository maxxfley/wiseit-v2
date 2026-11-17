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
 * Layout: el texto queda fijo; al abrir el mapa se estira la tarjeta y, a la izquierda, se despliega el
 * campo de tema empujando los botones lo justo.
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
          <div className="mt-6">
            {/*
              Escritorio: al abrir el mapa el campo se despliega y los botones bajan lo justo (no hasta el
              borde de la tarjeta). Sin campo, los botones quedan a 24 px del texto (mt-6). Desplegado:
              20 px arriba del campo (-mt-1 sobre los 24 del contenedor) y abajo
              (pb-6 menos los 4 px del -m-1 interno).
              En celular el campo va dentro de la tarjeta (PreviewFooter).
            */}
            <TopicReveal className="hidden max-w-lg md:grid" revealedClassName="-mt-1" innerClassName="pb-6" />
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
