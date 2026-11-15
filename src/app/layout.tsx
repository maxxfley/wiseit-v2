import type { Metadata } from "next";
import { IBM_Plex_Serif, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Inter para toda la UI; la serif solo en titulares (DESIGN.md › Typography); mono para código y etiquetas.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: "500",
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
  const fontVars = `${inter.variable} ${plexSerif.variable} ${jetbrainsMono.variable}`;
  return (
    <html lang="es" className={`${fontVars} antialiased`}>
      <body className="flex min-h-[100dvh] flex-col">{children}</body>
    </html>
  );
}
