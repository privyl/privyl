// Mexico: CURP (population id) and RFC (tax id). Both end with a check digit.

import type { Detector } from "../core/types.js";

const CURP_CHARS = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

/** The CURP check digit for the first 17 characters. */
export function curpCheckDigit(base17: string): number {
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += CURP_CHARS.indexOf(base17[i] as string) * (18 - i);
  return (10 - (sum % 10)) % 10;
}

export function isValidCurp(value: string): boolean {
  return CURP_RE.test(value) && curpCheckDigit(value.slice(0, 17)) === Number(value[17]);
}

const RFC_CHARS = "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ";

/** The RFC check character (0-9 or A) for the first 11 or 12 characters. */
export function rfcCheckDigit(base: string): string {
  const s = base.length === 11 ? ` ${base}` : base; // companies have 3 letters: pad to 12
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += RFC_CHARS.indexOf(s[i] as string) * (13 - i);
  const r = 11 - (sum % 11);
  return r === 11 ? "0" : r === 10 ? "A" : String(r);
}

// Generic RFCs used on invoices for "the general public" and for foreigners: not personal data.
const GENERIC_RFC = new Set(["XAXX010101000", "XEXX010101000"]);

export function isValidRfc(value: string): boolean {
  if (!RFC_RE.test(value) || GENERIC_RFC.has(value)) return false;
  return rfcCheckDigit(value.slice(0, -1)) === value.at(-1);
}

const DATE = "\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])";
const STATES =
  "AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE";
// 4 letters, birth date, sex (H, M or X), state, 3 consonants, 1 character, check digit.
const CURP_BODY = `[A-Z][AEIOUX][A-Z]{2}${DATE}[HMX](?:${STATES})[B-DF-HJ-NP-TV-Z]{3}[A-Z\\d]\\d`;
// 3 letters (company) or 4 (person), date, 2 characters and the check character.
const RFC_BODY = `[A-ZÑ&]{3,4}${DATE}[A-Z\\d]{2}[\\dA]`;
const CURP_RE = new RegExp(`^${CURP_BODY}$`);
const RFC_RE = new RegExp(`^${RFC_BODY}$`);

/** CURP: 18 characters, like GOMC800101HDFRRN09. Birth date, state and check digit validated. */
export const curp: Detector = {
  id: "mx.curp",
  label: "CURP",
  token: "CURP",
  country: "mx",
  pattern: new RegExp(`(?<![A-ZÑ\\d])${CURP_BODY}(?![A-Z\\d])`),
  validate: isValidCurp,
  confidence: 0.97,
};

/** RFC: GOMC800101AB3 (person, 13) or ABC800101AB3 (company, 12). Check character validated. */
export const rfc: Detector = {
  id: "mx.rfc",
  label: "RFC",
  token: "RFC",
  country: "mx",
  pattern: new RegExp(`(?<![A-ZÑ&\\d])${RFC_BODY}(?![A-Z\\d])`),
  validate: isValidRfc,
  confidence: 0.93,
};

/** All Mexican detectors. */
export const mx: readonly Detector[] = [curp, rfc];
