"use client"; // Aparece al abrir el mapa de la demo (estado del cliente).

import { cn } from "@/utils/cn";
import { useHeroDemo } from "./hero-demo-context";
import { TopicForm } from "./topic-form";

interface TopicRevealProps {
  className?: string;
  /** Clases extra solo cuando está desplegado (ej. ajustar el margen); también se animan. */
  revealedClassName?: string;
  /** Espaciado interno: se colapsa junto con el campo (un margen externo quedaría visible aunque esté oculto). */
  innerClassName?: string;
}

/**
 * Campo de tema que se despliega la primera vez que se abre el mapa: la altura crece con suavidad
 * (filas de grid 0fr → 1fr), así lo que está debajo baja lo justo y al mismo ritmo que la tarjeta.
 * Mientras está oculto queda `inert`: no recibe foco ni lo anuncian los lectores de pantalla.
 */
export function TopicReveal({ className, revealedClassName, innerClassName }: TopicRevealProps) {
  const { revealed } = useHeroDemo();
  return (
    <div
      inert={!revealed}
      className={cn(
        "grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        revealed ? cn("grid-rows-[1fr] opacity-100", revealedClassName) : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      {/* El padding compensa el recorte de overflow-hidden para que se vea el anillo de foco. */}
      <div className={cn("-m-1 overflow-hidden p-1", innerClassName)}>
        <TopicForm />
      </div>
    </div>
  );
}
