import { useEffect, useRef, useState } from "react";

/**
 * `true` desde la primera vez que el elemento entra en pantalla (y no vuelve a `false`).
 * Usa IntersectionObserver: no escucha el scroll, así que no cuesta nada mientras tanto.
 */
export function useInViewOnce<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return { ref, inView };
}
