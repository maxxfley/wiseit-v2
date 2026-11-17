import { getCurrentUser } from "@/features/auth/services/session";
import { getDictionary } from "@/lib/i18n/server";
import { getPaddlePublicConfig } from "@/lib/paddle/public-config";
import { getIsPremium } from "../services/plan";
import { CancellationNotice } from "./cancellation-notice";
import { PricingCards, type PricingViewer } from "./pricing-cards";

/** Decide quién mira (sin sesión, gratis o Premium). Lee cookies: va dentro de <Suspense>. */
export async function PricingSection() {
  const user = await getCurrentUser();
  const viewer: PricingViewer = !user ? "guest" : (await getIsPremium()) ? "premium" : "free";
  const paddle = getPaddlePublicConfig();
  const t = (await getDictionary()).plans.notes;

  return (
    <>
      {viewer === "premium" ? <CancellationNotice /> : null}
      <PricingCards viewer={viewer} paddle={paddle} />
      <div className="mx-auto max-w-2xl space-y-2 text-center text-sm text-muted-foreground">
        <p>{t.taxes}</p>
        <p>{t.cancel}</p>
        {paddle?.environment === "sandbox" && viewer === "free" ? (
          <p className="rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-subtle">{t.sandbox}</p>
        ) : null}
      </div>
    </>
  );
}
