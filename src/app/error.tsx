"use client"; // Next.js exige que los Error Boundaries sean Client Components.

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: unknown;
  retry: () => void;
}

/** Error Boundary global: evita que un fallo de renderizado colapse toda la app. */
export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    // Detalle técnico solo a consola; al usuario se le muestra un mensaje controlado.
    const digest = error instanceof Error && "digest" in error ? String(error.digest) : "n/a";
    console.error("[app/error] Fallo de renderizado", { digest, error });
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-start justify-center gap-6 px-6 py-section">
      <h1 className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">Algo salió mal</h1>
      <p className="max-w-[72ch] text-lg text-muted-foreground">
        Ocurrió un error inesperado. Podés intentar de nuevo; si persiste, volvé más tarde.
      </p>
      <Button onClick={retry}>Reintentar</Button>
    </main>
  );
}
