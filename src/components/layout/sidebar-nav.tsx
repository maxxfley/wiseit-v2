"use client"; // usePathname requiere el cliente: solo esta hoja lo usa.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";

export function SidebarNav() {
  const pathname = usePathname();
  const { t, href } = useI18n();
  const items = [
    { href: href(ROUTES.dashboard), label: t.common.nav.dashboard },
    { href: href(ROUTES.roadmaps), label: t.common.nav.myRoadmaps },
  ];

  return (
    <nav aria-label={t.common.nav.primary} className="flex flex-col gap-1">
      {items.map(({ href: itemHref, label }) => {
        const active = pathname === itemHref || pathname.startsWith(`${itemHref}/`);
        return (
          <Link
            key={itemHref}
            href={itemHref}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "bg-surface-raised text-foreground"
                : "text-muted-foreground hover:bg-surface-raised hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
