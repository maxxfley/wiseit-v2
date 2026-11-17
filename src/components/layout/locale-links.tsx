"use client"; // usePathname requiere el cliente: arma el link a la MISMA página en otro idioma.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config";
import { switchLocale } from "@/lib/i18n/paths";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";

/** Selector en línea "ES EN RU" (escritorio): links simples, sin JS para navegar. */
export function LocaleLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  const { locale, t } = useI18n();

  return (
    <nav aria-label={t.common.language.label} className={cn("flex items-center gap-0.5", className)}>
      {LOCALES.map((target) => (
        <Link
          key={target}
          href={switchLocale(pathname, target)}
          hrefLang={target}
          lang={target}
          prefetch={false}
          aria-current={target === locale ? "true" : undefined}
          title={LOCALE_LABELS[target]}
          className={cn(
            "rounded-xs px-1.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.6px] transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            target === locale ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span aria-hidden="true">{target}</span>
          <span className="sr-only">{LOCALE_LABELS[target]}</span>
        </Link>
      ))}
    </nav>
  );
}
