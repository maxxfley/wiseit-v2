import { cn } from "@/utils/cn";
import { LocaleDropdown } from "./locale-dropdown";
import { LocaleLinks } from "./locale-links";

/**
 * Selector de idioma: en escritorio (≥ md) los tres códigos en línea; en celular el desplegable
 * compacto "ES ▾", que ocupa menos ancho. Mismo corte que el sidebar del panel.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <LocaleLinks className="hidden md:flex" />
      <LocaleDropdown className="md:hidden" />
    </div>
  );
}
