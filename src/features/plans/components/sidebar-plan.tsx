import { Sparkles } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getIsPremium } from "../services/plan";
import { CancellationNotice } from "./cancellation-notice";
import { ManageSubscriptionButton } from "./manage-subscription-button";

/** Plan actual en el sidebar: Gratis con link a Premium, o Premium con la gestión. Va en <Suspense>. */
export async function SidebarPlan() {
  const [premium, dict, locale] = await Promise.all([getIsPremium(), getDictionary(), getLocale()]);
  const t = dict.plans.sidebar;

  if (premium) {
    return (
      <div className="space-y-2">
        <p className="inline-flex items-center gap-1.5 rounded-sm bg-primary/15 px-2 py-1 text-xs font-medium text-accent">
          <Sparkles aria-hidden="true" className="size-3.5" />
          {t.premium}
        </p>
        <CancellationNotice compact />
        <ManageSubscriptionButton className="w-full px-4 py-2 text-sm" />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t.free}</p>
      <Link
        href={localizePath(locale, ROUTES.pricing)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-primary-hover"
      >
        <Sparkles aria-hidden="true" className="size-4" />
        {t.upgrade}
      </Link>
    </div>
  );
}
