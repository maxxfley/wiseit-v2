import { z } from "zod";
import type { MessageKey } from "@/locales/types";
import type { AuthFormState } from "../types";

/** Convierte un error de Zod en estado de formulario (los mensajes ya son claves de `validation`). */
export function validationError(error: z.ZodError): AuthFormState {
  return { status: "error", fieldErrors: z.flattenError(error).fieldErrors };
}

export function formError(message: MessageKey): AuthFormState {
  return { status: "error", message };
}
