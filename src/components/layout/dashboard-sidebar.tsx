import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUser } from "./sidebar-user";

/** Sidebar en escritorio; barra horizontal superior en móvil (mismas piezas, otra disposición). */
export function DashboardSidebar() {
  return (
    <aside
      className={
        "flex items-center gap-4 overflow-x-auto border-b border-border bg-surface px-4 py-3 " +
        "md:sticky md:top-0 md:h-[100dvh] md:w-60 md:shrink-0 md:flex-col md:items-stretch " +
        "md:gap-8 md:overflow-visible md:border-b-0 md:border-r md:px-4 md:py-6"
      }
    >
      <Logo />
      {/* usePathname es dato de runtime en rutas dinámicas: también va en Suspense. */}
      <Suspense fallback={<Skeleton className="h-9 w-40 md:h-20 md:w-full" />}>
        <SidebarNav />
      </Suspense>
      <div className="ml-auto md:ml-0 md:mt-auto">
        <Suspense fallback={<Skeleton className="h-10 w-20 md:h-24 md:w-full" />}>
          <SidebarUser />
        </Suspense>
      </div>
    </aside>
  );
}
