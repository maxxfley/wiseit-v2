"use client"; // Botón con estado de carga que llama a la Server Action.

import { Loader2, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/locales/types";
import { searchMaterialsAction } from "../actions/search-materials";
import { MaterialList } from "./material-list";
import { useMaterials } from "./materials-provider";
import { MaterialUpsell } from "./material-upsell";

/**
 * "Buscar material" de un tema, para el panel del mapa y la vista de lista. Muestra lo que ya está
 * en caché; si no hay nada, el botón según el plan (Premium / link gratis) o la invitación.
 * Un resultado aparece en las dos vistas: el estado vive en <MaterialsProvider>.
 * Lo que se ve es solo una ayuda: la base vuelve a verificar dueño, caché y cupo.
 */
interface NodeMaterialsProps {
  nodeId: string;
  title: string;
  /** En la lista de temas: sin invitaciones a Premium (se repetirían en cada tema). */
  inline?: boolean;
}

export function NodeMaterials({ nodeId, title, inline = false }: NodeMaterialsProps) {
  const { t, message } = useI18n();
  const { access, itemsFor, setItems, markFreeUsed } = useMaterials();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<MessageKey | null>(null);
  const items = itemsFor(nodeId);

  const search = () => {
    setError(null);
    startTransition(async () => {
      const result = await searchMaterialsAction({ nodeId });
      if (result.status === "ok") {
        setItems(nodeId, result.items);
        if (result.freeLinkUsed) markFreeUsed("search");
      } else if (result.status === "locked") {
        markFreeUsed(result.reason);
      } else {
        setError(result.message);
      }
    });
  };

  if (items && items.length > 0) {
    return (
      <div className="space-y-3">
        <MaterialList items={items} title={title} />
        {access.premium || inline ? null : <MaterialUpsell reason="more" />}
      </div>
    );
  }

  if (pending) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-md border border-border bg-background/40 p-3">
        <Loader2 aria-hidden="true" className="mt-0.5 size-4 animate-spin text-accent motion-reduce:animate-none" />
        <span>
          <span className="block text-sm text-foreground">{t.materials.searching}</span>
          <span className="block text-xs text-muted-foreground">{t.materials.searchingHint}</span>
        </span>
      </div>
    );
  }

  const freeAvailable = !access.freeRoadmapUsed && access.freeLinksLeft > 0;
  if (!access.premium && !freeAvailable) {
    if (inline) return null;
    return <MaterialUpsell reason={access.freeLinksLeft === 0 ? "account_used" : "roadmap_used"} />;
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" onClick={search} className={inline ? "gap-2" : "w-full gap-2"}>
        <Search aria-hidden="true" className="size-4" />
        {access.premium ? t.materials.search : t.materials.searchFree}
      </Button>
      {access.premium ? null : <p className="text-xs text-muted-foreground">{t.materials.freeHint}</p>}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {message(error)}
        </p>
      ) : null}
    </div>
  );
}
