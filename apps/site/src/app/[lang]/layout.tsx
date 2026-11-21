import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getDictionary, isLocale, locales } from "@/i18n/dictionaries";
import "../globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

type Props = { children: ReactNode; params: Promise<{ lang: string }> };

// Pre-render /en and /pt at build time. Any other language returns 404.
export const generateStaticParams = () => locales.map((lang) => ({ lang }));
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    title: { default: t.meta.title, template: "%s · Privyl" },
    description: t.meta.description,
    alternates: { languages: { en: "/en", "pt-BR": "/pt" } },
    openGraph: { title: t.meta.title, description: t.meta.description, type: "website" },
  };
}

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <html lang={lang === "pt" ? "pt-BR" : "en"} className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-bg text-fg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-bg"
        >
          {t.nav.skip}
        </a>
        <Navbar lang={lang} t={t.nav} />
        <main id="main">{children}</main>
        <Footer lang={lang} t={t} />
      </body>
    </html>
  );
}
