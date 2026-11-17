import { useEffect, useRef, useState } from "react";

/**
 * Mide el alto del contenido con ResizeObserver para que el contenedor lo anime con una transición CSS.
 * Hasta la primera medición devuelve `undefined` (alto automático), así el HTML del servidor no cambia.
 */
export function useAnimatedHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, height };
}
