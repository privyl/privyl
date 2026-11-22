// Chile: RUT/RUN (national id and tax id, the same number), with a mod 11 check digit.

import type { Detector } from "../core/types.js";
import { allSameChar, hasContextBefore, isAfterCodeLabel } from "../core/utils.js";

/** The RUT check digit ("0"-"9" or "K") for the number before the dash. */
export function rutCheckDigit(body: string): string {
  let sum = 0;
  let weight = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * weight;
    weight = weight === 7 ? 2 : weight + 1;
  }
  const r = 11 - (sum % 11);
  return r === 11 ? "0" : r === 10 ? "K" : String(r);
}

export function isValidRut(value: string): boolean {
  const s = value.replace(/\./g, "").toUpperCase();
  const m = /^(\d{7,8})-([\dK])$/.exec(s);
  if (!m || allSameChar(m[1] as string)) return false;
  return rutCheckDigit(m[1] as string) === m[2];
}

/**
 * RUT/RUN: 12.345.678-5 or 12345678-5 (the check digit can be K).
 * Without the dots it looks like other codes, so it is skipped right after labels such as "lote",
 * "folio" or "pedido", and it is less confident without the word "RUT" or "RUN".
 */
export const rut: Detector = {
  id: "cl.rut",
  label: "RUT/RUN",
  token: "RUT",
  country: "cl",
  pattern: /(?<![\d.\-/])(?:\d{1,2}\.\d{3}\.\d{3}|\d{7,8})-[\dkK](?![\w-])/,
  validate: (value, { text, start }) =>
    isValidRut(value) && (value.includes(".") || !isAfterCodeLabel(text, start)),
  confidence: (value, { text, start }) =>
    value.includes(".") || hasContextBefore(text, start, /\bru[tn]\b/i, 30) ? 0.95 : 0.75,
};

/** All Chilean detectors. */
export const cl: readonly Detector[] = [rut];
