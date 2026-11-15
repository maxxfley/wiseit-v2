import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";

// Rectángulo de 8px (no pill), etiqueta 500, foco con anillo de 2px (DESIGN.md › Elevation).
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-medium " +
  "transition-[background-color,box-shadow,transform,color] duration-200 ease-out " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-glow",
  secondary:
    "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-raised",
  ghost: "rounded-sm px-3 py-1.5 text-sm text-body hover:text-foreground",
};

/**
 * Clases del botón, reutilizables en elementos que no son <button>
 * (ej. <Link className={buttonStyles("primary")} />).
 */
export function buttonStyles(variant: ButtonVariant = "primary", className?: string): string {
  return cn(BASE, VARIANTS[variant], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles(variant, className)} {...props} />;
}
