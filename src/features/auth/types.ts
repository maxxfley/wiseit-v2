import type { MessageKey } from "@/locales/types";

/** Los valores son claves de `validation` (ver auth.schema.ts); el cliente las traduce. */
export interface AuthFieldErrors {
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
}

/** Estado devuelto por las Server Actions de auth a `useActionState`. `message` es una clave, no un texto. */
export interface AuthFormState {
  status: "idle" | "error" | "success";
  message?: MessageKey;
  fieldErrors?: AuthFieldErrors;
}

export const INITIAL_AUTH_STATE: AuthFormState = { status: "idle" };

export type AuthAction = (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
