"use client"; // Next.js exige que los Error Boundaries sean Client Components.

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface DashboardErrorProps {
  error: unknown;
  retry: () => void;
}

/** Error Boundary del panel: un fallo de datos no tumba el sidebar ni el resto de la app. */
export default function DashboardError({ error, retry }: DashboardErrorProps) {
  useEffect(() => {
    const digest = error instanceof Error && "digest" in error ? String(error.digest) : "n/a";
    console.error("[dashboard/error] Fallo de renderizado", { digest, error });
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="font-display text-3xl font-medium tracking-[-0.6px] text-foreground">
        No pudimos cargar esta sección
      </h1>
      <p className="max-w-[72ch] text-muted-foreground">Probá de nuevo; si persiste, volvé más tarde.</p>
      <Button onClick={retry}>Reintentar</Button>
    </div>
  );
}
