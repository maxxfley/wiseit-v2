import type { ReactNode } from "react";
import { FieldError } from "@/components/ui/field-error";
import { Input, type InputProps } from "@/components/ui/input";

interface FormFieldProps extends InputProps {
  name: string;
  label: string;
  errors?: readonly string[];
  /** Elemento superpuesto a la derecha del input (ej. botón mostrar/ocultar). */
  adornment?: ReactNode;
}

/** Etiqueta + input + error, enlazados por id para accesibilidad. */
export function FormField({ name, label, errors, adornment, ...inputProps }: FormFieldProps) {
  const errorId = `${name}-error`;
  const hasError = Boolean(errors?.length);
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          required
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          {...inputProps}
        />
        {adornment ? <div className="absolute inset-y-0 right-2 flex items-center">{adornment}</div> : null}
      </div>
      <FieldError id={errorId} messages={errors} />
    </div>
  );
}
