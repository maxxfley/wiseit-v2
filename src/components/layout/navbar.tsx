import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDictionary } from "@/lib/i18n/server";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";
import { NavbarSession } from "./navbar-session";

export async function Navbar() {
  const t = await getDictionary();
  return (
    <header className="relative z-(--z-nav) border-b border-border">
      <nav
        aria-label={t.common.nav.primary}
        className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-3 px-6"
      >
        <Logo />
        <div className="flex items-center gap-2 sm:gap-4">
          {/* usePathname es dato de runtime en rutas dinámicas: va en Suspense. */}
          <Suspense fallback={<Skeleton className="h-6 w-24" />}>
            <LocaleSwitcher />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-9 w-44" />}>
            <NavbarSession />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
