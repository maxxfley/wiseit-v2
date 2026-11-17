"use client"; // Lee los textos desde el contexto de idioma.

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import type { NodeStatus } from "../../utils/node-status";

interface NodePanelActionsProps {
  status: NodeStatus;
  pending: boolean;
  onStart: () => void;
  onComplete: () => void;
  onReset: () => void;
}

/** Acción principal según el estado: comenzar → completar → reiniciar. */
export function NodePanelActions({ status, pending, onStart, onComplete, onReset }: NodePanelActionsProps) {
  const { t } = useI18n();
  if (status === "locked") return null;
  return (
    <div className="flex flex-col gap-2">
      {status === "available" ? (
        <Button onClick={onStart} disabled={pending} className="w-full">
          {t.map.start}
        </Button>
      ) : null}
      {status === "in_progress" ? (
        <Button onClick={onComplete} disabled={pending} className="w-full">
          {t.map.complete}
        </Button>
      ) : null}
      {status === "completed" ? (
        <Button variant="secondary" onClick={onReset} disabled={pending} className="w-full">
          {t.map.reset}
        </Button>
      ) : null}
    </div>
  );
}
