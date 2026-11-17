"use client"; // Cambia según la pestaña de la demo (estado del cliente).

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { useI18n } from "@/lib/i18n/provider";
import { useHeroDemo } from "./hero-demo-context";
import { TopicReveal } from "./topic-reveal";

/**
 * Pie de la tarjeta de demo. Antes de abrir el mapa: link "Creá la tuya →".
 * Después: en escritorio el campo de tema vive en la columna de texto, así que aquí no hay nada;
 * en celular el campo aparece aquí, donde está el usuario (arriba quedaría fuera de la pantalla).
 */
export function PreviewFooter() {
  const { t, href } = useI18n();
  const { revealed } = useHeroDemo();

  if (!revealed) {
    return (
      <Link
        href={href(ROUTES.signup)}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {t.landing.preview.cta}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    );
  }
  // Se monta ya desplegado: la entrada la anima el fade-up.
  return <TopicReveal className="mt-5 animate-fade-up md:hidden" />;
}
