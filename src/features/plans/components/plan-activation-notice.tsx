import { getDictionary } from "@/lib/i18n/server";
import { getIsPremium } from "../services/plan";
import { AutoRefresh } from "./auto-refresh";

// 10 intentos cada 3 s ≈ 30 s: el webhook suele llegar en pocos segundos.
const REFRESH_MS = 3000;
const MAX_ATTEMPTS = 10;

interface PlanActivationNoticeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Después del checkout (`?checkout=success`): espera al webhook y confirma el Premium.
 * El parámetro solo cambia el MENSAJE; el plan siempre lo decide la base. Va en <Suspense>.
 */
export async function PlanActivationNotice({ searchParams }: PlanActivationNoticeProps) {
  if ((await searchParams).checkout !== "success") return null;
  const [premium, dict] = await Promise.all([getIsPremium(), getDictionary()]);
  const t = dict.plans.activation;

  return (
    <div role="status" className="max-w-xl rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-body">
      <p>{premium ? t.done : t.pending}</p>
      {premium ? null : <AutoRefresh intervalMs={REFRESH_MS} maxAttempts={MAX_ATTEMPTS} slowMessage={t.slow} />}
    </div>
  );
}
