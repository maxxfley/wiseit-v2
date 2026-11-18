import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PricingHeader } from "@/features/plans/components/pricing-header";
import { PricingSection } from "@/features/plans/components/pricing-section";

/**
 * Cierre de la landing: los dos planes, iguales a /pricing. El encabezado es estático; las
 * tarjetas leen la sesión (cookies), por eso van en <Suspense> y no frenan el resto de la página.
 * Alto de una pantalla con el contenido centrado: el scroll por secciones se detiene en su borde
 * superior y así queda el mismo aire arriba y abajo.
 */
export function LandingPricing() {
  return (
    <section data-snap-section className="mx-auto flex min-h-svh w-full max-w-page flex-col justify-center gap-6 px-4 py-8 sm:px-6">
      <PricingHeader as="h2" />
      <Suspense fallback={<Skeleton className="mx-auto h-[520px] w-full max-w-4xl rounded-xl" />}>
        <PricingSection />
      </Suspense>
    </section>
  );
}
