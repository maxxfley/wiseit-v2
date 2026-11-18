import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { PricingHeader } from "@/features/plans/components/pricing-header";
import { PricingSection } from "@/features/plans/components/pricing-section";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).plans.metaTitle };
}

/** Página pública de planes. El encabezado es estático; las tarjetas dependen de la sesión. */
export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-page flex-1 space-y-12 px-4 py-16 sm:px-6">
        <PricingHeader />
        <Suspense fallback={<Skeleton className="mx-auto h-[520px] w-full max-w-4xl rounded-xl" />}>
          <PricingSection />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
