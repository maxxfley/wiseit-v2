import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getDictionary();
  const locale = await getLocale();
  return (
    <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-start justify-center gap-6 px-6 py-section">
      {/* React 19 eleva <title> al <head>; not-found no admite generateMetadata. */}
      <title>{`${t.common.meta.notFound} | Wiseit`}</title>
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">{t.common.notFound.title}</h1>
      <p className="max-w-[72ch] text-lg text-muted-foreground">{t.common.notFound.body}</p>
      <Link href={localizePath(locale, ROUTES.home)} className={buttonStyles("primary")}>
        {t.common.notFound.back}
      </Link>
    </main>
  );
}
