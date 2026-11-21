"use client";

// The live demo: runs the real `privyl/scan` in the browser over the fictional /examples projects
// and "types" the result like a terminal.

import { scanText, type ScanFinding } from "privyl/scan";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary, Locale } from "@/i18n/dictionaries";
import { detectorLabel } from "@/i18n/labels";
import type { ExampleProject } from "@/lib/server";
import { RefreshIcon } from "./ui";
import { Window } from "./Window";

type Line =
  | { kind: "command"; text: string }
  | { kind: "file"; path: string }
  | { kind: "finding"; finding: ScanFinding }
  | { kind: "summary"; text: string };

const LINE_DELAY_MS = 16;

export function ScanDemo({
  projects,
  lang,
  t,
}: {
  projects: ExampleProject[];
  lang: Locale;
  t: Dictionary["demo"];
}) {
  const [active, setActive] = useState(projects[0]?.id ?? "");
  const [visible, setVisible] = useState(0);
  const [run, setRun] = useState(0);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Scan every project once. This is the actual library doing the work.
  const results = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        files: p.files.map((f) => ({
          path: f.path,
          findings: scanText(f.content, { file: f.path }),
        })),
      })),
    [projects],
  );
  const current = results.find((r) => r.id === active) ?? results[0];

  const lines = useMemo<Line[]>(() => {
    if (!current) return [];
    const out: Line[] = [{ kind: "command", text: `npx privyl scan ./${current.id}` }];
    let total = 0;
    for (const file of current.files) {
      if (file.findings.length === 0) continue;
      out.push({ kind: "file", path: file.path });
      for (const finding of file.findings) out.push({ kind: "finding", finding });
      total += file.findings.length;
    }
    out.push({
      kind: "summary",
      text: `${total} ${t.found} · ${current.files.length} ${t.files.toLowerCase()}`,
    });
    return out;
  }, [current, t.found, t.files]);

  // Start only when the demo is on screen, so visitors actually see it run.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry?.isIntersecting && setInView(true),
      {
        threshold: 0.25,
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // "Type" one line at a time. With reduced motion, show everything at once.
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(lines.length);
      return;
    }
    setVisible(0);
    const timer = setInterval(() => {
      setVisible((v) => {
        if (v >= lines.length) clearInterval(timer);
        return Math.min(v + 1, lines.length);
      });
    }, LINE_DELAY_MS);
    return () => clearInterval(timer);
  }, [lines, run, inView]);

  useEffect(() => {
    const el = terminalRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible]);

  const shown = lines.slice(0, visible);
  const shownFindings = shown.flatMap((l) => (l.kind === "finding" ? [l.finding] : []));
  const countBy = (token: string) => shownFindings.filter((f) => f.token === token).length;
  const countByFile = (path: string) => shownFindings.filter((f) => f.file === path).length;
  const done = visible >= lines.length;

  const totals = [
    { label: t.totals.total, value: shownFindings.length, strong: true },
    { label: t.totals.cpf, value: countBy("CPF") },
    { label: t.totals.email, value: countBy("EMAIL") },
    { label: t.totals.card, value: countBy("CARD") },
    { label: t.totals.secret, value: countBy("SECRET") },
  ];

  return (
    <div ref={rootRef}>
      <div className="mb-5 flex justify-center">
        <div role="tablist" aria-label={t.files} className="segmented flex-wrap justify-center">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === active}
              onClick={() => {
                setActive(p.id);
                setInView(true);
              }}
            >
              {t.projects[p.id] ?? p.id}
            </button>
          ))}
        </div>
      </div>

      <Window
        title={`~/${current?.id ?? ""}`}
        actions={
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            disabled={!done}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-0.5 text-xs text-muted transition-colors hover:border-sky/40 hover:text-fg disabled:opacity-40"
          >
            <RefreshIcon className="size-3" />
            {t.replay}
          </button>
        }
      >
        <div className="grid md:grid-cols-[220px_1fr]">
          <aside className="hidden border-r border-line p-3 md:block" aria-label={t.files}>
            <p className="px-2 pb-2 text-xs uppercase tracking-wider text-muted">{t.files}</p>
            <ul className="space-y-0.5 font-mono text-xs">
              {current?.files.map((f) => {
                const n = countByFile(f.path);
                return (
                  <li
                    key={f.path}
                    className="flex items-center justify-between gap-2 rounded px-2 py-1"
                  >
                    <span className="truncate text-fg/80" title={f.path}>
                      {f.path}
                    </span>
                    {n > 0 && (
                      <span className="rounded bg-alert/15 px-1.5 text-alert tabular-nums">
                        {n}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>

          <div
            ref={terminalRef}
            className="h-80 overflow-y-auto p-4 font-mono text-xs leading-relaxed sm:h-96 sm:text-[13px]"
            aria-live="off"
          >
            {shown.map((line, i) => (
              <TerminalLine key={i} line={line} lang={lang} />
            ))}
            {!done && <span className="inline-block h-4 w-2 animate-blink bg-sky align-middle" />}
          </div>
        </div>
      </Window>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {totals.map((card) => (
          <div key={card.label} className="card px-4 py-3">
            <dt className="text-xs text-muted">{card.label}</dt>
            <dd
              className={`mt-1 text-2xl font-medium tabular-nums ${card.strong ? "text-alert" : "text-fg"}`}
            >
              {card.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
        <span className="size-1.5 rounded-full bg-sky" aria-hidden="true" />
        {t.notice}
      </p>
    </div>
  );
}

function TerminalLine({ line, lang }: { line: Line; lang: Locale }) {
  switch (line.kind) {
    case "command":
      return (
        <p className="mb-2">
          <span className="text-sky">$</span> {line.text}
        </p>
      );
    case "file":
      return <p className="mt-2 font-semibold text-fg">{line.path}</p>;
    case "finding": {
      const f = line.finding;
      return (
        <p className="grid grid-cols-[4.5rem_8.5rem_1fr] gap-2 pl-3 sm:grid-cols-[5rem_10rem_1fr]">
          <span className="text-muted">
            {f.line}:{f.column}
          </span>
          <span className="truncate text-sky">{detectorLabel(f.label, lang)}</span>
          <span className="truncate text-alert">{f.preview}</span>
        </p>
      );
    }
    case "summary":
      return <p className="mt-3 text-fg">✓ {line.text}</p>;
  }
}
