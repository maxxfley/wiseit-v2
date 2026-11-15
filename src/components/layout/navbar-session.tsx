import Link from "next/link";
import { Button, buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { logoutAction } from "@/features/auth/actions/logout";
import { getCurrentUser } from "@/features/auth/services/session";

/** Lee la sesión (cookies): siempre dentro de <Suspense> por `cacheComponents`. */
export async function NavbarSession() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link href={ROUTES.dashboard} className={buttonStyles("ghost")}>
          Dashboard
        </Link>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost">
            Salir
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={ROUTES.login} className={buttonStyles("ghost")}>
        Ingresar
      </Link>
      <Link href={ROUTES.signup} className={buttonStyles("primary", "px-4 py-2 text-sm")}>
        Crear cuenta
      </Link>
    </div>
  );
}
