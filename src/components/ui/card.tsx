import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type CardProps = HTMLAttributes<HTMLDivElement>;

/** Contenedor base: radio 12px, hairline translúcido y sin sombra (DESIGN.md › Elevation nivel 1). */
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-surface p-6", className)}
      {...props}
    />
  );
}
