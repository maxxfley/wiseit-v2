"use client"; // Lee los textos desde el contexto de idioma.

import { Lock } from "lucide-react";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";

/**
 * Tema "fantasma" del plan gratis: el título de lo que vendría, borroso y con candado. El texto
 * real queda para lectores de pantalla (el desenfoque es solo visual, no oculta un secreto).
 */
export function GhostTopic({ title, className }: { title: string; className?: string }) {
  const { t } = useI18n();
  return (
    <div
      role="img"
      aria-label={format(t.extensions.ghostAria, { title })}
      className={cn("flex items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface/60 px-3.5 py-3", className)}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background/60">
        <Lock aria-hidden="true" className="size-4 text-subtle" />
      </span>
      <span aria-hidden="true" className="line-clamp-2 select-none text-sm font-medium text-foreground/80 blur-[3px]">
        {title}
      </span>
    </div>
  );
}
