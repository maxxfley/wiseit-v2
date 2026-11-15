import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Campo de texto: borde sólido 1px, radio 6px, foco con anillo (DESIGN.md › Input). */
export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "w-full rounded-sm border border-border-strong bg-background px-3 py-2 text-base text-foreground",
        "placeholder:text-subtle transition-colors duration-200",
        "focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
        "aria-[invalid=true]:border-danger disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
