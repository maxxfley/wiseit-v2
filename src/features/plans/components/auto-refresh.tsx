"use client"; // Temporizador del navegador.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AutoRefreshProps {
  intervalMs: number;
  maxAttempts: number;
  /** Se muestra al agotar los intentos (ej. "está tardando, recargá en un minuto"). */
  slowMessage: string;
}

/**
 * Vuelve a pedir la página al servidor cada `intervalMs` (router.refresh, sin recargar todo) hasta
 * `maxAttempts`. Sirve para esperar al webhook de Paddle después del pago.
 */
export function AutoRefresh({ intervalMs, maxAttempts, slowMessage }: AutoRefreshProps) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (attempts >= maxAttempts) return;
    const timer = setTimeout(() => {
      setAttempts((value) => value + 1);
      router.refresh();
    }, intervalMs);
    return () => clearTimeout(timer);
  }, [attempts, maxAttempts, intervalMs, router]);

  return attempts >= maxAttempts ? <p className="mt-1 text-muted-foreground">{slowMessage}</p> : null;
}
