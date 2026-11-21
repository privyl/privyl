// Scanning helpers shared by the CLI and the website (runs in browsers too: no Node APIs).

import { br } from "../br/index.js";
import type { Detector } from "../core/types.js";
import { createShield, type Shield } from "../core/shield.js";
import { global } from "../global/index.js";

export interface ScanFinding {
  /** Detector id, for example `"br.cpf"`. */
  type: string;
  label: string;
  /** Placeholder token, for example `"CPF"`. */
  token: string;
  /** File path, if known. */
  file?: string;
  /** 1-based line and column. */
  line: number;
  column: number;
  confidence: number;
  /** The value with most characters hidden, for example `"529.***.***-25"`. */
  preview: string;
}

export interface ScanSummary {
  total: number;
  /** Count per label, sorted from most to least found. */
  byLabel: { label: string; token: string; count: number }[];
  files: number;
}

/** All built-in detectors (global + every country). */
export const allDetectors: readonly Detector[] = [...global, ...br];

let defaultShield: Shield | undefined;

/** Finds personal data in a text and reports where it is, with a partly hidden preview. */
export function scanText(text: string, options: { file?: string; shield?: Shield } = {}) {
  const shield = options.shield ?? (defaultShield ??= createShield({ detectors: allDetectors }));
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") lineStarts.push(i + 1);

  return shield.detect(text).map((c): ScanFinding => {
    const line = lastLineStartAtOrBefore(lineStarts, c.start);
    const finding: ScanFinding = {
      type: c.detector.id,
      label: c.detector.label,
      token: c.detector.token,
      line: line + 1,
      column: c.start - (lineStarts[line] as number) + 1,
      confidence: c.confidence,
      preview: hidePartially(c.value, c.detector.token),
    };
    if (options.file !== undefined) finding.file = options.file;
    return finding;
  });
}

/** Totals per kind of data. */
export function summarize(findings: readonly ScanFinding[]): ScanSummary {
  const counts = new Map<string, { label: string; token: string; count: number }>();
  for (const f of findings) {
    const entry = counts.get(f.label) ?? { label: f.label, token: f.token, count: 0 };
    entry.count++;
    counts.set(f.label, entry);
  }
  return {
    total: findings.length,
    byLabel: [...counts.values()].sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    ),
    files: new Set(findings.map((f) => f.file)).size,
  };
}

/**
 * Hides most of a value so it can be shown on screen: `529.982.247-25` → `529.***.***-25`,
 * `ana@example.com` → `a***@example.com`, secrets show only their first 4 characters.
 */
export function hidePartially(value: string, token = ""): string {
  if (value.startsWith("-----BEGIN")) return "-----BEGIN … PRIVATE KEY-----";
  if (token === "SECRET") return value.slice(0, 4) + "*".repeat(Math.min(8, value.length - 4));

  const at = value.indexOf("@");
  if (token === "EMAIL" && at > 0) return `${value[0]}***${value.slice(at)}`;

  const alnum = value.replace(/[^0-9A-Za-z]/g, "").length;
  const keepStart = alnum >= 8 ? 3 : 1;
  const keepEnd = alnum >= 8 ? 2 : 0;
  let seen = 0;
  return [...value]
    .map((ch) => {
      if (!/[0-9A-Za-z]/.test(ch)) return ch;
      seen++;
      return seen <= keepStart || seen > alnum - keepEnd ? ch : "*";
    })
    .join("");
}

function lastLineStartAtOrBefore(lineStarts: number[], pos: number): number {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((lineStarts[mid] as number) <= pos) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
