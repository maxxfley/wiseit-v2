import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description: string;
  footerText: string;
  footerLinkLabel: string;
  footerHref: string;
  children: ReactNode;
}

/** Marco común de las pantallas de auth: título, formulario y enlace alternativo. */
export function AuthCard({
  title,
  description,
  footerText,
  footerLinkLabel,
  footerHref,
  children,
}: AuthCardProps) {
  return (
    <Card className="w-full max-w-md animate-fade-up bg-surface-raised p-8">
      <h1 className="font-display text-3xl font-medium tracking-[-0.8px] text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-8">{children}</div>
      <p className="mt-6 text-sm text-muted-foreground">
        {footerText}{" "}
        <Link href={footerHref} className="font-medium text-accent hover:text-foreground">
          {footerLinkLabel}
        </Link>
      </p>
    </Card>
  );
}
