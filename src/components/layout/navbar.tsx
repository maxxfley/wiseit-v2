import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "./logo";
import { NavbarSession } from "./navbar-session";

export function Navbar() {
  return (
    <header className="relative z-(--z-nav) border-b border-border">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 w-full max-w-page items-center justify-between px-6"
      >
        <Logo />
        <Suspense fallback={<Skeleton className="h-9 w-44" />}>
          <NavbarSession />
        </Suspense>
      </nav>
    </header>
  );
}
