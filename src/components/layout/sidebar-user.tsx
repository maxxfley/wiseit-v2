import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { logoutAction } from "@/features/auth/actions/logout";
import { getCurrentUser } from "@/features/auth/services/session";

/** Email + cierre de sesión. Lee cookies: siempre dentro de <Suspense>. */
export async function SidebarUser() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.login);

  return (
    <div className="flex items-center gap-3 md:flex-col md:items-stretch">
      <p className="hidden break-all text-xs text-muted-foreground md:block">{user.email ?? "Usuario"}</p>
      <form action={logoutAction}>
        <Button type="submit" variant="secondary" className="w-full px-4 py-2 text-sm">
          Salir
        </Button>
      </form>
    </div>
  );
}
