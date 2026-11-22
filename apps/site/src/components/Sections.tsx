import { createShield, type Detector } from "privyl";
import { ar } from "privyl/ar";
import { br } from "privyl/br";
import { cl } from "privyl/cl";
import { global } from "privyl/global";
import { mx } from "privyl/mx";
import { pt } from "privyl/pt";
import { us } from "privyl/us";
import type { ReactNode } from "react";
import {
  siBun,
  siClaude,
  siCloudflare,
  siDeepseek,
  siDeno,
  siGooglegemini,
  siMeta,
  siMistralai,
  siNodedotjs,
  siOllama,
  siVercel,
} from "simple-icons";
import { GITHUB_URL, type Dictionary, type Locale } from "@/i18n/dictionaries";
import { detectorLabel, localizeSegments } from "@/i18n/labels";
import { maskedSegments, rawSegments, type Segment } from "@/lib/highlight";
import { BeforeAfterTabs, type Scenario } from "./BeforeAfter";
import { BrandSvg, siOpenai, type BrandIcon } from "./brands";
import { CopyCommand } from "./CopyCommand";
import { FlagAR, FlagBR, FlagCL, FlagMX, FlagPT, FlagUS, FlagWorld } from "./Flags";
import type { HeroPart } from "./HeroDemo";
import { GitHubIcon } from "./Navbar";
import { Reveal } from "./Reveal";
import { StepsDemo, type StepsData } from "./StepsDemo";
import { ArrowUpRight, ButtonLink, CheckIcon, Pill } from "./ui";

// Runs on the server: every example below is real output of the library.
const shield = createShield({ detectors: [...global, ...br] });

/** Two-line heading: the first line bright, the second line muted ("\n" splits them). */
export function Heading({ title, center = false }: { title: string; center?: boolean }) {
  const [first, ...rest] = title.split("\n");
  return (
    <h2
      className={`text-3xl font-medium tracking-tight text-balance sm:text-[2.75rem] sm:leading-[1.1] ${center ? "mx-auto" : ""}`}
    >
      {first}
      {rest.length > 0 && (
        <>
          <br />
          <span className="text-muted">{rest.join(" ")}</span>
        </>
      )}
    </h2>
  );
}

export function Section({
  id,
  title,
  subtitle,
  children,
  kicker,
  action,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  kicker?: string;
  /** Optional link shown at the right of the heading (below it on phones). */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto mt-40 max-w-6xl scroll-mt-24 px-6">
      <Reveal>
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            {kicker && (
              <p className="mb-3 font-mono text-xs tracking-[0.2em] text-sky uppercase">{kicker}</p>
            )}
            <Heading title={title} />
            {subtitle && <p className="mt-4 text-lg text-muted text-pretty">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </Reveal>
    </section>
  );
}

/** Splits the hero sample into plain text and detected values (for the hero animation). */
export function heroParts(sample: string, lang: Locale): HeroPart[] {
  const { findings } = shield.mask(sample);
  const parts: HeroPart[] = [];
  let cursor = 0;
  for (const f of findings) {
    if (f.start > cursor) parts.push({ text: sample.slice(cursor, f.start) });
    parts.push({
      value: sample.slice(f.start, f.end),
      placeholder: f.placeholder,
      label: detectorLabel(f.label, lang),
    });
    cursor = f.end;
  }
  if (cursor < sample.length) parts.push({ text: sample.slice(cursor) });
  return parts;
}

export function BeforeAfter({ lang, t }: { lang: Locale; t: Dictionary["beforeAfter"] }) {
  const scenarios: Scenario[] = Object.entries(t.scenarios).map(([id, s]) => {
    const { text, findings } = shield.mask(s.text);
    return {
      id,
      label: s.label,
      raw: localizeSegments(rawSegments(s.text, findings), lang),
      masked: localizeSegments(maskedSegments(text, findings, s.text), lang),
      count: findings.length,
    };
  });
  return (
    <Section title={t.title} subtitle={t.subtitle}>
      <BeforeAfterTabs
        scenarios={scenarios}
        before={t.before}
        after={t.after}
        foundLabel={t.found}
      />
    </Section>
  );
}

/**
 * Builds the "How it works" screens with the real library:
 * mask the sample, write an AI reply that uses the placeholders, then unmask it.
 * In the reply template, {0} is the first finding's placeholder and {0~} the same in lowercase.
 */
function stepsData(sample: string, template: string, lang: Locale): StepsData {
  const { text, vault, findings } = shield.mask(sample);
  const items = findings.map((f) => ({
    label: detectorLabel(f.label, lang),
    placeholder: f.placeholder,
    value: sample.slice(f.start, f.end),
    confidence: f.confidence,
  }));

  const reply: Segment[] = [];
  const restored: Segment[] = [];
  let cursor = 0;
  for (const m of template.matchAll(/\{(\d+)(~?)\}/g)) {
    const before = template.slice(cursor, m.index);
    reply.push({ text: before });
    restored.push({ text: before });
    const item = items[Number(m[1])];
    if (item) {
      reply.push({
        text: m[2] ? item.placeholder.toLowerCase() : item.placeholder,
        label: item.label,
      });
      restored.push({ text: item.value, label: item.label });
    }
    cursor = m.index + m[0].length;
  }
  reply.push({ text: template.slice(cursor) });
  restored.push({ text: template.slice(cursor) });

  // Show what the real unmask() returns. If it ever differs from our highlighted version,
  // fall back to the plain real output (never show something the library did not do).
  const real = shield.unmask(reply.map((s) => s.text).join(""), vault);
  const restoredOk = restored.map((s) => s.text).join("") === real;

  return {
    input: localizeSegments(rawSegments(sample, findings), lang),
    masked: localizeSegments(maskedSegments(text, findings, sample), lang),
    reply,
    restored: restoredOk ? restored : [{ text: real }],
    findings: items,
  };
}

export function HowItWorks({ lang, t }: { lang: Locale; t: Dictionary["how"] }) {
  return (
    <Section
      id="how"
      title={t.title}
      subtitle={t.subtitle}
      action={
        <ButtonLink href={`/${lang}/docs`} size="sm">
          {t.guide}
        </ButtonLink>
      }
    >
      <StepsDemo data={stepsData(t.sample, t.reply, lang)} t={t} />

      <div className="card mt-4 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <h3 className="text-lg font-medium">{t.closing.title}</h3>
          <p className="mt-1 text-sm text-muted text-pretty">{t.closing.body}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <ButtonLink href={`/${lang}/docs`} variant="primary">
            {t.closing.cta}
          </ButtonLink>
          <span className="text-xs text-muted">{t.closing.note}</span>
        </div>
      </div>
    </Section>
  );
}

interface Brand {
  name: string;
  href: string;
  icon?: BrandIcon;
  caption?: string;
}

function BrandTile({ brand, openLabel }: { brand: Brand; openLabel: string }) {
  return (
    <li>
      <a
        href={brand.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${openLabel} ${brand.name}`}
        className="card card-hover group flex h-full flex-col items-center justify-center gap-3 px-4 pt-7 pb-6 text-center"
      >
        <span className="absolute top-3 right-3 text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowUpRight />
        </span>
        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-bg/60 shadow-[inset_0_1px_0] shadow-white/5 transition-transform duration-300 group-hover:scale-105">
          {brand.icon ? (
            <BrandSvg icon={brand.icon} className="size-6" />
          ) : (
            <span className="font-mono text-sm text-fg" aria-hidden="true">
              {brand.name.slice(0, 1)}
            </span>
          )}
        </span>
        <span className="text-sm font-medium">{brand.name}</span>
        {brand.caption && <span className="-mt-2 text-xs text-muted">{brand.caption}</span>}
      </a>
    </li>
  );
}

export function Anywhere({ t }: { t: Dictionary["anywhere"] }) {
  const ai: Brand[] = [
    { name: "Claude", href: "https://claude.ai", icon: siClaude },
    { name: "ChatGPT", href: "https://chatgpt.com", icon: siOpenai },
    { name: "Gemini", href: "https://gemini.google.com", icon: siGooglegemini },
    { name: "Llama", href: "https://www.llama.com", icon: siMeta },
    { name: "Mistral", href: "https://mistral.ai", icon: siMistralai },
    { name: "DeepSeek", href: "https://www.deepseek.com", icon: siDeepseek },
    { name: "Ollama", href: "https://ollama.com", icon: siOllama, caption: t.localModels },
  ];
  const runtimes: Brand[] = [
    { name: "Node.js", href: "https://nodejs.org", icon: siNodedotjs },
    { name: "Bun", href: "https://bun.sh", icon: siBun },
    { name: "Deno", href: "https://deno.com", icon: siDeno },
    {
      name: "Cloudflare",
      href: "https://workers.cloudflare.com",
      icon: siCloudflare,
      caption: "Workers",
    },
    { name: "Vercel", href: "https://vercel.com", icon: siVercel, caption: "Edge" },
  ];
  return (
    <Section title={t.title} subtitle={t.subtitle}>
      <p className="mb-3 font-mono text-xs tracking-[0.2em] text-muted uppercase">{t.ai}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ai.map((b) => (
          <BrandTile key={b.name} brand={b} openLabel={t.open} />
        ))}
      </ul>
      <p className="mt-10 mb-3 font-mono text-xs tracking-[0.2em] text-muted uppercase">
        {t.runtimes}
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {runtimes.map((b) => (
          <BrandTile key={b.name} brand={b} openLabel={t.open} />
        ))}
        <li className="card flex flex-col items-center justify-center gap-3 px-4 pt-7 pb-6 text-center">
          <span className="grid size-12 place-items-center rounded-2xl border border-line bg-bg/60">
            <FlagWorld className="size-6 text-fg" />
          </span>
          <span className="text-sm font-medium">{t.browsers}</span>
        </li>
      </ul>
      <p className="mt-4 text-xs text-muted">{t.trademark}</p>
    </Section>
  );
}

/** Unique detector labels, so the cards always match the library. */
const labelsOf = (detectors: readonly Detector[], secrets: string, lang: Locale) => [
  ...new Set(
    detectors.map((d) =>
      d.id.startsWith("global.secret") ? secrets : detectorLabel(d.label, lang),
    ),
  ),
];

export function Coverage({ lang, t }: { lang: Locale; t: Dictionary["coverage"] }) {
  const countries = [
    {
      code: "global",
      flag: <FlagWorld className="size-5 text-sky" />,
      name: t.global,
      labels: labelsOf(global, t.secrets, lang),
    },
    {
      code: "br",
      flag: <FlagBR className="h-4 w-6 rounded-[2px]" />,
      name: t.br,
      labels: labelsOf(br, t.secrets, lang),
    },
    { code: "pt", flag: <FlagPT />, name: t.pt, labels: labelsOf(pt, t.secrets, lang) },
    { code: "ar", flag: <FlagAR />, name: t.ar, labels: labelsOf(ar, t.secrets, lang) },
    { code: "us", flag: <FlagUS />, name: t.us, labels: labelsOf(us, t.secrets, lang) },
    { code: "mx", flag: <FlagMX />, name: t.mx, labels: labelsOf(mx, t.secrets, lang) },
    { code: "cl", flag: <FlagCL />, name: t.cl, labels: labelsOf(cl, t.secrets, lang) },
  ];
  return (
    <Section title={t.title} subtitle={t.subtitle}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {countries.map((c) => (
          <div key={c.code} className="card flex flex-col p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2.5 font-medium">
                {c.flag}
                {c.name}
              </span>
              <Pill tone="sky">
                {c.labels.length} {t.detectors}
              </Pill>
            </div>
            <p className="mt-1 font-mono text-xs text-muted">privyl/{c.code}</p>
            <ul className="mt-5 space-y-2">
              {c.labels.map((label) => (
                <li key={label} className="flex items-center gap-2.5 text-sm">
                  <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-sky/12 text-sky">
                    <CheckIcon className="size-3" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <a
          href={`${GITHUB_URL}/blob/main/CONTRIBUTING.md#how-to-add-a-country`}
          target="_blank"
          rel="noopener noreferrer"
          className="card card-hover group flex flex-col p-6"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            {t.addCountry}
            <ArrowUpRight />
          </span>
          <p className="mt-1 text-sm text-muted text-pretty">{t.addBody}</p>
          {/* Tiny file tree: where a new country goes */}
          <div className="mt-5 flex-1 rounded-xl border border-line bg-bg/60 p-4 font-mono text-xs leading-6">
            <p className="text-muted">packages/privyl/src/</p>
            <p className="pl-4 text-fg/80">global/</p>
            <p className="pl-4 text-fg/80">br/</p>
            <p className="flex items-center gap-2 pl-4 text-sky">
              <span className="rounded border border-dashed border-sky/50 px-1.5">xx/</span>
              <span className="text-muted">{t.yourCountry}</span>
            </p>
            <p className="pl-8 text-muted">index.ts</p>
            <p className="pl-8 text-muted">xx.test.ts</p>
          </div>
        </a>
      </div>
      <p className="mt-5 text-sm text-muted">
        <span className="text-fg">{t.notDetectedTitle}:</span> {t.notDetected}
      </p>
    </Section>
  );
}

/* ---------- Trust: each card shows a small piece of "proof" ---------- */

function MockFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-bg/70">
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="size-1.5 rounded-full bg-white/15" aria-hidden="true" />
        <span className="size-1.5 rounded-full bg-white/15" aria-hidden="true" />
        <span className="ml-1.5 font-mono text-[10px] text-muted">{title}</span>
      </div>
      <div className="h-32 p-3 font-mono text-[11px] leading-5">{children}</div>
    </div>
  );
}

const TEST_FILES = [
  "core/shield.test.ts",
  "global/global.test.ts",
  "br/br.test.ts",
  "cli/run.test.ts",
  "examples.test.ts",
];

export function Trust({ lang, t }: { lang: Locale; t: Dictionary["trust"] }) {
  const mocks: ReactNode[] = [
    <MockFrame key="license" title="LICENSE">
      <p className="text-fg">MIT License</p>
      <p className="mt-1 text-muted">Copyright (c) 2026 Nycolas Inowe</p>
      <p className="mt-1 text-muted">
        Permission is hereby granted, free of charge, to any person…
      </p>
    </MockFrame>,
    <MockFrame key="network" title="DevTools · Network">
      <div className="grid grid-cols-[1fr_auto] border-b border-line pb-1 text-muted">
        <span>Name</span>
        <span>Status</span>
      </div>
      <p className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <span className="text-sky">mask()</span>
        <span className="truncate text-muted">{t.mock.local}</span>
      </p>
      <p className="mt-3 truncate rounded border border-sky/25 bg-sky/10 px-1.5 text-sky">
        {t.mock.requests}
      </p>
    </MockFrame>,
    <MockFrame key="tests" title="pnpm test">
      {TEST_FILES.map((f) => (
        <p key={f} className="flex items-center gap-1.5 text-muted">
          <CheckIcon className="size-3 shrink-0 text-sky" />
          <span className="truncate">{f}</span>
        </p>
      ))}
    </MockFrame>,
    <MockFrame key="headers" title={t.mock.headers}>
      <p className="truncate text-muted">
        <span className="text-sky">content-security-policy</span>
      </p>
      <p className="truncate pl-2 text-fg/85">default-src &apos;self&apos;;</p>
      <p className="truncate pl-2 text-fg/85">connect-src &apos;self&apos;;</p>
      <p className="truncate pl-2 text-fg/85">script-src &apos;nonce-…&apos;;</p>
      <p className="truncate pl-2 text-fg/85">frame-ancestors &apos;none&apos;</p>
    </MockFrame>,
  ];

  return (
    <Section title={t.title}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.items.map((item, i) => (
          <li key={item.title} className="card card-hover flex flex-col p-4">
            {mocks[i]}
            <div className="px-2 pt-4 pb-1">
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={GITHUB_URL} external>
          {t.source}
        </ButtonLink>
        <ButtonLink href={`${GITHUB_URL}/blob/main/SECURITY.md`} external>
          {t.security}
        </ButtonLink>
        <ButtonLink href={`/${lang}/benchmark`}>{t.benchmark}</ButtonLink>
      </div>
      <p className="mt-6 text-sm text-muted">{t.disclaimer}</p>
    </Section>
  );
}

/** Last call to action, before the footer. */
export function FinalCta({
  lang,
  t,
  copy,
}: {
  lang: Locale;
  t: Dictionary["cta"];
  copy: Dictionary["hero"];
}) {
  return (
    <section className="mx-auto mt-40 max-w-6xl px-6">
      <Reveal>
        <div className="card relative isolate overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="hero-glow pointer-events-none absolute inset-0 -z-10"
          />
          <div
            aria-hidden="true"
            className="hero-grid pointer-events-none absolute inset-0 -z-10"
          />
          <Heading title={t.title} center />
          <p className="mx-auto mt-4 max-w-xl text-muted text-pretty">{t.body}</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <CopyCommand
              command="npm install privyl"
              copyLabel={copy.copy}
              copiedLabel={copy.copied}
            />
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href={`/${lang}/docs`} variant="primary">
                {t.primary}
              </ButtonLink>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <GitHubIcon />
                {t.secondary}
                <ArrowUpRight />
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
