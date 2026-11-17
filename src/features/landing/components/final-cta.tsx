import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function FinalCta() {
  const t = (await getDictionary()).landing.finalCta;
  return (
    <section data-snap-section className="mx-auto w-full max-w-page px-6 pb-section">
      <div className="rounded-2xl border border-border bg-surface-raised px-8 py-16 text-center">
        <h2 className="mx-auto max-w-[24ch] font-display text-4xl font-medium tracking-[-0.8px] text-foreground">
          {t.title}
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-lg text-muted-foreground">{t.body}</p>
        <Link href={localizePath(await getLocale(), ROUTES.signup)} className={buttonStyles("primary", "mt-8")}>
          {t.cta}
        </Link>
      </div>
    </section>
  );
}
