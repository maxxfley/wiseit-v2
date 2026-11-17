"use client"; // El estado de visibilidad requiere el cliente.

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { FormField } from "./form-field";

interface PasswordFieldProps {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  errors?: readonly string[];
}

/** Campo de contraseña con botón mostrar/ocultar (evita errores de tipeo al crear la cuenta). */
export function PasswordField({ name, label, autoComplete, errors }: PasswordFieldProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <FormField
      name={name}
      label={label}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      errors={errors}
      className="pr-11"
      adornment={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? t.auth.fields.hidePassword : t.auth.fields.showPassword}
          aria-pressed={visible}
          className="rounded-xs p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Icon aria-hidden="true" className="size-4" />
        </button>
      }
    />
  );
}
