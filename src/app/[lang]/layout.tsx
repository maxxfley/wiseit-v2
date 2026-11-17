import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { LOCALES } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/provider";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import "../globals.css";

// Inter para toda la UI; Inter Tight solo en titulares (DESIGN.md › Typography); mono para código y etiquetas.
// `cyrillic` para el ruso: sin ese subset, el navegador usa una fuente del sistema para el cirílico.
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"], display: "swap" });

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "cyrillic"],
  weight: "500",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

/** Con `cacheComponents`, cada root param necesita sus valores: se prerenderiza un shell por idioma. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: { default: "Wiseit", template: "%s | Wiseit" },
    description: t.common.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const fontVars = `${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`;
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${fontVars} antialiased`}>
      <body className="flex min-h-[100dvh] flex-col">
        <I18nProvider locale={locale} dictionary={dictionary}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
