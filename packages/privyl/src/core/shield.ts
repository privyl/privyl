import type { Detector, Finding, MatchContext } from "./types.js";
import { placeholdersIn, unmask } from "./unmask.js";
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
  const tokens = [...new Set(detectors.map((d) => d.token))];

  return {
    detect,
    unmask,
    mask(text, maskOptions = {}) {
      const vault = maskOptions.vault ?? new Vault();
      const findings: Finding[] = [];
      let out = "";
      let cursor = 0;
      // Placeholders already written in the input, in any form unmask accepts ("CPF_1",
      // "[cpf 1]"...). They are skipped, so unmask never turns the user's own text into real data.
      const taken = placeholdersIn(text, tokens);

      for (const c of detect(text)) {
        const placeholder = vault.assign(c.detector.token, c.value, (p) => taken.has(p));
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

// Look-alike characters that copy and paste often brings: non-breaking and thin spaces, Unicode
// dashes, full-width digits and symbols. Detectors see their ASCII version, so "529.982.247-25"
// (with a non-breaking hyphen) is still a CPF. Each one is a single UTF-16 unit, like its
// replacement, so positions stay the same and the original text is what gets masked.
const LOOKALIKE_RE = /[\u00A0\u2007\u2009\u202F\u2010-\u2015\u2212\uFF01-\uFF5E]/g;
const toAscii = (c: string): string => {
  const code = c.charCodeAt(0);
  if (code >= 0xff01) return String.fromCharCode(code - 0xfee0); // full-width → ASCII
  return code >= 0x2010 ? "-" : " ";
};

/** The text as detectors see it (same length, look-alike characters replaced). */
export const normalizeForDetection = (text: string): string => text.replace(LOOKALIKE_RE, toAscii);

function findCandidates(original: string, detectors: readonly Detector[]): Candidate[] {
  const text = normalizeForDetection(original);
  const candidates: Candidate[] = [];
  for (const detector of detectors) {
    // A fresh copy of the regex, so a shared `lastIndex` never leaks between calls.
    const { source, flags } = detector.pattern;
    const re = new RegExp(source, flags.includes("g") ? flags : flags + "g");

    for (const match of text.matchAll(re)) {
      const seen = match[0];
      if (seen.length === 0) continue;
      const context: MatchContext = { text, start: match.index, end: match.index + seen.length };
      if (detector.validate && !detector.validate(seen, context)) continue;

      const raw = detector.confidence ?? DEFAULT_CONFIDENCE;
      const confidence = typeof raw === "function" ? raw(seen, context) : raw;
      if (confidence <= 0) continue;
      // The vault keeps the original characters, so unmask gives back exactly what was written.
      const value = original.slice(context.start, context.end);
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
