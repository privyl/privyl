// Portugal: NIF, Cartão de Cidadão and NISS. All three have check digits.

import type { Detector } from "../core/types.js";
import { allSameChar, hasContextBefore, onlyDigits } from "../core/utils.js";

/** The NIF check digit for the first 8 digits (mod 11, weights 9 to 2). */
export function nifCheckDigit(base8: string): number {
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += Number(base8[i]) * (9 - i);
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

/** NIF (also NIPC for companies): 9 digits. The first digits say who it belongs to. */
export function isValidNif(value: string): boolean {
  const d = value.replace(/^PT/i, "").replace(/\s/g, "");
  if (!/^(?:[12356789]\d|45)\d{7}$/.test(d) || allSameChar(d)) return false;
  return nifCheckDigit(d.slice(0, 8)) === Number(d[8]);
}

// Cartão de Cidadão characters: 0-9 are worth 0-9, A-Z are worth 10-35.
const ccValue = (c: string) => (/\d/.test(c) ? Number(c) : c.charCodeAt(0) - 55);

/**
 * Cartão de Cidadão document number, like "12345678 9 ZZ1": 8-digit civil id, 1 check digit,
 * 2 letters (version) and a final check digit over everything (doubling every second value).
 */
export function isValidCitizenCard(value: string): boolean {
  const s = value.replace(/\s/g, "").toUpperCase();
  if (!/^\d{9}[A-Z]{2}\d$/.test(s)) return false;
  let sum = 0;
  let second = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let v = ccValue(s[i] as string);
    if (second) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    sum += v;
    second = !second;
  }
  return sum % 10 === 0;
}

const NISS_WEIGHTS = [29, 23, 19, 17, 13, 11, 7, 5, 3, 2];

/** The NISS check digit for the first 10 digits. */
export function nissCheckDigit(base10: string): number {
  let sum = 0;
  NISS_WEIGHTS.forEach((w, i) => (sum += Number(base10[i]) * w));
  return 9 - (sum % 10);
}

/** NISS (social security number): 11 digits, starting with 1 (people) or 2 (companies). */
export function isValidNiss(value: string): boolean {
  const d = onlyDigits(value);
  if (!/^[12]\d{10}$/.test(d)) return false;
  return nissCheckDigit(d.slice(0, 10)) === Number(d[10]);
}

const NIF_CONTEXT = /\bnif\b|\bnipc\b|contribuinte|fiscal|\bvat\b|\biva\b|fatur|factur/i;

/**
 * NIF: 123456789, 123 456 789 or PT123456789. Any 9-digit number could pass the check digit
 * (about 1 in 11), so it needs "NIF", "contribuinte" or the "PT" prefix nearby.
 */
export const nif: Detector = {
  id: "pt.nif",
  label: "NIF",
  token: "NIF",
  country: "pt",
  pattern: /(?<![\w.-])(?:PT ?)?(?:\d{9}|\d{3} \d{3} \d{3})(?![\w.-])/,
  validate: (value, { text, start }) =>
    isValidNif(value) && (/^PT/.test(value) || hasContextBefore(text, start, NIF_CONTEXT, 40)),
  confidence: 0.95,
};

/** Cartão de Cidadão: 12345678 9 ZZ1 (with or without spaces). The format is distinctive. */
export const citizenCard: Detector = {
  id: "pt.cc",
  label: "Cartão de Cidadão",
  token: "CC",
  country: "pt",
  pattern: /(?<![\w-])\d{8} ?\d ?[A-Z]{2} ?\d(?![\w-])/,
  validate: isValidCitizenCard,
  confidence: 0.95,
};

/** NISS: 11 digits, only near "NISS" or "Segurança Social" (11 digits are very common). */
export const niss: Detector = {
  id: "pt.niss",
  label: "NISS",
  token: "NISS",
  country: "pt",
  pattern: /(?<![\d.-])[12]\d{10}(?![\d.-])/,
  validate: (value, { text, start }) =>
    isValidNiss(value) && hasContextBefore(text, start, /\bniss\b|seguran[çc]a social/i, 40),
  // Higher than a bare CPF or CNH, which are also 11 digits.
  confidence: 0.98,
};

/**
 * Portuguese phone without "+351": 912 345 678 (mobile) or 213 456 789 (landline), near a word
 * like "telemóvel" or "telefone". Numbers with "+351" are found by the global phone detector.
 */
export const phonePt: Detector = {
  id: "pt.phone",
  label: "Phone (PT)",
  token: "PHONE",
  country: "pt",
  pattern: /(?<![\d+.-])(?:9[1236]\d|2\d{2})( ?)\d{3}\1\d{3}(?![\d.-])/,
  validate: (_value, { text, start }) =>
    hasContextBefore(text, start, /telem[óo]vel|telefone|\btel\b|\btlm\b|contacto|ligar|whats/i),
  confidence: 0.9,
};

/** All Portuguese detectors. */
export const pt: readonly Detector[] = [nif, citizenCard, niss, phonePt];
