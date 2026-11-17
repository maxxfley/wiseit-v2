import type { MessageKey } from "@/locales/types";

/**
 * Estado devuelto por la Server Action de generación a `useActionState`. En éxito redirige al detalle.
 * `message` es una clave de `messages` y `fieldErrors` trae claves de `validation`: las traduce el cliente.
 */
export interface GenerateFormState {
  status: "idle" | "error";
  message?: MessageKey;
  fieldErrors?: { topic?: string[] };
}

export const INITIAL_GENERATE_STATE: GenerateFormState = { status: "idle" };

/** Estado de la Server Action de borrado. En éxito la tarjeta desaparece por revalidación. */
export interface DeleteRoadmapState {
  status: "idle" | "error";
  message?: MessageKey;
}

export const INITIAL_DELETE_STATE: DeleteRoadmapState = { status: "idle" };
