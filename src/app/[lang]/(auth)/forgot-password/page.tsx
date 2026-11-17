import type { Metadata } from "next";
import { ROUTES } from "@/config/routes";
import { forgotPasswordAction } from "@/features/auth/actions/forgot-password";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).auth.forgot.title };
}

export default async function ForgotPasswordPage() {
  const t = (await getDictionary()).auth.forgot;
  return (
    <AuthCard
      title={t.title}
      description={t.description}
      footerText={t.footerText}
      footerLinkLabel={t.footerLink}
      footerHref={localizePath(await getLocale(), ROUTES.login)}
    >
      <AuthForm action={forgotPasswordAction} submitLabel={t.submit} pendingLabel={t.pending} fields={["email"]} />
    </AuthCard>
  );
}
