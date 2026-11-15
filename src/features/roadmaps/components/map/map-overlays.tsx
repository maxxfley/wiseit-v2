import type { NodeStatus } from "../../utils/node-status";
import { STATUS_META, STATUS_ORDER } from "./node-visuals";
import { ProgressRing } from "./progress-ring";

/** Progreso general de la ruta (temas completados sobre el total). */
export function OverallProgress({ completed, total }: { completed: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/85 px-3.5 py-2.5 backdrop-blur-sm">
      <span className="relative grid place-items-center">
        <ProgressRing percent={percent} size={44} stroke={4} tone="text-success" label={`Progreso general: ${percent}%`} />
        <span aria-hidden="true" className="absolute text-xs font-medium text-foreground">
          {percent}%
        </span>
      </span>
      <span>
        <span className="block text-sm font-medium text-foreground">Tu progreso</span>
        <span className="block text-xs text-muted-foreground">
          {completed} de {total} temas completados
        </span>
      </span>
    </div>
  );
}

/** Leyenda de estados: color + ícono + texto. */
export function MapLegend({ counts }: { counts: Readonly<Record<NodeStatus, number>> }) {
  return (
    <ul
      aria-label="Leyenda de estados"
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border bg-surface/85 px-3.5 py-2 backdrop-blur-sm"
    >
      {STATUS_ORDER.map((status) => {
        const { label, icon: Icon, badge } = STATUS_META[status];
        return (
          <li key={status} className="flex items-center gap-1.5 text-xs text-body">
            <span className={`grid size-4 place-items-center rounded-full ${badge}`}>
              <Icon aria-hidden="true" className="size-2.5" />
            </span>
            {label} <span className="text-subtle">({counts[status]})</span>
          </li>
        );
      })}
    </ul>
  );
}
