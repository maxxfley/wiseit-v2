import Link from "next/link";
import { ROUTES } from "@/config/routes";

export function Logo() {
  return (
    <Link href={ROUTES.home} className="font-serif text-2xl tracking-[-0.5px] text-foreground">
      Wiseit
    </Link>
  );
}
