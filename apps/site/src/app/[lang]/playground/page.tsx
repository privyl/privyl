import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Playground } from "@/components/Playground";
import { getDictionary, isLocale } from "@/i18n/dictionaries";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).playground.title } : {};
}

export default async function PlaygroundPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang).playground;

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16">
      <h1 className="text-4xl font-medium tracking-tight">{t.title}</h1>
      <p className="mt-3 mb-10 text-muted">{t.subtitle}</p>
      <Playground t={t} />
    </div>
  );
}
