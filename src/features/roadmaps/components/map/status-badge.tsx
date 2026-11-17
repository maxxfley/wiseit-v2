"use client"; // Lee el texto del estado desde el contexto de idioma.

import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";
import type { NodeStatus } from "../../utils/node-status";
import { STATUS_META } from "./node-visuals";

export function StatusBadge({ status, className }: { status: NodeStatus; className?: string }) {
  const { t } = useI18n();
  const { icon: Icon, badge } = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-xs font-medium", badge, className)}>
      <Icon aria-hidden="true" className="size-3" />
      {t.map.status[status]}
    </span>
  );
}
