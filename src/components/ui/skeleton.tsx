import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

/** Placeholder de carga para contenido que llega por streaming (Suspense). */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-surface", className)}
      {...props}
    />
  );
}
