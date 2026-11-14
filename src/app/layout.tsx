import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Serif solo para titulares (DESIGN.md › Do's). El cuerpo usa la pila del sistema.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Wiseit",
    template: "%s | Wiseit",
  },
  description:
    "Rutas de aprendizaje generadas con IA, organizadas por niveles Básico, Intermedio y Avanzado.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fraunces.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="flex min-h-[100dvh] flex-col">{children}</body>
    </html>
  );
}
