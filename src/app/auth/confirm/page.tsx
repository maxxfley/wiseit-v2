import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { ConfirmForm } from "@/features/auth/components/confirm-form";
import { confirmParamsSchema } from "@/features/auth/schemas/auth.schema";

export const metadata: Metadata = { title: "Confirmar email", robots: { index: false } };

async function ConfirmContent({ searchParams }: Pick<PageProps<"/auth/confirm">, "searchParams">) {
  const parsed = confirmParamsSchema.safeParse(await searchParams);

  if (!parsed.success) {
    return (
      <>
        <p role="alert" className="text-danger">El link de confirmación no es válido.</p>
        <Link href={ROUTES.signup} className={buttonStyles("secondary", "mt-6 w-full")}>
          Crear cuenta
        </Link>
      </>
    );
  }
  return <ConfirmForm tokenHash={parsed.data.token_hash} type={parsed.data.type} />;
}

export default function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  return (
    <main className="mx-auto flex w-full max-w-page flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md bg-surface-raised p-8">
        <h1 className="font-serif text-3xl font-medium tracking-[-0.8px] text-foreground">
          Confirmá tu email
        </h1>
        <p className="mt-2 mb-8 text-muted-foreground">
          Un último paso para activar tu cuenta de Wiseit.
        </p>
        <Suspense fallback={<Skeleton className="h-11 w-full" />}>
          <ConfirmContent searchParams={searchParams} />
        </Suspense>
      </Card>
    </main>
  );
}
