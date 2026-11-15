import { z } from "zod";

/** Todo `id` que llega de la URL o de un formulario se valida como UUID antes de tocar la base. */
export const roadmapIdSchema = z.uuid();
