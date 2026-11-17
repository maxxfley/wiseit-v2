import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { localizePath } from "@/lib/i18n/paths";
import { getLocale } from "@/lib/i18n/server";

export async function Logo() {
  return (
    <Link href={localizePath(await getLocale(), ROUTES.home)} className="font-display text-2xl tracking-[-0.5px] text-foreground">
      Wiseit
    </Link>
  );
}
