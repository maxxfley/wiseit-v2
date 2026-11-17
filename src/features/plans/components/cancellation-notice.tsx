import { format } from "@/lib/i18n/format";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { formatDate } from "@/utils/format-date";
import { getOwnSubscription } from "../services/subscription";
import { ResumeButton } from "./resume-button";

/**
 * Premium con la renovación cancelada: cuándo termina y la opción de reactivarlo.
 * `compact` (sidebar): solo la fecha. Lee cookies: va dentro de <Suspense>.
 */
export async function CancellationNotice({ compact = false }: { compact?: boolean }) {
  const subscription = await getOwnSubscription();
  if (!subscription?.cancelAtPeriodEnd || !subscription.currentPeriodEnd) return null;

  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.plans.cancellation;
  const endsOn = format(t.endsOn, { date: formatDate(subscription.currentPeriodEnd, locale) });

  if (compact) return <p className="text-xs text-muted-foreground">{endsOn}</p>;
  return (
    <div role="note" className="mx-auto max-w-4xl space-y-3 rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-body">
      <p>
        <span className="font-medium text-foreground">{endsOn}</span> {t.detail}
      </p>
      <ResumeButton className="px-4 py-2 text-sm" />
    </div>
  );
}
