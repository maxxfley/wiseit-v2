import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-page flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
        <Logo />
        <p className="text-sm text-muted-foreground">
          Rutas de aprendizaje con IA, de Básico a Avanzado.
        </p>
      </div>
    </footer>
  );
}
