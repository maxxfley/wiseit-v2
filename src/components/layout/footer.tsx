import { getDictionary } from "@/lib/i18n/server";
import { Logo } from "./logo";

export async function Footer() {
  const t = await getDictionary();
  return (
    <footer data-snap-section className="border-t border-border">
      <div className="mx-auto flex w-full max-w-page flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
        <Logo />
        <p className="text-sm text-muted-foreground">{t.common.footer.tagline}</p>
      </div>
    </footer>
  );
}
