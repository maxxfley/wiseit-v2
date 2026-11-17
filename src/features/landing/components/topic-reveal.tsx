"use client"; // Aparece al abrir el mapa de la demo (estado del cliente).

import { cn } from "@/utils/cn";
import { useHeroDemo } from "./hero-demo-context";
import { TopicForm } from "./topic-form";

/**
 * Campo de tema que se despliega con suavidad (filas de grid 0fr → 1fr) la primera vez que se abre el mapa.
 * Mientras está oculto queda `inert`: no recibe foco ni lo anuncian los lectores de pantalla.
 */
interface TopicRevealProps {
  className?: string;
  /** Espaciado interno: se colapsa junto con el campo (un margen externo quedaría visible aunque esté oculto). */
  innerClassName?: string;
}

export function TopicReveal({ className, innerClassName }: TopicRevealProps) {
  const { revealed } = useHeroDemo();
  return (
    <div
      inert={!revealed}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        revealed ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
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
