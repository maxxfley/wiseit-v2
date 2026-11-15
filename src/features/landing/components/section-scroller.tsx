"use client"; // Escucha la rueda del mouse y anima el scroll: solo existe en el navegador.

import { useEffect } from "react";
import { animateScrollTo } from "@/utils/scroll";

const SECTION_SELECTOR = "[data-snap-section]";
const MIN_DELTA = 4; // ignora micro-movimientos de la rueda
const EDGE = 2; // tolerancia en px al comparar posiciones
const SETTLE_GAP_MS = 120; // pausa de la rueda que marca un gesto nuevo (descarta la inercia)

function sectionTops(): number[] {
  const tops = Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR)).map((el) =>
    Math.round(el.getBoundingClientRect().top + window.scrollY),
  );
  if (tops.length > 0) tops[0] = 0; // la primera sección incluye la navbar: ancla al tope de la página
  return tops;
}

/** Próxima parada: el borde de sección más cercano en esa dirección, sin pasar de una pantalla. */
function nextStop(tops: number[], y: number, direction: 1 | -1, viewport: number, max: number): number {
  if (direction === 1) {
    const boundary = tops.find((top) => top > y + EDGE) ?? max;
    return Math.min(boundary, y + viewport, max);
  }
  const boundary = [...tops].reverse().find((top) => top < y - EDGE) ?? 0;
  return Math.max(boundary, y - viewport, 0);
}

/** Distancias largas duran más, entre 0,6 s y 1 s. */
function durationFor(distance: number): number {
  return Math.min(1000, Math.max(600, 450 + distance * 0.45));
}

/**
 * Scroll por secciones con rueda: cualquier gesto, por pequeño que sea, desliza suavemente
 * hasta el siguiente borde de sección. Solo en punteros finos y sin "reducir movimiento";
 * en táctiles manda el snap nativo de globals.css.
 */
export function SectionScroller() {
  useEffect(() => {
    const enabled = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!enabled.matches) return;

    let running = false;
    let settling = false;
    let lastWheel = 0;
    let cancel: (() => void) | null = null;

    const onWheel = (event: WheelEvent) => {
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      if (event.ctrlKey || Math.abs(delta) < MIN_DELTA || Math.abs(event.deltaX) > Math.abs(delta)) return;

      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      if (running || (settling && gap < SETTLE_GAP_MS)) {
        event.preventDefault(); // absorbe la inercia del trackpad tras un salto
        return;
      }
      settling = false;

      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const target = nextStop(sectionTops(), y, delta > 0 ? 1 : -1, window.innerHeight, max);
      if (Math.abs(target - y) < EDGE) return; // ya en el extremo: deja el scroll nativo

      event.preventDefault();
      running = true;
      cancel = animateScrollTo(target, durationFor(Math.abs(target - y)), () => {
        running = false;
        settling = true;
      });
    };

    // Si la persona usa el teclado o arrastra la barra, tiene prioridad sobre la animación.
    const interrupt = () => {
      cancel?.();
      running = false;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", interrupt);
    window.addEventListener("pointerdown", interrupt);
    return () => {
      interrupt();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", interrupt);
      window.removeEventListener("pointerdown", interrupt);
    };
  }, []);

  return null;
}
