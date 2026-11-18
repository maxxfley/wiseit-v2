"use client"; // Botón con estado de carga; lee el contexto de "Avanzar más".

import { ChevronsDown, Loader2, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { useExtensions } from "./extensions-provider";

/**
 * "Avanzar más": el mismo control en el mapa (debajo del último tema) y al final de la lista.
 * Premium extiende la ruta; gratis ve el botón con candado y, al tocarlo, los temas fantasma.
 */
export function ExtendControl() {
  const { t, message, href } = useI18n();
  const { access, ghosts, pending, error, added, advance } = useExtensions();
  const tx = t.extensions;
  const limitReached = access.premium && (access.roadmapLeft === 0 || access.todayLeft === 0);

  return (
    <div className="space-y-2 text-center">
      <Button onClick={advance} disabled={pending !== null || limitReached} className="w-full gap-2">
        {pending ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
        ) : access.premium ? (
          <ChevronsDown aria-hidden="true" className="size-4" />
        ) : (
          <Lock aria-hidden="true" className="size-4" />
        )}
        {tx.button}
      </Button>

      <div aria-live="polite" className="space-y-1 text-xs">
        {pending ? (
          <p className="text-muted-foreground">
            {pending === "extend" ? `${tx.generating} ${tx.generatingHint}` : tx.previewing}
          </p>
        ) : null}
        {!pending && access.premium && !limitReached ? (
          <p className="text-subtle">{format(tx.remaining, { today: access.todayLeft, roadmap: access.roadmapLeft })}</p>
        ) : null}
        {!pending && access.premium && limitReached ? (
          <p className="text-muted-foreground">{access.roadmapLeft === 0 ? tx.roadmapMax : tx.todayExhausted}</p>
        ) : null}
        {added ? <p className="text-success">{format(tx.added, { count: added })}</p> : null}
        {error ? (
          <p role="alert" className="text-danger">
            {message(error)}
          </p>
        ) : null}
      </div>

      {!access.premium && ghosts.length > 0 ? (
        <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-left">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles aria-hidden="true" className="size-4 text-accent" />
            {tx.ghostTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{tx.ghostBody}</p>
          <Link href={href(ROUTES.pricing)} className="mt-2 inline-block text-sm font-medium text-accent hover:text-primary-hover">
            {t.plans.upsell}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
