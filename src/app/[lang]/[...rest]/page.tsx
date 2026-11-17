import { notFound } from "next/navigation";

/**
 * Catch-all: una URL inexistente bajo un idioma ("/ru/xyz") cae aquí y renderiza `[lang]/not-found.tsx`
 * con el layout y el idioma correctos. Sin esto, Next muestra su 404 genérico (sin layout ni traducción).
 */
export default function CatchAllPage() {
  notFound();
}
