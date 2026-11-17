import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Features } from "@/features/landing/components/features";
import { FinalCta } from "@/features/landing/components/final-cta";
import { Hero } from "@/features/landing/components/hero";
import { HowItWorks } from "@/features/landing/components/how-it-works";
import { SectionScroller } from "@/features/landing/components/section-scroller";

/** Landing: Server Component estático; solo la navbar (sesión) se resuelve por request. */
export default function HomePage() {
  return (
    <>
      <SectionScroller />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
