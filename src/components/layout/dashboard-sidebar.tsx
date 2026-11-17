import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarPlan } from "@/features/plans/components/sidebar-plan";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUser } from "./sidebar-user";

// usePathname (nav, selector de idioma) es dato de runtime en rutas dinámicas y la sesión lee
// cookies: todo va en Suspense. `getCurrentUser` usa `cache`, así que las dos barras comparten lectura.
const nav = (
  <Suspense fallback={<Skeleton className="h-20 w-full" />}>
    <SidebarNav />
  </Suspense>
);
const user = (
  <Suspense fallback={<Skeleton className="h-24 w-full" />}>
    <SidebarUser />
  </Suspense>
);
const plan = (
  <Suspense fallback={<Skeleton className="h-12 w-full" />}>
    <SidebarPlan />
  </Suspense>
);
const localeSwitcher = (
  <Suspense fallback={<Skeleton className="h-8 w-14" />}>
    <LocaleSwitcher />
  </Suspense>
);

/** Celular: ☰ · logo centrado · idioma. El menú abre un panel lateral con la nav y la sesión. */
function MobileTopBar() {
  return (
    <header className="sticky top-0 z-(--z-nav) grid grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-surface px-4 py-3 md:hidden">
      <div className="justify-self-start">
        <MobileMenu header={<Logo />}>
          {nav}
          <div className="mt-auto space-y-4">
            {plan}
            {user}
          </div>
        </MobileMenu>
      </div>
      <Logo />
      <div className="justify-self-end">{localeSwitcher}</div>
    </header>
  );
}

/** Escritorio y tablet (≥ md): sidebar fijo a la izquierda. */
export function DashboardSidebar() {
  return (
    <>
      <MobileTopBar />
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col gap-8 border-r border-border bg-surface px-4 py-6 md:flex">
        <Logo />
        {nav}
        <div className="mt-auto flex flex-col items-start gap-3">
          {localeSwitcher}
          <div className="w-full">{plan}</div>
          <div className="w-full">{user}</div>
        </div>
      </aside>
    </>
  );
}
