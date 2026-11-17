import Link from "next/link";
import { Button, buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { logoutAction } from "@/features/auth/actions/logout";
import { getCurrentUser } from "@/features/auth/services/session";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";

/** Lee la sesión (cookies): siempre dentro de <Suspense> por `cacheComponents`. */
export async function NavbarSession() {
  const user = await getCurrentUser();
  const t = (await getDictionary()).common.nav;
  const locale = await getLocale();

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link href={localizePath(locale, ROUTES.dashboard)} className={buttonStyles("ghost")}>
          {t.dashboard}
        </Link>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost">
            {t.logout}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={localizePath(locale, ROUTES.login)} className={buttonStyles("ghost")}>
        {t.login}
      </Link>
      <Link href={localizePath(locale, ROUTES.signup)} className={buttonStyles("primary", "px-4 py-2 text-sm")}>
        {t.signup}
      </Link>
    </div>
  );
}
