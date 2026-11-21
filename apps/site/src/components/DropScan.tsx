"use client";

// "Try it with your own files": files are read with the browser File API and scanned locally.
// Nothing is uploaded: there is no server code behind this component.

import { scanText, summarize, type ScanFinding } from "privyl/scan";
import { useRef, useState, type DragEvent } from "react";
import type { Dictionary, Locale } from "@/i18n/dictionaries";
import { detectorLabel } from "@/i18n/labels";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_LINES_SHOWN = 300;
// Limits keep a huge drop from freezing the tab. Files are only read in memory and then dropped.
const MAX_FILES = 25;

interface Result {
  findings: ScanFinding[];
  scanned: number;
  skipped: string[];
  truncated: boolean;
}

export function DropScan({ lang, t }: { lang: Locale; t: Dictionary["drop"] }) {
  const [result, setResult] = useState<Result>();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const scanFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const findings: ScanFinding[] = [];
    const skipped: string[] = [];
    let scanned = 0;
    const files = Array.from(list);
    for (const file of files.slice(0, MAX_FILES)) {
      if (file.size > MAX_BYTES) {
        skipped.push(file.name);
        continue;
      }
      const text = await file.text();
      if (text.slice(0, 8000).includes("\u0000")) {
        skipped.push(file.name); // binary file
        continue;
      }
      scanned++;
      findings.push(...scanText(text, { file: file.name }));
    }
    setResult({ findings, scanned, skipped, truncated: files.length > MAX_FILES });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void scanFiles(e.dataTransfer.files);
  };

  const summary = result ? summarize(result.findings) : undefined;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-8 text-center transition-colors ${
          dragging
            ? "scale-[1.01] border-sky bg-sky/5"
            : "border-line-strong bg-surface/60 hover:border-sky/40"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-8 text-sky"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-primary">
          {t.cta}
        </button>
        <p className="text-sm text-muted">{t.hint}</p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-sky" aria-hidden="true" />
          {t.privacy}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => void scanFiles(e.target.files)}
          aria-label={t.cta}
        />
      </div>

      <div className="card p-5" aria-live="polite">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">{t.results}</h3>
          {result && (
            <button
              type="button"
              onClick={() => setResult(undefined)}
              className="text-xs text-muted hover:text-fg"
            >
              {t.clear}
            </button>
          )}
        </div>
        {!result && <p className="text-sm text-muted">{t.empty}</p>}
        {result && summary && (
          <>
            {summary.total === 0 ? (
              <p className="text-sm text-muted">{t.none}</p>
            ) : (
              <>
                <p className="text-sm">
                  <span className="text-xl font-medium text-alert tabular-nums">
                    {summary.total}
                  </span>{" "}
                  <span className="text-muted">
                    {t.inFiles} {summary.files}/{result.scanned} {t.files}
                  </span>
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {summary.byLabel.map((row) => (
                    <li
                      key={row.label}
                      className="rounded-md border border-line px-2 py-0.5 text-xs"
                    >
                      {detectorLabel(row.label, lang)}{" "}
                      <span className="text-sky tabular-nums">{row.count}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 max-h-56 overflow-y-auto font-mono text-xs leading-relaxed">
                  {result.findings.slice(0, MAX_LINES_SHOWN).map((f, i) => (
                    <p key={i} className="grid grid-cols-[1fr_auto] gap-3">
                      <span className="truncate text-muted">
                        {f.file}:{f.line}{" "}
                        <span className="text-sky">{detectorLabel(f.label, lang)}</span>
                      </span>
                      <span className="text-alert">{f.preview}</span>
                    </p>
                  ))}
                </div>
              </>
            )}
            {result.truncated && <p className="mt-2 text-xs text-muted">{t.tooMany}</p>}
            {result.skipped.map((name) => (
              <p key={name} className="mt-2 text-xs text-muted">
                {name}: {t.skipped}
              </p>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
