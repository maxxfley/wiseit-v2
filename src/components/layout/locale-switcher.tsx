"use client"; // usePathname y el posicionamiento del menú requieren el cliente.

import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, type ToggleEvent } from "react";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config";
import { switchLocale } from "@/lib/i18n/paths";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";

const GAP = 6; // px entre el botón y el menú

/**
 * Selector compacto "ES ▾". Usa la Popover API nativa: el menú va a la capa superior (no lo recorta
 * la barra con scroll horizontal del sidebar móvil) y se cierra solo al tocar afuera o con Esc.
 * Cambiar de idioma cambia el layout raíz (`[lang]`): Next hace una carga completa.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // El menú es `position: fixed`: se alinea al borde derecho del botón al abrirse; si así se saldría
  // por la izquierda (botón pegado al borde, como en el sidebar de escritorio), al borde izquierdo.
  const place = (event: ToggleEvent<HTMLDivElement>) => {
    const button = buttonRef.current;
    if (event.newState !== "open" || !button) return;
    const rect = button.getBoundingClientRect();
    const menu = event.currentTarget.style;
    menu.top = `${rect.bottom + GAP}px`;
    if (rect.right - event.currentTarget.offsetWidth < GAP) {
      menu.left = `${Math.max(rect.left, GAP)}px`;
      menu.right = "auto";
    } else {
      menu.right = `${Math.max(window.innerWidth - rect.right, GAP)}px`;
      menu.left = "auto";
    }
  };

  // Con el menú fijo, un scroll o un cambio de tamaño lo dejaría flotando lejos del botón: se cierra.
  useEffect(() => {
    const close = () => menuRef.current?.hidePopover();
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, []);

  return (
    <div className={className}>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={menuId}
        aria-label={`${t.common.language.label}: ${LOCALE_LABELS[locale]}`}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm px-2 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.6px]",
          "text-body transition-colors hover:bg-surface-raised hover:text-foreground",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        {locale}
        <ChevronDown aria-hidden="true" className="size-3.5" />
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        onToggle={place}
        className="fixed inset-auto m-0 min-w-36 rounded-md border border-border-strong bg-surface-raised p-1 text-body shadow-float"
      >
        <ul aria-label={t.common.language.label}>
          {LOCALES.map((target) => (
            <li key={target}>
              <Link
                href={switchLocale(pathname, target)}
                hrefLang={target}
                lang={target}
                prefetch={false}
                aria-current={target === locale ? "true" : undefined}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-ring",
                  target === locale ? "text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
                )}
              >
                {LOCALE_LABELS[target]}
                {target === locale ? <Check aria-hidden="true" className="size-4 text-accent" /> : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
