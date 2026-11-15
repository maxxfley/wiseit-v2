import { cn } from "@/utils/cn";

interface FieldErrorProps {
  id?: string;
  messages?: readonly string[];
  className?: string;
}

/** Mensaje de validación asociado a un campo (se enlaza con aria-describedby). */
export function FieldError({ id, messages, className }: FieldErrorProps) {
  const first = messages?.[0];
  if (!first) return null;
  return (
    <p id={id} className={cn("mt-1.5 text-sm text-danger", className)}>
      {first}
    </p>
  );
}
