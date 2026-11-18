import { MATERIAL_LIMITS } from "@/config/materials";
import type { MaterialItem } from "../schemas/material.schema";

/** Qué puede hacer el usuario en esta ruta (lo decide el servidor; la base lo vuelve a verificar). */
export interface MaterialAccess {
  premium: boolean;
  /** Gratis: esta ruta ya usó su link. */
  freeRoadmapUsed: boolean;
  /** Gratis: links que le quedan a la cuenta. */
  freeLinksLeft: number;
}

/** Recorte por plan, SIEMPRE en el servidor: al cliente gratis nunca le llegan las 5 fuentes. */
export function visibleItems(items: MaterialItem[], premium: boolean): MaterialItem[] {
  return premium ? items : items.slice(0, MATERIAL_LIMITS.freeVisibleItems);
}
