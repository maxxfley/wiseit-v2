import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="font-display text-3xl font-medium tracking-[-0.6px] text-foreground">
        No encontramos esa ruta
      </h1>
      <p className="max-w-[72ch] text-muted-foreground">
        Puede que haya sido eliminada o que no te pertenezca.
      </p>
      <Link href={ROUTES.roadmaps} className={buttonStyles("secondary")}>
        Volver a mis rutas
      </Link>
    </div>
  );
}
