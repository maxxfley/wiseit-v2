"use client"; // Aparece al abrir el mapa de la demo (estado del cliente).

import { cn } from "@/utils/cn";
import { useHeroDemo } from "./hero-demo-context";
import { TopicForm } from "./topic-form";

/**
 * Campo de tema que aparece con un fundido la primera vez que se abre el mapa. Su espacio está
 * reservado desde el inicio, así nada a su alrededor se mueve. Mientras está oculto queda `inert`:
 * no recibe foco ni lo anuncian los lectores de pantalla.
 */
export function TopicReveal({ className }: { className?: string }) {
  const { revealed } = useHeroDemo();
  return (
    <div
      inert={!revealed}
      className={cn(
        "transition-[opacity,translate] duration-500 ease-out",
        revealed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        className,
      )}
    >
      <TopicForm />
    </div>
  );
}
