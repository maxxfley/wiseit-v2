import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { logoutAction } from "@/features/auth/actions/logout";
import { getCurrentUser } from "@/features/auth/services/session";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";

/** Email + cierre de sesión. Lee cookies: siempre dentro de <Suspense>. */
export async function SidebarUser() {
  const user = await getCurrentUser();
  if (!user) redirect(localizePath(await getLocale(), ROUTES.login));
  const t = (await getDictionary()).common.nav;

  return (
    <div className="flex flex-col items-stretch gap-3">
      <p className="break-all text-xs text-muted-foreground">{user.email ?? t.userFallback}</p>
      <form action={logoutAction}>
        <Button type="submit" variant="secondary" className="w-full px-4 py-2 text-sm">
          {t.logout}
        </Button>
      </form>
    </div>
  );
}
