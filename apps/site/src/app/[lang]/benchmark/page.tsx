import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CopyCommand } from "@/components/CopyCommand";
import { Heading } from "@/components/Sections";
import { Reveal } from "@/components/Reveal";
import { ButtonLink, Pill } from "@/components/ui";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { CODE_URL, DATASET_URL, RESULTS_URL, benchmark, type ErrorExample } from "@/lib/benchmark";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? { title: getDictionary(lang).benchmark.title } : {};
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

/** Horizontal bar drawn with SVG (the Content Security Policy blocks inline styles). */
function Bar({ value, tone = "sky" }: { value: number; tone?: "sky" | "alert" }) {
  return (
    <svg className="h-1.5 w-full" aria-hidden="true">
      <rect width="100%" height="100%" rx="3" className="fill-white/[0.06]" />
      <rect
        width={`${Math.max(0, Math.min(1, value)) * 100}%`}
        height="100%"
        rx="3"
        className={tone === "sky" ? "fill-sky" : "fill-alert"}
      />
    </svg>
  );
}

/** Shows a short window of text around the mistake, with the span highlighted. */
function Snippet({ e }: { e: ErrorExample }) {
  const from = Math.max(0, e.start - 40);
  const to = Math.min(e.text.length, e.end + 40);
  const tone =
    e.kind === "false-negative"
      ? "bg-alert/12 text-alert-soft ring-alert/30"
      : "bg-amber-400/10 text-amber-200 ring-amber-300/30";
  return (
    <p className="font-mono text-[13px] leading-6 break-words">
      {from > 0 && "…"}
      {e.text.slice(from, e.start)}
      <mark className={`rounded px-1 ring-1 ${tone}`}>{e.text.slice(e.start, e.end)}</mark>
      {e.text.slice(e.end, to)}
      {to < e.text.length && "…"}
    </p>
  );
}

export default async function BenchmarkPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang).benchmark;
  const b = benchmark;

  const summary = [
    { label: t.precision, help: t.precisionHelp, value: b.overall.precision },
    { label: t.recall, help: t.recallHelp, value: b.overall.recall },
    { label: t.f1, help: t.f1Help, value: b.overall.f1 },
  ];
  const types = Object.entries(b.byType).sort((a, z) => z[1].support - a[1].support);
  // One missed value and one false alarm per type at most, missed first.
  const errors = [
    ...b.errors.filter((e) => e.kind === "false-negative"),
    ...b.errors.filter((e) => e.kind === "false-positive"),
  ].filter((e, i, all) => all.findIndex((x) => x.type === e.type && x.kind === e.kind) === i);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-20">
      {/* Header */}
      <header className="max-w-3xl motion-safe:animate-fade-up">
        <p className="mb-3 font-mono text-xs tracking-[0.2em] text-sky uppercase">{t.kicker}</p>
        <h1 className="sr-only">{t.title}</h1>
        <Heading title={t.heading} />
        <p className="mt-4 text-lg text-muted text-pretty">{t.subtitle}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Pill tone="sky" dot>
            privyl {t.version} {b.version}
          </Pill>
          <Pill>
            {b.records} {t.texts}
          </Pill>
          <Pill>
            {b.entities} {t.labeled}
          </Pill>
        </div>
      </header>

      {/* Summary */}
      <Reveal>
        <dl className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map((s) => (
            <div key={s.label} className="card p-6">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="mt-2 text-4xl font-medium tracking-tight tabular-nums">
                {pct(s.value)}
              </dd>
              <div className="mt-4">
                <Bar value={s.value} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">{s.help}</p>
            </div>
          ))}
          <div className="card p-6">
            <dt className="text-sm text-muted">{t.falseAlarms}</dt>
            <dd className="mt-2 text-4xl font-medium tracking-tight tabular-nums">
              {b.cleanRecordsWithFindings}
              <span className="text-lg text-muted">/{b.cleanRecords}</span>
            </dd>
            <div className="mt-4">
              <Bar value={b.cleanRecordsWithFindings / b.cleanRecords} tone="alert" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">{t.falseAlarmsHelp}</p>
          </div>
        </dl>
      </Reveal>

      {/* By type */}
      <section className="mt-24">
        <Reveal>
          <h2 className="mb-6 text-2xl font-medium tracking-tight">{t.byType}</h2>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-normal">
                    {t.type}
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-normal">
                    {t.support}
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-normal">
                    {t.found}
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-normal">
                    {t.fp}
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-normal">
                    {t.fn}
                  </th>
                  <th scope="col" className="w-40 px-5 py-3 font-normal">
                    {t.precision}
                  </th>
                  <th scope="col" className="w-40 px-5 py-3 font-normal">
                    {t.recall}
                  </th>
                </tr>
              </thead>
              <tbody>
                {types.map(([type, s]) => (
                  <tr key={type} className="border-t border-line first:border-t-0">
                    <th scope="row" className="px-5 py-3.5 font-medium whitespace-nowrap">
                      {t.types[type] ?? type}
                    </th>
                    <td className="px-3 py-3.5 text-right text-muted tabular-nums">{s.support}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums">{s.truePositives}</td>
                    <td
                      className={`px-3 py-3.5 text-right tabular-nums ${s.falsePositives ? "text-amber-200" : "text-muted"}`}
                    >
                      {s.falsePositives}
                    </td>
                    <td
                      className={`px-3 py-3.5 text-right tabular-nums ${s.falseNegatives ? "text-alert-soft" : "text-muted"}`}
                    >
                      {s.falseNegatives}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Bar value={s.precision} />
                        <span className="w-14 text-right font-mono text-xs tabular-nums">
                          {pct(s.precision)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Bar value={s.recall} />
                        <span className="w-14 text-right font-mono text-xs tabular-nums">
                          {pct(s.recall)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* Mistakes */}
      <section className="mt-24">
        <Reveal>
          <h2 className="text-2xl font-medium tracking-tight">{t.errorsTitle}</h2>
          <p className="mt-2 max-w-2xl text-muted text-pretty">{t.errorsSubtitle}</p>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {errors.map((e) => (
              <li key={`${e.kind}-${e.type}-${e.recordId}`} className="card p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{t.types[e.type] ?? e.type}</span>
                  {e.kind === "false-negative" ? (
                    <Pill tone="alert" dot>
                      {t.missed}
                    </Pill>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] text-amber-200">
                      <span className="size-1.5 rounded-full bg-amber-300" aria-hidden="true" />
                      {t.falseAlarm}
                    </span>
                  )}
                </div>
                <Snippet e={e} />
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* Method */}
      <section className="mt-24">
        <Reveal>
          <h2 className="mb-6 text-2xl font-medium tracking-tight">{t.methodTitle}</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.method.map((m, i) => (
              <li key={m.title} className="card p-6">
                <span className="grid size-7 place-items-center rounded-full border border-sky/30 bg-sky/10 font-mono text-xs text-sky">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-medium">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{m.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 max-w-3xl text-sm text-muted">
            <span className="text-fg">{t.limitsTitle}:</span> {t.limits}
          </p>
        </Reveal>
      </section>

      {/* Reproduce */}
      <section className="mt-24">
        <Reveal>
          <div className="card flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-medium tracking-tight">{t.reproduceTitle}</h2>
              <p className="mt-2 text-muted">{t.reproduceBody}</p>
              <div className="mt-5">
                <CopyCommand
                  command="pnpm install && pnpm bench"
                  copyLabel={lang === "pt" ? "Copiar" : "Copy"}
                  copiedLabel={lang === "pt" ? "Copiado" : "Copied"}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={DATASET_URL} external>
                {t.dataset}
              </ButtonLink>
              <ButtonLink href={RESULTS_URL} external>
                {t.results}
              </ButtonLink>
              <ButtonLink href={CODE_URL} external>
                {t.code}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
