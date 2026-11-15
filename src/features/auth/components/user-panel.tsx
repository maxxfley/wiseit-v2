import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { logoutAction } from "../actions/logout";
import { getCurrentUser } from "../services/session";

/** Panel provisional del dashboard (Paso 3). El Paso 5 lo reemplaza. Lee la sesión: va en Suspense. */
export async function UserPanel() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  return (
    <Card className="max-w-md">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-muted-foreground">
        Sesión activa
      </p>
      <p className="mt-2 break-all text-lg text-foreground">{user.email ?? "Usuario"}</p>
      <form action={logoutAction} className="mt-6">
        <Button type="submit" variant="secondary">
          Cerrar sesión
        </Button>
      </form>
    </Card>
  );
}
