// United States: SSN and ITIN. Neither has a check digit, so the rules about which numbers are
// never issued, plus context words, do the work.

import type { Detector } from "../core/types.js";
import { hasContextBefore, onlyDigits } from "../core/utils.js";

/**
 * SSN: area 001-899 except 666, group 01-99, serial 0001-9999.
 * Numbers starting with 9 are ITINs, not SSNs.
 */
export function isValidSsn(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 9) return false;
  const area = Number(d.slice(0, 3));
  const group = Number(d.slice(3, 5));
  const serial = Number(d.slice(5));
  return area !== 0 && area !== 666 && area < 900 && group !== 0 && serial !== 0;
}

/** ITIN: 9XX-YY-XXXX, where YY is 50-65, 70-88, 90-92 or 94-99. */
export function isValidItin(value: string): boolean {
  const d = onlyDigits(value);
  if (!/^9\d{8}$/.test(d)) return false;
  const g = Number(d.slice(3, 5));
  return (g >= 50 && g <= 65) || (g >= 70 && g <= 88) || (g >= 90 && g <= 92) || g >= 94;
}

const SSN_CONTEXT = /\bssn\b|social security/i;
const ITIN_CONTEXT = /\bitin\b|taxpayer/i;

// 123-45-6789, or 9 digits in a row (only with a context word).
const NINE_DIGITS = /(?<![\d-])(?:\d{3}-\d{2}-\d{4}|\d{9})(?![\d-])/;

/** SSN: 123-45-6789, or 9 digits right after "SSN" or "Social Security". */
export const ssn: Detector = {
  id: "us.ssn",
  label: "SSN",
  token: "SSN",
  country: "us",
  pattern: NINE_DIGITS,
  validate: (value, { text, start }) =>
    isValidSsn(value) && (value.includes("-") || hasContextBefore(text, start, SSN_CONTEXT, 30)),
  confidence: (_value, { text, start }) =>
    hasContextBefore(text, start, SSN_CONTEXT, 30) ? 0.99 : 0.85,
};

/** ITIN (tax id for people without an SSN): 9XX-7X-XXXX, or 9 digits after "ITIN". */
export const itin: Detector = {
  id: "us.itin",
  label: "ITIN",
  token: "ITIN",
  country: "us",
  pattern: NINE_DIGITS,
  validate: (value, { text, start }) =>
    isValidItin(value) && (value.includes("-") || hasContextBefore(text, start, ITIN_CONTEXT, 30)),
  confidence: (_value, { text, start }) =>
    hasContextBefore(text, start, ITIN_CONTEXT, 30) ? 0.99 : 0.85,
};

/** All United States detectors. */
export const us: readonly Detector[] = [ssn, itin];
