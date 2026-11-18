"use client"; // El selector mensual/anual cambia el precio y la acción del checkout.

import Link from "next/link";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { PLAN_PRICES } from "@/config/plans";
import { ROUTES } from "@/config/routes";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import type { PaddlePublicConfig } from "@/lib/paddle/public-config";
import { BillingToggle, type BillingInterval } from "./billing-toggle";
import { CheckoutButton } from "./checkout-button";
import { ManageSubscriptionButton } from "./manage-subscription-button";
import { PlanCard } from "./plan-card";

export type PricingViewer = "guest" | "free" | "premium";

interface PricingCardsProps {
  viewer: PricingViewer;
  paddle: PaddlePublicConfig | null;
}

/** Gratis vs Premium. La acción depende de quién mira: crear cuenta, pagar o gestionar. */
export function PricingCards({ viewer, paddle }: PricingCardsProps) {
  const { t, locale, href } = useI18n();
  const [interval, setBillingInterval] = useState<BillingInterval>("month");
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "USD" });
  const yearly = interval === "year";

  const currentPlan = (
    <p className="rounded-md border border-border py-3 text-center text-sm text-muted-foreground">{t.plans.cta.current}</p>
  );
  const freeAction =
    viewer === "guest" ? (
      <Link href={href(ROUTES.signup)} className={buttonStyles("secondary", "w-full")}>
        {t.plans.cta.signup}
      </Link>
    ) : viewer === "free" ? (
      currentPlan
    ) : null;
  const premiumAction =
    viewer === "guest" ? (
      <Link href={href(ROUTES.signup)} className={buttonStyles("primary", "w-full")}>
        {t.plans.cta.subscribe}
      </Link>
    ) : viewer === "free" ? (
      <CheckoutButton interval={interval} paddle={paddle} />
    ) : (
      <ManageSubscriptionButton className="w-full" />
    );

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <BillingToggle value={interval} onChange={setBillingInterval} />
      </div>
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <PlanCard
          name={t.plans.free.name}
          description={t.plans.free.description}
          price={money.format(0)}
          features={t.plans.free.features}
          action={freeAction}
        />
        <PlanCard
          name={t.plans.premium.name}
          description={t.plans.premium.description}
          badge={t.plans.premium.badge}
          highlighted
          price={money.format(yearly ? PLAN_PRICES.yearly : PLAN_PRICES.monthly)}
          period={yearly ? t.plans.perYear : t.plans.perMonth}
          priceNote={yearly ? format(t.plans.yearlyEquivalent, { price: money.format(PLAN_PRICES.yearly / 12) }) : undefined}
          features={t.plans.premium.features}
          action={viewer === "premium" ? <div className="space-y-3">{currentPlan}{premiumAction}</div> : premiumAction}
        />
      </div>
    </div>
  );
}
