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

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };

/** El token solo se consume al enviar el formulario (no al abrir el link): los escáneres de email no lo gastan. */
async function ResetContent({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const parsed = recoveryParamsSchema.safeParse(await searchParams);

  if (!parsed.success) {
    return (
      <>
        <p role="alert" className="text-danger">El link de recuperación no es válido.</p>
        <Link href={ROUTES.forgotPassword} className={buttonStyles("secondary", "mt-6 w-full")}>
          Pedir un link nuevo
        </Link>
      </>
    );
  }
  return (
    <AuthForm
      action={resetPasswordAction}
      submitLabel="Guardar contraseña"
      pendingLabel="Guardando…"
      fields={["password", "confirmPassword"]}
      passwordLabel="Nueva contraseña"
      hidden={{ token_hash: parsed.data.token_hash, type: parsed.data.type }}
    />
  );
}

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <AuthCard
      title="Nueva contraseña"
      description="Elegí una contraseña nueva para tu cuenta."
      footerText="¿Volver?"
      footerLinkLabel="Ingresar"
      footerHref={ROUTES.login}
    >
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
