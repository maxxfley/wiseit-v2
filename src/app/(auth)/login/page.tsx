import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { loginAction } from "@/features/auth/actions/login";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { safeRedirect } from "@/utils/safe-redirect";

export const metadata: Metadata = { title: "Ingresar" };

async function LoginForm({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next } = await searchParams; // dato de request: por eso va dentro de <Suspense>
  return (
    <AuthForm
      action={loginAction}
      submitLabel="Ingresar"
      pendingLabel="Ingresando…"
      passwordAutoComplete="current-password"
      next={safeRedirect(next)}
    />
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard
      title="Ingresar"
      description="Entrá a tu cuenta para ver tus rutas."
      footerText="¿No tenés cuenta?"
      footerLinkLabel="Crear cuenta"
      footerHref={ROUTES.signup}
    >
      <Suspense fallback={<Skeleton className="h-60 w-full" />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
