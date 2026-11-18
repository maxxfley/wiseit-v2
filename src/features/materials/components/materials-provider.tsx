"use client"; // Estado compartido entre el mapa y la lista: lo que se busca en una vista aparece en la otra.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { MaterialItem } from "../schemas/material.schema";
import type { MaterialAccess } from "../services/visibility";

interface MaterialsContextValue {
  access: MaterialAccess;
  itemsFor: (nodeId: string) => MaterialItem[] | undefined;
  setItems: (nodeId: string, items: MaterialItem[]) => void;
  /** Gratis: el link de esta ruta ya se usó (por esta búsqueda o porque la base lo dijo). */
  markFreeUsed: (reason: "search" | "roadmap_used" | "account_used") => void;
}

const MaterialsContext = createContext<MaterialsContextValue | null>(null);

interface MaterialsProviderProps {
  initialItems: Record<string, MaterialItem[]>;
  initialAccess: MaterialAccess;
  children: ReactNode;
}

export function MaterialsProvider({ initialItems, initialAccess, children }: MaterialsProviderProps) {
  const [byNode, setByNode] = useState(initialItems);
  const [access, setAccess] = useState(initialAccess);

  const setItems = useCallback((nodeId: string, items: MaterialItem[]) => {
    setByNode((current) => ({ ...current, [nodeId]: items }));
  }, []);

  const markFreeUsed = useCallback((reason: "search" | "roadmap_used" | "account_used") => {
    setAccess((current) => ({
      ...current,
      freeRoadmapUsed: true,
      freeLinksLeft: reason === "account_used" ? 0 : reason === "search" ? Math.max(0, current.freeLinksLeft - 1) : current.freeLinksLeft,
    }));
  }, []);

  const value = useMemo(
    () => ({ access, itemsFor: (nodeId: string) => byNode[nodeId], setItems, markFreeUsed }),
    [access, byNode, setItems, markFreeUsed],
  );
  return <MaterialsContext.Provider value={value}>{children}</MaterialsContext.Provider>;
}

export function useMaterials(): MaterialsContextValue {
  const value = useContext(MaterialsContext);
  if (!value) throw new Error("useMaterials debe usarse dentro de <MaterialsProvider>.");
  return value;
}
