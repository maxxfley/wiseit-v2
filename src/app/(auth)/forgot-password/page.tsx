import type { Metadata } from "next";
import { ROUTES } from "@/config/routes";
import { forgotPasswordAction } from "@/features/auth/actions/forgot-password";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Recuperar contraseña"
      description="Ingresá tu email y te enviamos un link para elegir una nueva."
      footerText="¿Te acordaste?"
      footerLinkLabel="Ingresar"
      footerHref={ROUTES.login}
    >
      <AuthForm
        action={forgotPasswordAction}
        submitLabel="Enviar link"
        pendingLabel="Enviando…"
        fields={["email"]}
      />
    </AuthCard>
  );
}
