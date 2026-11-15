import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-page flex-1 flex-col items-start justify-center gap-6 px-6 py-section">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="font-serif text-4xl font-medium tracking-[-0.8px] text-foreground">Esta página no existe</h1>
      <p className="max-w-[72ch] text-lg text-muted-foreground">
        Puede que el enlace esté roto o que la página se haya movido.
      </p>
      <Link href="/" className={buttonStyles("primary")}>
        Volver al inicio
      </Link>
    </main>
  );
}
