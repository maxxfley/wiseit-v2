import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export default async function DashboardNotFound() {
  const t = (await getDictionary()).roadmaps.detail;
  const locale = await getLocale();
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="font-display text-3xl font-medium tracking-[-0.6px] text-foreground">{t.notFoundTitle}</h1>
      <p className="max-w-[72ch] text-muted-foreground">{t.notFoundBody}</p>
      <Link href={localizePath(locale, ROUTES.roadmaps)} className={buttonStyles("secondary")}>
        {t.notFoundBack}
      </Link>
    </div>
  );
}
