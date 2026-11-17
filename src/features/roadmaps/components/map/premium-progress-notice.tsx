"use client"; // Lee los textos desde el contexto de idioma.

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Plan gratis: en lugar de los botones de progreso, la invitación a Premium. Es solo informativo;
 * el bloqueo real lo hace `update_node_progress` en la base (error WS402).
 */
export function PremiumProgressNotice() {
  const { t, href } = useI18n();
  return (
    <div className="rounded-md border border-primary/40 bg-primary/10 p-3">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles aria-hidden="true" className="size-4 text-accent" />
        {t.map.premium.title}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{t.map.premium.body}</p>
      <Link href={href(ROUTES.pricing)} className="mt-2 inline-block text-sm font-medium text-accent hover:text-primary-hover">
        {t.plans.upsell}
      </Link>
    </div>
  );
}
