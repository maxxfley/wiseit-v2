import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PricingHeader } from "@/features/plans/components/pricing-header";
import { PricingSection } from "@/features/plans/components/pricing-section";

/**
 * Cierre de la landing: los dos planes, iguales a /pricing. El encabezado es estático; las
 * tarjetas leen la sesión (cookies), por eso van en <Suspense> y no frenan el resto de la página.
 */
export function LandingPricing() {
  return (
    <section data-snap-section className="mx-auto w-full max-w-page space-y-12 px-4 pb-section sm:px-6">
      <PricingHeader as="h2" />
      <Suspense fallback={<Skeleton className="mx-auto h-[520px] w-full max-w-4xl rounded-xl" />}>
        <PricingSection />
      </Suspense>
    </section>
  );
}
