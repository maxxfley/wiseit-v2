"use client"; // Lee los textos desde el contexto de idioma.

import { BookOpen, ExternalLink, FileText, GraduationCap, MessagesSquare, PlayCircle, type LucideIcon } from "lucide-react";
import type { MaterialKind } from "@/config/materials";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import type { MaterialItem } from "../schemas/material.schema";

const KIND_ICONS: Record<MaterialKind, LucideIcon> = {
  article: FileText,
  video: PlayCircle,
  docs: BookOpen,
  forum: MessagesSquare,
  course: GraduationCap,
};

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

/**
 * Fuentes encontradas. Links externos: otra pestaña y `noopener noreferrer nofollow` (la página
 * abierta no accede a Wiseit, no recibe de dónde vino y no suma reputación por el link).
 */
export function MaterialList({ items, title }: { items: MaterialItem[]; title: string }) {
  const { t } = useI18n();
  return (
    <ul aria-label={format(t.materials.listLabel, { title })} className="space-y-2">
      {items.map((item) => {
        const Icon = KIND_ICONS[item.kind];
        return (
          <li key={item.url}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group flex gap-3 rounded-md border border-border bg-background/40 p-3 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-foreground group-hover:text-accent">{item.title}</span>
                  <ExternalLink aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                </span>
                <span className="mt-0.5 block font-mono text-xs text-subtle">
                  {t.materials.kinds[item.kind]} · {hostOf(item.url)}
                </span>
                {item.reason ? <span className="mt-1 block text-sm text-muted-foreground">{item.reason}</span> : null}
                <span className="sr-only">{t.materials.newTab}</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
