import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

export function FinalCta() {
  return (
    <section data-snap-section className="mx-auto w-full max-w-page px-6 pb-section">
      <div className="rounded-2xl border border-border bg-surface-raised px-8 py-16 text-center">
        <h2 className="mx-auto max-w-[24ch] font-serif text-4xl font-medium tracking-[-0.8px] text-foreground">
          Empezá tu primera ruta hoy
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-lg text-muted-foreground">
          Crear una cuenta es gratis y te toma menos de un minuto.
        </p>
        <Link href={ROUTES.signup} className={buttonStyles("primary", "mt-8")}>
          Crear cuenta
        </Link>
      </div>
    </section>
  );
}
