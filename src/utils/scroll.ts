/** Curva de aceleración y frenado suaves (cúbica). `progress` va de 0 a 1. */
export function easeInOutCubic(progress: number): number {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
}

/**
 * Desliza la ventana hasta `target` (px) con easing. Desactiva `scroll-behavior: smooth`
 * mientras dura, para que el navegador no suavice por segunda vez cada fotograma.
 * Devuelve una función que cancela la animación.
 */
export function animateScrollTo(target: number, duration: number, onDone: () => void): () => void {
  const root = document.documentElement;
  const start = window.scrollY;
  const delta = target - start;
  const startTime = performance.now();
  let frame = 0;

  root.style.scrollBehavior = "auto";

  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, start + delta * easeInOutCubic(progress));
    if (progress < 1) {
      frame = requestAnimationFrame(step);
      return;
    }
    root.style.scrollBehavior = "";
    onDone();
  };
  frame = requestAnimationFrame(step);

  return () => {
    cancelAnimationFrame(frame);
    root.style.scrollBehavior = "";
  };
}
