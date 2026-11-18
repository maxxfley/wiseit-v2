"use client"; // Estado compartido entre el mapa y la lista: generar en una vista se refleja en la otra.

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import type { MessageKey } from "@/locales/types";
import { extendRoadmapAction } from "../actions/extend-roadmap";
import { previewExtensionAction } from "../actions/preview-extension";
import type { ExtensionAccess } from "../services/extensions-repo";

interface ExtensionsContextValue {
  access: ExtensionAccess;
  /** Títulos fantasma a la vista (plan gratis, después de tocar el botón). */
  ghosts: string[];
  pending: "extend" | "preview" | null;
  error: MessageKey | null;
  /** Pasos agregados por la última extensión (para el aviso de éxito). */
  added: number | null;
  /** Premium: extiende la ruta. Gratis: muestra los títulos fantasma. */
  advance: () => void;
}

const ExtensionsContext = createContext<ExtensionsContextValue | null>(null);

interface ExtensionsProviderProps {
  roadmapId: string;
  initialAccess: ExtensionAccess;
  children: ReactNode;
}

export function ExtensionsProvider({ roadmapId, initialAccess, children }: ExtensionsProviderProps) {
  const [access, setAccess] = useState(initialAccess);
  const [ghosts, setGhosts] = useState<string[]>([]);
  const [pending, setPending] = useState<"extend" | "preview" | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const advance = () => {
    if (pending) return;
    setError(null);
    setAdded(null);
    const kind = access.premium ? "extend" : "preview";
    setPending(kind);
    startTransition(async () => {
      if (kind === "extend") {
        const result = await extendRoadmapAction({ roadmapId });
        if (result.status === "ok") {
          setAdded(result.added);
          setAccess((current) => ({
            ...current,
            roadmapLeft: Math.max(0, current.roadmapLeft - 1),
            todayLeft: Math.max(0, current.todayLeft - 1),
          }));
        } else setError(result.message);
      } else {
        const result = await previewExtensionAction({ roadmapId });
        if (result.status === "ok") setGhosts(result.titles);
        else setError(result.message);
      }
      setPending(null);
    });
  };

  const value = { access, ghosts, pending, error, added, advance };
  return <ExtensionsContext.Provider value={value}>{children}</ExtensionsContext.Provider>;
}

export function useExtensions(): ExtensionsContextValue {
  const value = useContext(ExtensionsContext);
  if (!value) throw new Error("useExtensions debe usarse dentro de <ExtensionsProvider>.");
  return value;
}
