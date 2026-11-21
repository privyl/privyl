import { notFound } from "next/navigation";
import { CopyCommand } from "@/components/CopyCommand";
import { DropScan } from "@/components/DropScan";
import { HeroDemo } from "@/components/HeroDemo";
import { Reveal } from "@/components/Reveal";
import { ButtonLink } from "@/components/ui";
import { ScanDemo } from "@/components/ScanDemo";
import {
  Anywhere,
  BeforeAfter,
  Coverage,
  FinalCta,
  Heading,
  heroParts,
  HowItWorks,
  Section,
  Trust,
} from "@/components/Sections";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { loadExamples } from "@/lib/server";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const examples = loadExamples();

  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-20 overflow-hidden pt-40 pb-8">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0 -z-10" />
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0 -z-10" />

        <div className="mx-auto max-w-4xl px-6 text-center motion-safe:animate-fade-up">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/50 px-4 py-1.5 font-mono text-xs tracking-[0.3em] text-fg backdrop-blur">
            <span
              className="size-1.5 rounded-full bg-sky shadow-[0_0_10px] shadow-sky"
              aria-hidden="true"
            />
            {t.hero.badge}
          </p>
          <h1 className="mt-8 text-5xl font-medium tracking-tight text-balance sm:text-6xl lg:text-[4.25rem] lg:leading-[1.05]">
            {t.hero.title1}
            <br />
            <span className="bg-gradient-to-r from-sky to-sky-deep bg-clip-text text-transparent">
              {t.hero.title2}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted text-pretty">
            {t.hero.subtitle}
          </p>

          <div className="mt-9 flex flex-col items-center gap-4">
            <CopyCommand
              command="npm install privyl"
              copyLabel={t.hero.copy}
              copiedLabel={t.hero.copied}
            />
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href={`/${lang}/docs`} variant="primary">
                {t.hero.getStarted}
              </ButtonLink>
              <ButtonLink href={`/${lang}/playground`} arrow={false}>
                {t.hero.tryIt}
              </ButtonLink>
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

        {/* Product window rising from the hero */}
        <div className="mx-auto mt-16 max-w-3xl px-6">
          <HeroDemo parts={heroParts(t.heroDemo.sample, lang)} t={t.heroDemo} />
        </div>
      </section>

      {/* Live scan demo: the centerpiece */}
      <section id="demo" className="mx-auto mt-28 max-w-5xl scroll-mt-24 px-6">
        <Reveal>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-sky">
              {t.demo.kicker}
            </p>
            <Heading title={t.demo.title} center />
            <p className="mt-3 text-lg text-muted text-pretty">{t.demo.subtitle}</p>
          </div>
          <ScanDemo projects={examples} lang={lang} t={t.demo} />
        </Reveal>
      </section>

      <Section id="try" title={t.drop.title} subtitle={t.drop.subtitle}>
        <DropScan lang={lang} t={t.drop} />
      </Section>

      <BeforeAfter lang={lang} t={t.beforeAfter} />
      <HowItWorks lang={lang} t={t.how} />
      <Anywhere t={t.anywhere} />
      <Coverage lang={lang} t={t.coverage} />
      <Trust lang={lang} t={t.trust} />
      <FinalCta lang={lang} t={t.cta} copy={t.hero} />
    </>
  );
}
