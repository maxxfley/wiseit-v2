import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type CardProps = HTMLAttributes<HTMLDivElement>;

/** Contenedor base: radio 20px, borde 1px y sombra suave (DESIGN.md › Cards). */
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-sm border border-border bg-surface p-6 shadow-card", className)}
      {...props}
    />
  );
}
