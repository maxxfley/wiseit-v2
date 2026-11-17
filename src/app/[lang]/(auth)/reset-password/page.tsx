import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonStyles } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import { resetPasswordAction } from "@/features/auth/actions/reset-password";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { recoveryParamsSchema } from "@/features/auth/schemas/auth.schema";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).auth.reset.title, robots: { index: false } };
}

/** El token solo se consume al enviar el formulario (no al abrir el link): los escáneres de email no lo gastan. */
async function ResetContent({ searchParams }: Pick<PageProps<"/[lang]/reset-password">, "searchParams">) {
  const parsed = recoveryParamsSchema.safeParse(await searchParams);
  const dictionary = await getDictionary();
  const t = dictionary.auth.reset;

  if (!parsed.success) {
    return (
      <>
        <p role="alert" className="text-danger">{t.invalidLink}</p>
        <Link href={localizePath(await getLocale(), ROUTES.forgotPassword)} className={buttonStyles("secondary", "mt-6 w-full")}>
          {t.requestNew}
        </Link>
      </>
    );
  }
  return (
    <AuthForm
      action={resetPasswordAction}
      submitLabel={t.submit}
      pendingLabel={t.pending}
      fields={["password", "confirmPassword"]}
      passwordLabel={dictionary.auth.fields.newPassword}
      hidden={{ token_hash: parsed.data.token_hash, type: parsed.data.type }}
    />
  );
}

export default async function ResetPasswordPage({ searchParams }: PageProps<"/[lang]/reset-password">) {
  const t = (await getDictionary()).auth.reset;
  return (
    <AuthCard
      title={t.title}
      description={t.description}
      footerText={t.footerText}
      footerLinkLabel={t.footerLink}
      footerHref={localizePath(await getLocale(), ROUTES.login)}
    >
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
