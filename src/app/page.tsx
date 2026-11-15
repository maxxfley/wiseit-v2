import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { RoadmapPreview } from "@/features/roadmaps/components/roadmap-preview";

/** Landing provisional (Paso 1): valida tokens, tipografía y layout. Se reemplaza en el Paso 3. */
export default function HomePage() {
  return (
    <main className="mx-auto grid w-full max-w-page flex-1 items-center gap-12 px-6 py-section md:grid-cols-2 md:gap-16">
      <section className="animate-fade-up">
        <h1 className="font-serif text-hero font-medium text-foreground">
          Aprendé cualquier tema con una ruta clara.
        </h1>
        <p className="mt-6 max-w-[72ch] text-lg text-muted-foreground">
          Escribí lo que querés dominar y Wiseit arma un recorrido paso a paso, ordenado de
          Básico a Avanzado, para que sepas siempre qué estudiar después.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/signup" className={buttonStyles("primary")}>
            Crear mi primera ruta
          </Link>
          <Link href="/login" className={buttonStyles("secondary")}>
            Ya tengo cuenta
          </Link>
        </div>
      </section>
      <div className="flex justify-center md:justify-end">
        <RoadmapPreview />
      </div>
    </main>
  );
}
