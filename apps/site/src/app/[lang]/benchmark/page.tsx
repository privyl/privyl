import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GitHubIcon } from "@/components/Navbar";
import { GITHUB_URL, getDictionary, isLocale } from "@/i18n/dictionaries";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).benchmark.title } : {};
}

export default async function BenchmarkPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang).benchmark;

  return (
    <div className="mx-auto max-w-2xl px-6 pt-24 text-center">
      <p className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-1.5 text-sm text-muted">
        <span className="size-1.5 rounded-full bg-sky" aria-hidden="true" />
        {t.soon}
      </p>
      <h1 className="mt-6 text-4xl font-medium tracking-tight">{t.title}</h1>
      <p className="mt-4 text-muted text-pretty">{t.body}</p>
      <a
        href={GITHUB_URL}
        className="mt-8 inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-sm transition-colors hover:border-sky/50"
      >
        <GitHubIcon />
        {t.follow}
      </a>
    </div>
  );
}
