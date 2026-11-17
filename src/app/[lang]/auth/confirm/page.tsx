import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { ConfirmForm } from "@/features/auth/components/confirm-form";
import { confirmParamsSchema } from "@/features/auth/schemas/auth.schema";
import { localizePath } from "@/lib/i18n/paths";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).auth.confirm.metaTitle, robots: { index: false } };
}

async function ConfirmContent({ searchParams }: Pick<PageProps<"/[lang]/auth/confirm">, "searchParams">) {
  const parsed = confirmParamsSchema.safeParse(await searchParams);

  if (!parsed.success) {
    const t = (await getDictionary()).auth.confirm;
    return (
      <>
        <p role="alert" className="text-danger">{t.invalidLink}</p>
        <Link href={localizePath(await getLocale(), ROUTES.signup)} className={buttonStyles("secondary", "mt-6 w-full")}>
          {t.signup}
        </Link>
      </>
    );
  }
  return <ConfirmForm tokenHash={parsed.data.token_hash} type={parsed.data.type} />;
}

export default async function ConfirmPage({ searchParams }: PageProps<"/[lang]/auth/confirm">) {
  const t = (await getDictionary()).auth.confirm;
  return (
    <main className="mx-auto flex w-full max-w-page flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md bg-surface-raised p-8">
        <h1 className="font-display text-3xl font-medium tracking-[-0.8px] text-foreground">{t.title}</h1>
        <p className="mt-2 mb-8 text-muted-foreground">{t.description}</p>
        <Suspense fallback={<Skeleton className="h-11 w-full" />}>
          <ConfirmContent searchParams={searchParams} />
        </Suspense>
      </Card>
    </main>
  );
}
