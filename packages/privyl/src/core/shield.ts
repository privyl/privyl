import type { Detector, Finding, MatchContext } from "./types.js";
import { unmask } from "./unmask.js";
import { Vault } from "./vault.js";

export interface ShieldOptions {
  /** Detectors to use. The order only matters to break ties between overlaps. */
  detectors: readonly Detector[];
}

export interface MaskOptions {
  /** Reuse a vault (for example, across a whole conversation). Default: a new vault. */
  vault?: Vault;
}

export interface MaskResult {
  /** The text with personal data replaced by placeholders. */
  text: string;
  /** The mapping needed to restore the text. Keep it on your machine. */
  vault: Vault;
  /** What was found, without the real values. */
  findings: Finding[];
}

/** A detected value before a placeholder is assigned. It contains the real value. */
export interface Candidate {
  detector: Detector;
  value: string;
  start: number;
  end: number;
  confidence: number;
}

export interface Shield {
  /** Finds personal data and replaces it with placeholders. */
  mask(text: string, options?: MaskOptions): MaskResult;
  /** Puts the real values back. */
  unmask(text: string, vault: Vault): string;
  /** Lists what would be masked, sorted by position, without changing the text. */
  detect(text: string): Candidate[];
}

const DEFAULT_CONFIDENCE = 0.9;
const TOKEN_RE = /^[A-Z][A-Z0-9]*$/;

export function createShield(options: ShieldOptions): Shield {
  const detectors = [...options.detectors];
  const ids = new Set<string>();
  for (const d of detectors) {
    if (ids.has(d.id)) throw new Error(`Duplicate detector id: ${d.id}`);
    ids.add(d.id);
    if (!TOKEN_RE.test(d.token)) {
      throw new Error(`Detector ${d.id}: token must be uppercase letters/digits, got "${d.token}"`);
    }
  }

  const detect = (text: string) => resolveOverlaps(findCandidates(text, detectors), detectors);

  return {
    detect,
    unmask,
    mask(text, maskOptions = {}) {
      const vault = maskOptions.vault ?? new Vault();
      const findings: Finding[] = [];
      let out = "";
      let cursor = 0;

      for (const c of detect(text)) {
        // Skip placeholders that already appear in the input, so unmask never touches them.
        const placeholder = vault.assign(c.detector.token, c.value, (p) => text.includes(p));
        out += text.slice(cursor, c.start) + placeholder;
        cursor = c.end;
        findings.push({
          type: c.detector.id,
          label: c.detector.label,
          country: c.detector.country,
          start: c.start,
          end: c.end,
          confidence: c.confidence,
          placeholder,
        });
      }
      out += text.slice(cursor);

      return { text: out, vault, findings };
    },
  };
}

function findCandidates(text: string, detectors: readonly Detector[]): Candidate[] {
  const candidates: Candidate[] = [];
  for (const detector of detectors) {
    // A fresh copy of the regex, so a shared `lastIndex` never leaks between calls.
    const { source, flags } = detector.pattern;
    const re = new RegExp(source, flags.includes("g") ? flags : flags + "g");

    for (const match of text.matchAll(re)) {
      const value = match[0];
      if (value.length === 0) continue;
      const context: MatchContext = { text, start: match.index, end: match.index + value.length };
      if (detector.validate && !detector.validate(value, context)) continue;

      const raw = detector.confidence ?? DEFAULT_CONFIDENCE;
      const confidence = typeof raw === "function" ? raw(value, context) : raw;
      if (confidence <= 0) continue;
      candidates.push({ detector, value, start: context.start, end: context.end, confidence });
    }
  }
  return candidates;
}

/**
 * When two detections overlap, keep the more confident one, then the longer one,
 * then the one whose detector comes first. Returns the winners sorted by position.
 */
function resolveOverlaps(candidates: Candidate[], detectors: readonly Detector[]): Candidate[] {
  const order = new Map(detectors.map((d, i) => [d, i]));
  const ranked = [...candidates].sort(
    (a, b) =>
      b.confidence - a.confidence ||
      b.end - b.start - (a.end - a.start) ||
      (order.get(a.detector) ?? 0) - (order.get(b.detector) ?? 0) ||
      a.start - b.start,
  );

  const kept: Candidate[] = []; // always sorted by position
  for (const c of ranked) {
    const i = firstEndingAfter(kept, c.start);
    const next = kept[i];
    if (next && next.start < c.end) continue; // overlaps something we already kept
    kept.splice(i, 0, c);
  }
  return kept;
}

/** Binary search: index of the first kept item that ends after `pos`. */
function firstEndingAfter(kept: Candidate[], pos: number): number {
  let lo = 0;
  let hi = kept.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((kept[mid] as Candidate).end <= pos) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
