import { useEffect, useState } from "react";

/**
 * Avanza de 0 a `total` cuando `active` pasa a `true`: el paso 1 enseguida y uno más cada `intervalMs`.
 * Con "reducir movimiento" salta directo al final (estado completo, sin animación).
 */
export function useStepSequence(active: boolean, total: number, intervalMs: number): number {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) return;
    // Todo cambio de estado va en un temporizador (el primero con 0 ms): nunca sincrónico dentro del efecto.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const schedule = reduced
      ? [{ value: total, delay: 0 }]
      : Array.from({ length: total }, (_, index) => ({ value: index + 1, delay: intervalMs * index }));
    const timers = schedule.map(({ value, delay }) => window.setTimeout(() => setStep(value), delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [active, total, intervalMs]);

  return step;
}
