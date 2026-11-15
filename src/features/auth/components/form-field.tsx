import { FieldError } from "@/components/ui/field-error";
import { Input, type InputProps } from "@/components/ui/input";

interface FormFieldProps extends InputProps {
  name: string;
  label: string;
  errors?: readonly string[];
}

/** Etiqueta + input + error, enlazados por id para accesibilidad. */
export function FormField({ name, label, errors, ...inputProps }: FormFieldProps) {
  const errorId = `${name}-error`;
  const hasError = Boolean(errors?.length);
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        required
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        {...inputProps}
      />
      <FieldError id={errorId} messages={errors} />
    </div>
  );
}
