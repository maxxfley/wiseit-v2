"use client"; // Lee los textos desde el contexto de idioma.

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { PLAN_LIMITS } from "@/config/plans";
import { ROUTES } from "@/config/routes";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";

/** Gratis sin cupo (o con su único link ya visible): invitación a Premium. Solo informativo. */
export function MaterialUpsell({ reason }: { reason: "roadmap_used" | "account_used" | "more" }) {
  const { t, href } = useI18n();
  const lead =
    reason === "more"
      ? t.materials.moreWithPremium
      : reason === "roadmap_used"
        ? t.materials.roadmapUsed
        : format(t.materials.accountUsed, { limit: PLAN_LIMITS.free.materialLinksPerAccount });
  return (
    <div className="rounded-md border border-primary/40 bg-primary/10 p-3">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles aria-hidden="true" className="size-4 text-accent" />
        {lead}
      </p>
      {reason === "more" ? null : <p className="mt-1 text-sm text-muted-foreground">{t.materials.upsellBody}</p>}
      <Link href={href(ROUTES.pricing)} className="mt-2 inline-block text-sm font-medium text-accent hover:text-primary-hover">
        {t.plans.upsell}
      </Link>
    </div>
  );
}
