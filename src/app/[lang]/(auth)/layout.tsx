import { Suspense } from "react";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Logo } from "@/components/layout/logo";
import { Skeleton } from "@/components/ui/skeleton";

/** Layout de login y signup: marca arriba y tarjeta centrada. Sin lectura de sesión (la gestiona el proxy). */
export default function AuthLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <div className="mx-auto flex w-full max-w-page flex-1 flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <Logo />
        <Suspense fallback={<Skeleton className="h-6 w-24" />}>
          <LocaleSwitcher />
        </Suspense>
      </div>
      <main className="flex flex-1 items-center justify-center py-12">{children}</main>
    </div>
  );
}
