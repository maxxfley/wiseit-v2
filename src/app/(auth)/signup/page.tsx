import type { Metadata } from "next";
import { ROUTES } from "@/config/routes";
import { signupAction } from "@/features/auth/actions/signup";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Crear cuenta"
      description="Empezá a generar tus rutas de aprendizaje."
      footerText="¿Ya tenés cuenta?"
      footerLinkLabel="Ingresar"
      footerHref={ROUTES.login}
    >
      <AuthForm
        action={signupAction}
        submitLabel="Crear cuenta"
        pendingLabel="Creando cuenta…"
        fields={["email", "password", "confirmPassword"]}
      />
    </AuthCard>
  );
}
