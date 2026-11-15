export interface AuthFieldErrors {
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
}

/** Estado devuelto por las Server Actions de auth a `useActionState`. */
export interface AuthFormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: AuthFieldErrors;
}

export const INITIAL_AUTH_STATE: AuthFormState = { status: "idle" };

export type AuthAction = (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
