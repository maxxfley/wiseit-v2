"use client"; // Abre y cierra el <dialog>: requiere el cliente. El contenido llega ya renderizado del servidor.

import { Menu, X } from "lucide-react";
import { useId, useRef, type MouseEvent, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/provider";

interface MobileMenuProps {
  /** Cabecera del panel (logo). */
  header: ReactNode;
  /** Navegación y bloque de usuario (Server Components). */
  children: ReactNode;
}

/**
 * Botón ☰ + panel lateral con `<dialog>` nativo (`showModal`): el navegador resuelve Esc, el foco
 * atrapado, el fondo inerte y el backdrop. Se cierra al tocar un link, el fondo o la ✕.
 */
export function MobileMenu({ header, children }: MobileMenuProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialogRef.current?.close();

  // Un clic sobre el propio <dialog> (no sobre su contenido) es un clic en el backdrop.
  // Un clic en un link navega: el panel se cierra para que se vea la página nueva.
  const onDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    const target = event.target;
    if (target === event.currentTarget) return close();
    if (target instanceof Element && target.closest("a")) close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={t.common.nav.openMenu}
        aria-haspopup="dialog"
        className="rounded-sm p-1.5 text-body hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Menu aria-hidden="true" className="size-6" />
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={onDialogClick}
        className={
          "fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(80vw,18rem)] max-w-none open:animate-slide-in " +
          "border-r border-border-strong bg-surface p-0 text-body shadow-float backdrop:bg-background/80"
        }
      >
        <div className="flex h-full flex-col gap-8 p-5">
          <div className="flex items-center justify-between">
            <div id={titleId}>{header}</div>
            <button
              type="button"
              onClick={close}
              aria-label={t.common.nav.closeMenu}
              className="rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
