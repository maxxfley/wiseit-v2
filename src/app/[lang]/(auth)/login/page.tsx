import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { loginAction } from "@/features/auth/actions/login";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { safeRedirect } from "@/utils/safe-redirect";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).auth.login.title };
}

async function LoginForm({ searchParams }: Pick<PageProps<"/[lang]/login">, "searchParams">) {
  const { next } = await searchParams; // dato de request: por eso va dentro de <Suspense>
  const t = (await getDictionary()).auth.login;
  return (
    <AuthForm
      action={loginAction}
      submitLabel={t.submit}
      pendingLabel={t.pending}
      fields={["email", "password"]}
      passwordAutoComplete="current-password"
      hidden={{ next: safeRedirect(next) }}
      forgotPath={ROUTES.forgotPassword}
    />
  );
}

export default async function LoginPage({ searchParams }: PageProps<"/[lang]/login">) {
  const t = (await getDictionary()).auth.login;
  return (
    <AuthCard
      title={t.title}
      description={t.description}
      footerText={t.footerText}
      footerLinkLabel={t.footerLink}
      footerHref={localizePath(await getLocale(), ROUTES.signup)}
    >
      <Suspense fallback={<Skeleton className="h-60 w-full" />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
