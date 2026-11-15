import { cn } from "@/utils/cn";
import type { NodeStatus } from "../../utils/node-status";
import { STATUS_META } from "./node-visuals";

export function StatusBadge({ status, className }: { status: NodeStatus; className?: string }) {
  const { label, icon: Icon, badge } = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-xs font-medium", badge, className)}>
      <Icon aria-hidden="true" className="size-3" />
      {label}
    </span>
  );
}
