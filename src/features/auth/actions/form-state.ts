import { z } from "zod";
import type { AuthFormState } from "../types";

/** Convierte un error de Zod en estado de formulario (sin exponer detalles técnicos). */
export function validationError(error: z.ZodError): AuthFormState {
  return { status: "error", fieldErrors: z.flattenError(error).fieldErrors };
}

export function formError(message: string): AuthFormState {
  return { status: "error", message };
}
