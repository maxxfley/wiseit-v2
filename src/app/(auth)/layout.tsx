import { Logo } from "@/components/layout/logo";

/** Layout de login y signup: marca arriba y tarjeta centrada. Sin lectura de sesión (la gestiona el proxy). */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-page flex-1 flex-col px-6 py-8">
      <Logo />
      <main className="flex flex-1 items-center justify-center py-12">{children}</main>
    </div>
  );
}
