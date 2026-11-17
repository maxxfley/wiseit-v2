import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { PricingSection } from "@/features/plans/components/pricing-section";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).plans.metaTitle };
}

/** Página pública de planes. El encabezado es estático; las tarjetas dependen de la sesión. */
export default async function PricingPage() {
  const t = (await getDictionary()).plans;
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-page flex-1 space-y-12 px-4 py-16 sm:px-6">
        <header className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-accent">{t.eyebrow}</p>
          <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground sm:text-5xl">{t.title}</h1>
          <p className="text-body">{t.subtitle}</p>
        </header>
        <Suspense fallback={<Skeleton className="mx-auto h-[520px] w-full max-w-4xl rounded-xl" />}>
          <PricingSection />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
