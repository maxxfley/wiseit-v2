import { Button } from "@/components/ui/button";
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
  if (status === "locked") return null;
  return (
    <div className="flex flex-col gap-2">
      {status === "available" ? (
        <Button onClick={onStart} disabled={pending} className="w-full">
          Comenzar a estudiar
        </Button>
      ) : null}
      {status === "in_progress" ? (
        <Button onClick={onComplete} disabled={pending} className="w-full">
          Marcar como completado
        </Button>
      ) : null}
      {status === "completed" ? (
        <Button variant="secondary" onClick={onReset} disabled={pending} className="w-full">
          Reiniciar progreso
        </Button>
      ) : null}
    </div>
  );
}
