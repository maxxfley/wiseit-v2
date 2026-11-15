/** Estado devuelto por la Server Action de generación a `useActionState`. En éxito redirige al detalle. */
export interface GenerateFormState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: { topic?: string[] };
}

export const INITIAL_GENERATE_STATE: GenerateFormState = { status: "idle" };

/** Estado de la Server Action de borrado. En éxito la tarjeta desaparece por revalidación. */
export interface DeleteRoadmapState {
  status: "idle" | "error";
  message?: string;
}

export const INITIAL_DELETE_STATE: DeleteRoadmapState = { status: "idle" };
