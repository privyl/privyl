import Link from "next/link";
import { CopyCommand } from "@/components/CopyCommand";
import { DropScan } from "@/components/DropScan";
import { GitHubIcon } from "@/components/Navbar";
import { ScanDemo } from "@/components/ScanDemo";
import { Anywhere, BeforeAfter, Coverage, HowItWorks, Section, Trust } from "@/components/Sections";
import { GITHUB_URL, getDictionary, isLocale } from "@/i18n/dictionaries";
import { loadExamples } from "@/lib/server";
import { notFound } from "next/navigation";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const examples = loadExamples();

  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-20 overflow-hidden pt-40 pb-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 0%, rgb(3 32 61 / 0.95) 0%, rgb(3 32 61 / 0.35) 55%, transparent 100%), radial-gradient(30% 30% at 70% 20%, rgb(99 156 197 / 0.18), transparent 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full opacity-[0.15] [background-image:linear-gradient(rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />

        <div className="mx-auto max-w-4xl px-6 text-center motion-safe:animate-fade-up">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-line-strong bg-bg/40 px-4 py-1.5 text-sm text-muted backdrop-blur">
            <span className="size-1.5 rounded-full bg-sky" aria-hidden="true" />
            {t.hero.badge}
          </p>
          <h1 className="mt-8 text-5xl font-medium tracking-tight text-balance sm:text-6xl lg:text-[4.25rem] lg:leading-[1.05]">
            {t.hero.title1}
            <br />
            <span className="text-sky">{t.hero.title2}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted text-pretty">{t.hero.subtitle}</p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <CopyCommand
              command="npm install privyl"
              copyLabel={t.hero.copy}
              copiedLabel={t.hero.copied}
            />
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={`/${lang}/docs`}
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                {t.hero.getStarted} →
              </Link>
              <a
                href={GITHUB_URL}
                className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-sm transition-colors hover:border-sky/50"
              >
                <GitHubIcon />
                {t.hero.github}
              </a>
            </div>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-muted">
            {t.hero.facts.map((fact, i) => (
              <li key={fact} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true">·</span>}
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Live scan demo: the centerpiece */}
      <section id="demo" className="mx-auto max-w-5xl scroll-mt-24 px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="mb-3 text-sm text-sky">{t.demo.kicker}</p>
          <h2 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">
            {t.demo.title}
          </h2>
          <p className="mt-3 text-muted text-pretty">{t.demo.subtitle}</p>
        </div>
        <ScanDemo projects={examples} t={t.demo} />
      </section>

      <Section id="try" title={t.drop.title} subtitle={t.drop.subtitle}>
        <DropScan t={t.drop} />
      </Section>

      <BeforeAfter t={t.beforeAfter} />
      <HowItWorks t={t.how} />
      <Anywhere t={t.anywhere} />
      <Coverage t={t.coverage} />
      <Trust lang={lang} t={t.trust} />
    </>
  );
}
