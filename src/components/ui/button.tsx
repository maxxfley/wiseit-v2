import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "ghost";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 text-sm font-semibold " +
  "transition-[filter,box-shadow,transform,background-color] duration-200 ease-out " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-[0.92] hover:shadow-lift",
  ghost:
    "border-[1.5px] border-accent text-foreground hover:bg-surface",
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
