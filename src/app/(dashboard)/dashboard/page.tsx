import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPanel } from "@/features/auth/components/user-panel";

export const metadata: Metadata = { title: "Dashboard" };

/** Placeholder del Paso 3; el Paso 5 lo reemplaza por el layout con sidebar. */
export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-page flex-1 px-6 py-section">
      <h1 className="mb-8 font-display text-4xl font-medium tracking-[-0.8px] text-foreground">
        Dashboard
      </h1>
      <Suspense fallback={<Skeleton className="h-44 w-full max-w-md" />}>
        <UserPanel />
      </Suspense>
    </main>
  );
}
