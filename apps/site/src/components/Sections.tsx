import Link from "next/link";
import { createShield, type Detector } from "privyl";
import { br } from "privyl/br";
import { global } from "privyl/global";
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
import { maskedSegments, rawSegments } from "@/lib/highlight";
import { BeforeAfterTabs, type Scenario } from "./BeforeAfter";
import { FlagBR, FlagWorld } from "./Flags";
import type { HeroPart } from "./HeroDemo";
import { Reveal } from "./Reveal";

// Runs at build time on the server: the examples below are real output of the library.
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
    <section id={id} className="mx-auto mt-36 max-w-6xl scroll-mt-24 px-6">
      <Reveal>
        <div className="mb-10 max-w-2xl">
          {kicker && (
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-sky">{kicker}</p>
          )}
          <h2 className="text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-tight">
            {title}
          </h2>
          {subtitle && <p className="mt-3 text-lg text-muted text-pretty">{subtitle}</p>}
        </div>
        {children}
      </Reveal>
    </section>
  );
}

/** Splits the hero sample into plain text and detected values (for the hero animation). */
export function heroParts(sample: string): HeroPart[] {
  const { findings } = shield.mask(sample);
  const parts: HeroPart[] = [];
  let cursor = 0;
  for (const f of findings) {
    if (f.start > cursor) parts.push({ text: sample.slice(cursor, f.start) });
    parts.push({ value: sample.slice(f.start, f.end), placeholder: f.placeholder, label: f.label });
    cursor = f.end;
  }
  if (cursor < sample.length) parts.push({ text: sample.slice(cursor) });
  return parts;
}

export function BeforeAfter({ t }: { t: Dictionary["beforeAfter"] }) {
  const scenarios: Scenario[] = Object.entries(t.scenarios).map(([id, s]) => {
    const { text, findings } = shield.mask(s.text);
    return {
      id,
      label: s.label,
      raw: rawSegments(s.text, findings),
      masked: maskedSegments(text, findings, s.text),
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

const STEP_ICONS = [
  // Mask: eye with a slash
  "M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.3-2.3 3.5M6.2 6.2C4.3 7.5 3 9.6 2.5 12c1 2.5 4.5 7 9.5 7 1.8 0 3.4-.6 4.8-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2",
  // Ask: chat bubble
  "M4 5h16v11H9l-5 4V5Z",
  // Unmask: refresh/restore arrows
  "M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5",
];

export function HowItWorks({ t }: { t: Dictionary["how"] }) {
  const code = [
    "const { text, vault } = shield.mask(input);",
    "const answer = await ai.ask(text);",
    "const reply = shield.unmask(answer, vault);",
  ];
  return (
    <Section title={t.title} subtitle={t.subtitle}>
      <ol className="grid gap-4 md:grid-cols-3">
        {t.steps.map((step, i) => (
          <li key={step.title} className="card card-hover relative p-6">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl border border-sky/25 bg-sky/10 text-sky">
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={STEP_ICONS[i]} />
                </svg>
              </span>
              <span className="font-mono text-xs text-muted">0{i + 1}</span>
            </div>
            <h3 className="mt-5 text-lg font-medium">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">{step.body}</p>
            <pre className="mt-5 overflow-x-auto rounded-lg border border-line bg-bg/70 px-3 py-2.5 font-mono text-xs text-fg/85">
              {code[i]}
            </pre>
          </li>
        ))}
      </ol>
    </Section>
  );
}

interface Brand {
  name: string;
  href: string;
  icon?: { path: string; hex: string };
  caption?: string;
}

/** Dark brand colors are drawn in the text color so they stay visible on the dark background. */
function iconColor(hex: string): string {
  const n = parseInt(hex, 16);
  const luminance =
    (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luminance < 0.35 ? "currentColor" : `#${hex}`;
}

function BrandTile({ brand, openLabel }: { brand: Brand; openLabel: string }) {
  return (
    <li>
      <a
        href={brand.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${openLabel} ${brand.name}`}
        className="card card-hover group flex h-full flex-col items-center justify-center gap-3 px-4 py-6 text-center"
      >
        {brand.icon ? (
          <svg
            viewBox="0 0 24 24"
            className="size-8 transition-transform group-hover:scale-110"
            fill={iconColor(brand.icon.hex)}
            aria-hidden="true"
          >
            <path d={brand.icon.path} />
          </svg>
        ) : (
          <span
            className="grid size-8 place-items-center rounded-lg border border-line-strong font-mono text-sm text-fg"
            aria-hidden="true"
          >
            {brand.name.slice(0, 1)}
          </span>
        )}
        <span className="text-sm font-medium">{brand.name}</span>
        {brand.caption && <span className="-mt-2 text-xs text-muted">{brand.caption}</span>}
        <span
          className="text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        >
          ↗
        </span>
      </a>
    </li>
  );
}

export function Anywhere({ t }: { t: Dictionary["anywhere"] }) {
  const ai: Brand[] = [
    { name: "Claude", href: "https://claude.ai", icon: siClaude },
    { name: "ChatGPT", href: "https://chatgpt.com" },
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
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">{t.ai}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ai.map((b) => (
          <BrandTile key={b.name} brand={b} openLabel={t.open} />
        ))}
      </ul>
      <p className="mt-10 mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {t.runtimes}
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {runtimes.map((b) => (
          <BrandTile key={b.name} brand={b} openLabel={t.open} />
        ))}
        <li className="card flex flex-col items-center justify-center gap-3 px-4 py-6 text-center">
          <FlagWorld className="size-8 text-fg" />
          <span className="text-sm font-medium">{t.browsers}</span>
        </li>
      </ul>
      <p className="mt-4 text-xs text-muted">{t.trademark}</p>
    </Section>
  );
}

/** Unique detector labels, so the table always matches the library. */
const labelsOf = (detectors: readonly Detector[], secrets: string) => [
  ...new Set(detectors.map((d) => (d.id.startsWith("global.secret") ? secrets : d.label))),
];

export function Coverage({ t }: { t: Dictionary["coverage"] }) {
  const rows = [
    {
      flag: <FlagWorld className="size-5 text-sky" />,
      country: t.global,
      labels: labelsOf(global, t.secrets),
    },
    {
      flag: <FlagBR className="h-4 w-6 rounded-[2px]" />,
      country: t.br,
      labels: labelsOf(br, t.secrets),
    },
  ];
  return (
    <Section title={t.title} subtitle={t.subtitle}>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
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
              <tr key={row.country} className="border-t border-line first:border-t-0">
                <th scope="row" className="px-5 py-5 align-top font-medium whitespace-nowrap">
                  <span className="inline-flex items-center gap-2.5">
                    {row.flag}
                    {row.country}
                  </span>
                </th>
                <td className="px-5 py-5">
                  <ul className="flex flex-wrap gap-2">
                    {row.labels.map((label) => (
                      <li
                        key={label}
                        className="rounded-md border border-line bg-elevated/60 px-2.5 py-1 text-xs"
                      >
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
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-sky hover:underline"
                >
                  + {t.addCountry} ↗
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

const TRUST_ICONS = [
  "M12 3v18M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7Zm14 0-2.5 6a3 3 0 0 0 5 0L19 7Z", // scale
  "M4 4l16 16M8.5 8.5A5 5 0 0 0 12 17m3.5-3.5A5 5 0 0 0 12 7M2 12a10 10 0 0 1 4-8m12 0a10 10 0 0 1 4 8", // no signal
  "M9 12l2 2 4-4M12 3l8 3v6c0 4.4-3.4 8.2-8 9-4.6-.8-8-4.6-8-9V6l8-3Z", // shield check
  "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5V11Zm7 4v2", // lock
];

export function Trust({ lang, t }: { lang: Locale; t: Dictionary["trust"] }) {
  const link =
    "inline-flex items-center gap-1 rounded-lg border border-line px-4 py-2 text-sm transition-colors hover:border-sky/50";
  return (
    <Section title={t.title}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.items.map((item, i) => (
          <li key={item.title} className="card card-hover p-6">
            <svg
              viewBox="0 0 24 24"
              className="size-6 text-sky"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={TRUST_ICONS[i]} />
            </svg>
            <h3 className="mt-4 font-medium">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={link}>
          {t.source} ↗
        </a>
        <a
          href={`${GITHUB_URL}/blob/main/SECURITY.md`}
          target="_blank"
          rel="noopener noreferrer"
          className={link}
        >
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
