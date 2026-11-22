// Argentina: CUIT/CUIL (tax and labor id, with a check digit) and DNI (national id).

import type { Detector } from "../core/types.js";
import { allSameChar, hasContextBefore, onlyDigits } from "../core/utils.js";

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * The CUIT/CUIL check digit for the first 10 digits, or `undefined` when the result would be 10
 * (those numbers are never issued: the prefix is changed to 23 or 33 instead).
 */
export function cuitCheckDigit(base10: string): number | undefined {
  let sum = 0;
  CUIT_WEIGHTS.forEach((w, i) => (sum += Number(base10[i]) * w));
  const r = 11 - (sum % 11);
  if (r === 11) return 0;
  return r === 10 ? undefined : r;
}

/** CUIT/CUIL: 11 digits. Prefixes 20, 23, 24, 27 (people) and 30, 33, 34 (companies). */
export function isValidCuit(value: string): boolean {
  const d = onlyDigits(value);
  if (!/^(?:2[0347]|3[034])\d{9}$/.test(d)) return false;
  return cuitCheckDigit(d.slice(0, 10)) === Number(d[10]);
}

const CUIT_CONTEXT = /\bcui[tl]\b/i;

/**
 * CUIT/CUIL: 20-12345678-6 or 20123456786. The digits-only form is also 11 digits like a CPF,
 * so it needs the word "CUIT" or "CUIL" nearby.
 */
export const cuit: Detector = {
  id: "ar.cuit",
  label: "CUIT/CUIL",
  token: "CUIT",
  country: "ar",
  pattern: /(?<![\d.\-/])(?:\d{2}-\d{8}-\d|\d{11})(?![\d\-/]|\.\d)/,
  validate: (value, { text, start }) =>
    isValidCuit(value) && (value.includes("-") || hasContextBefore(text, start, CUIT_CONTEXT, 40)),
  // With the word nearby it beats a bare CPF or CNH, which are also 11 digits.
  confidence: (_value, { text, start }) =>
    hasContextBefore(text, start, CUIT_CONTEXT, 40) ? 0.99 : 0.95,
};

/**
 * DNI: 12.345.678 or 12345678 (7 or 8 digits). It has no check digit, so it is only detected
 * right after the word "DNI" (or "documento", for the dotted form).
 */
export const dni: Detector = {
  id: "ar.dni",
  label: "DNI",
  token: "DNI",
  country: "ar",
  pattern: /(?<![\d.-])(?:\d{1,2}\.\d{3}\.\d{3}|\d{7,8})(?![\w\-/]|\.\d)/,
  validate: (value, { text, start }) =>
    !allSameChar(onlyDigits(value)) &&
    (hasContextBefore(text, start, /\bd\.?n\.?i\b/i, 25) ||
      // "Documento 12.345.678": only the dotted form, the usual way to write a DNI.
      (value.includes(".") &&
        hasContextBefore(text, start, /\bdocumento\b|\bdoc\.|\bnro\. de doc/i, 25))),
  confidence: 0.9,
};

/** All Argentine detectors. */
export const ar: readonly Detector[] = [cuit, dni];
