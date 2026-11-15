import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPanel } from "@/features/auth/components/user-panel";
import { GenerateForm } from "@/features/roadmaps/components/generate-form";

export const metadata: Metadata = { title: "Dashboard" };

/** Placeholder: el Paso 5 lo reemplaza por el layout con sidebar y el listado de rutas. */
export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-page flex-1 space-y-12 px-6 py-section">
      <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">Dashboard</h1>
      <Suspense fallback={<Skeleton className="h-44 w-full max-w-md" />}>
        <UserPanel />
      </Suspense>
      <section aria-labelledby="crear-ruta" className="space-y-6">
        <h2 id="crear-ruta" className="font-display text-2xl font-medium tracking-[-0.5px] text-foreground">
          Crear una ruta
        </h2>
        <GenerateForm />
      </section>
    </main>
  );
}
