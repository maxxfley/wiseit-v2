"use client"; // Rotación con temporizador y visibilidad en pantalla: solo en el navegador.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FeatureCard } from "./feature-card";

export interface FeatureItem {
  key: string;
  icon: ReactNode;
  title: string;
  free: string;
  premium: string;
  wide?: boolean;
}

interface FeatureGridProps {
  items: readonly FeatureItem[];
  badges: { free: string; premium: string; cta: string };
  plansHref: string;
}

const ROTATE_MS = 3000;

/**
 * Muestra el "modo Premium" de una card por vez, rotando cada 3 s mientras la sección está en
 * pantalla. Si la persona pasa el cursor, enfoca o toca una card, esa queda activa y la rotación
 * se pausa. Con "reducir movimiento" no rota: solo responde a la interacción.
 */
export function FeatureGrid({ items, badges, plansHref }: FeatureGridProps) {
  const [auto, setAuto] = useState<number | null>(null);
  const [engaged, setEngaged] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (timer) clearInterval(timer);
      timer = null;
      if (!entry?.isIntersecting) return setAuto(null);
      setAuto((value) => value ?? 0);
      timer = setInterval(() => setAuto((value) => ((value ?? -1) + 1) % items.length), ROTATE_MS);
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [items.length]);

  // La interacción manda; cuando termina, la rotación sigue desde esa card.
  const handleInteract = (index: number, isEngaged: boolean) => {
    setEngaged(isEngaged ? index : (current) => (current === index ? null : current));
    if (!isEngaged) setAuto((value) => (value === null ? null : index));
  };

  const activeIndex = engaged ?? auto;
  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-3">
      {items.map(({ key, ...item }, index) => (
        <FeatureCard
          key={key}
          {...item}
          badges={badges}
          plansHref={plansHref}
          active={activeIndex === index}
          onInteract={(isEngaged) => handleInteract(index, isEngaged)}
        />
      ))}
    </div>
  );
}
