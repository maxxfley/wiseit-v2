import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { RoadmapPreview } from "@/features/roadmaps/components/roadmap-preview";

/** El CTA siempre apunta a /signup: con sesión activa, el proxy ya redirige al dashboard. */
export function Hero() {
  return (
    <section data-snap-section className="mx-auto grid w-full max-w-page items-center gap-12 px-6 py-section md:grid-cols-2 md:gap-16">
      <div className="animate-fade-up">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent">
          Aprendizaje guiado por IA
        </p>
        <h1 className="font-serif text-hero font-medium text-foreground">
          Aprendé cualquier tema con una ruta clara.
        </h1>
        <p className="mt-6 max-w-[72ch] text-lg text-muted-foreground">
          Escribí lo que querés dominar y Wiseit arma un recorrido paso a paso, ordenado de
          Básico a Avanzado, para que sepas siempre qué estudiar después.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href={ROUTES.signup} className={buttonStyles("primary")}>
            Crear mi primera ruta
          </Link>
          <Link href={ROUTES.login} className={buttonStyles("secondary")}>
            Ya tengo cuenta
          </Link>
        </div>
      </div>
      <div className="flex justify-center md:justify-end">
        <RoadmapPreview />
      </div>
    </section>
  );
}
