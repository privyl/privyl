import Link from "next/link";
import { createShield, type Detector } from "privyl";
import { br } from "privyl/br";
import { global } from "privyl/global";
import type { ReactNode } from "react";
import { GITHUB_URL, type Dictionary, type Locale } from "@/i18n/dictionaries";
import { maskedSegments, rawSegments } from "@/lib/highlight";
import { Highlighted } from "./Highlighted";

const shield = createShield({ detectors: [...global, ...br] });

export function Section({
  id,
  title,
  subtitle,
  children,
  kicker,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto mt-32 max-w-6xl scroll-mt-24 px-6">
      <div className="mb-10 max-w-2xl">
        {kicker && <p className="mb-3 text-sm text-sky">{kicker}</p>}
        <h2 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-muted text-pretty">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function BeforeAfter({ t }: { t: Dictionary["beforeAfter"] }) {
  const { text, findings } = shield.mask(t.sample);
  return (
    <Section title={t.title} subtitle={t.subtitle}>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel label={t.before} dot="bg-alert">
          <Highlighted segments={rawSegments(t.sample, findings)} tone="alert" />
        </Panel>
        <Panel label={t.after} dot="bg-sky">
          <Highlighted segments={maskedSegments(text, findings, t.sample)} tone="sky" />
        </Panel>
      </div>
    </Section>
  );
}

function Panel({ label, dot, children }: { label: string; dot: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <p className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
        <span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />
        {label}
      </p>
      <p className="font-mono text-sm leading-loose">{children}</p>
    </div>
  );
}

export function HowItWorks({ t }: { t: Dictionary["how"] }) {
  const code = [
    `const { text, vault } = shield.mask(input);`,
    `const answer = await ai.ask(text);`,
    `const reply = shield.unmask(answer, vault);`,
  ];
  return (
    <Section title={t.title}>
      <ol className="grid gap-4 md:grid-cols-3">
        {t.steps.map((step, i) => (
          <li key={step.title} className="rounded-xl border border-line bg-surface p-6">
            <span className="font-mono text-xs text-sky">0{i + 1}</span>
            <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
            <p className="mt-2 text-sm text-muted text-pretty">{step.body}</p>
            <pre className="mt-5 overflow-x-auto rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs text-fg/80">
              {code[i]}
            </pre>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Anywhere({ t }: { t: Dictionary["anywhere"] }) {
  const ai = ["Claude", "GPT", "Gemini", "Llama", "Mistral", "DeepSeek", t.localModels];
  const runtimes = ["Node.js", "Bun", "Deno", t.browsers, t.edge];
  const Row = ({ label, items }: { label: string; items: string[] }) => (
    <div>
      <p className="mb-3 text-xs uppercase tracking-wider text-muted">{label}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <Section title={t.title} subtitle={t.subtitle}>
      <div className="grid gap-8 md:grid-cols-2">
        <Row label={t.ai} items={ai} />
        <Row label={t.runtimes} items={runtimes} />
      </div>
    </Section>
  );
}

/** Unique detector labels, so the table always matches the library. */
const labelsOf = (detectors: readonly Detector[], secrets: string) => [
  ...new Set(detectors.map((d) => (d.id.startsWith("global.secret") ? secrets : d.label))),
];

export function Coverage({ t }: { t: Dictionary["coverage"] }) {
  const rows = [
    { flag: "🌐", country: t.global, labels: labelsOf(global, t.secrets) },
    { flag: "🇧🇷", country: t.br, labels: labelsOf(br, t.secrets) },
  ];
  return (
    <Section title={t.title} subtitle={t.subtitle}>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-5 py-3 font-normal">
                {t.country}
              </th>
              <th scope="col" className="px-5 py-3 font-normal">
                {t.data}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.country} className="border-t border-line">
                <th scope="row" className="px-5 py-4 align-top font-medium whitespace-nowrap">
                  <span aria-hidden="true">{row.flag}</span> {row.country}
                </th>
                <td className="px-5 py-4">
                  <ul className="flex flex-wrap gap-2">
                    {row.labels.map((label) => (
                      <li key={label} className="rounded-md border border-line px-2 py-0.5 text-xs">
                        {label}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
            <tr className="border-t border-line">
              <td colSpan={2} className="px-5 py-4">
                <a
                  href={`${GITHUB_URL}/blob/main/CONTRIBUTING.md#how-to-add-a-country`}
                  className="text-sm text-sky hover:underline"
                >
                  + {t.addCountry} →
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted">
        <span className="text-fg">{t.notDetectedTitle}:</span> {t.notDetected}
      </p>
    </Section>
  );
}

export function Trust({ lang, t }: { lang: Locale; t: Dictionary["trust"] }) {
  const link =
    "inline-flex items-center gap-1 rounded-lg border border-line px-4 py-2 text-sm transition-colors hover:border-sky/50";
  return (
    <Section title={t.title}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.items.map((item) => (
          <li key={item.title} className="rounded-xl border border-line bg-surface p-6">
            <h3 className="font-medium">{item.title}</h3>
            <p className="mt-2 text-sm text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={GITHUB_URL} className={link}>
          {t.source} ↗
        </a>
        <a href={`${GITHUB_URL}/blob/main/SECURITY.md`} className={link}>
          {t.security} ↗
        </a>
        <Link href={`/${lang}/benchmark`} className={link}>
          {t.benchmark} →
        </Link>
      </div>
      <p className="mt-6 text-sm text-muted">{t.disclaimer}</p>
    </Section>
  );
}
