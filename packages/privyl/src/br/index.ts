import type { Detector } from "../core/types.js";
import { allSameChar, hasContextBefore, onlyDigits } from "../core/utils.js";
import { BR_AREA_CODES, isValidCnh, isValidCnpj, isValidCpf } from "./checksums.js";

export { cnhCheckDigits, cnpjCheckDigits, cpfCheckDigits } from "./checksums.js";
export { isValidCnh, isValidCnpj, isValidCpf } from "./checksums.js";

/** CPF: 529.982.247-25 or 52998224725. Check digits are validated. */
export const cpf: Detector = {
  id: "br.cpf",
  label: "CPF",
  token: "CPF",
  country: "br",
  pattern: /(?<![\d.\-/])(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\d{9}-?\d{2})(?![\d\-/]|\.\d)/,
  validate: isValidCpf,
  confidence: (value, { text, start }) => {
    if (hasContextBefore(text, start, /\bcpf\b/i)) return 0.99;
    return /[.-]/.test(value) ? 0.95 : 0.85;
  },
};

/**
 * CNPJ: 11.222.333/0001-81 or 11222333000181.
 * Also the alphanumeric CNPJ (from July 2026), only in the formatted form: 12.ABC.345/01DE-35.
 */
export const cnpj: Detector = {
  id: "br.cnpj",
  label: "CNPJ",
  token: "CNPJ",
  country: "br",
  pattern:
    /(?<![\w.\-/])(?:[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/[0-9A-Z]{4}-\d{2}|\d{14})(?![\w\-/]|\.\d)/,
  validate: isValidCnpj,
  confidence: (value, { text, start }) => {
    if (hasContextBefore(text, start, /\bcnpj\b/i)) return 0.99;
    return /[./-]/.test(value) ? 0.95 : 0.85;
  },
};

/**
 * Random Pix key (EVP), a UUID v4. Only when the word "Pix" appears just before it,
 * because UUIDs are also used as ordinary ids. CPF, CNPJ, email and phone keys are found by
 * their own detectors.
 */
export const pixKey: Detector = {
  id: "br.pix",
  label: "Pix key",
  token: "PIX",
  country: "br",
  pattern:
    /(?<![\w-])[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?![\w-])/i,
  validate: (_value, { text, start }) => hasContextBefore(text, start, /\bpix\b/i, 40),
  confidence: 0.95,
};

/** CEP: 01310-100, or 01310100 right after the word "CEP". */
export const cep: Detector = {
  id: "br.cep",
  label: "CEP",
  token: "CEP",
  country: "br",
  pattern: /(?<![\d.\-/])\d{5}-\d{3}(?![\d\-/])|(?<=\bcep\s*:?\s*)\d{8}(?!\d)/i,
  validate: (value) => onlyDigits(value) !== "00000000",
  confidence: (_value, { text, start }) =>
    hasContextBefore(text, start, /\bcep\b/i) ? 0.95 : 0.75,
};

/** CNH (driver's license): 11 digits with check digits, only near the word "CNH" or "habilitação". */
export const cnh: Detector = {
  id: "br.cnh",
  label: "CNH",
  token: "CNH",
  country: "br",
  pattern: /(?<!\d)\d{11}(?!\d)/,
  validate: (value, { text, start }) =>
    isValidCnh(value) && hasContextBefore(text, start, /\bcnh\b|habilita/i, 40),
  confidence: 0.97,
};

/** Vehicle plate: old format ABC-1234 or Mercosul ABC1D23. */
export const plate: Detector = {
  id: "br.plate",
  label: "Vehicle plate",
  token: "PLATE",
  country: "br",
  pattern: /(?<![\w-])[A-Z]{3}(?:-\d{4}|\d[A-Z]\d{2})(?![\w-])/,
  confidence: (value, { text, start }) => {
    if (hasContextBefore(text, start, /placa|ve[íi]culo|carro|moto/i)) return 0.95;
    return value.includes("-") ? 0.7 : 0.8;
  },
};

/**
 * Brazilian phone: +55 11 98765-4321, (11) 98765-4321, 11 3456-7890...
 * Digits-only numbers are accepted only near words like "tel", "celular" or "WhatsApp".
 */
export const phoneBr: Detector = {
  id: "br.phone",
  label: "Phone (BR)",
  token: "PHONE",
  country: "br",
  pattern: /(?<![\d+])(?:\+?55[ .-]?)?(?:\(\d{2}\)|\d{2})[ .-]?(?:9[ .-]?)?\d{4}[ .-]?\d{4}(?!\d)/,
  validate: (value, { text, start }) => {
    let digits = onlyDigits(value);
    if (digits.length >= 12 && digits.startsWith("55")) digits = digits.slice(2);
    if (digits.length !== 10 && digits.length !== 11) return false;
    if (!BR_AREA_CODES.includes(Number(digits.slice(0, 2)))) return false;
    const first = digits[2] as string;
    const validLocal = digits.length === 11 ? first === "9" : "2345".includes(first);
    if (!validLocal || allSameChar(digits.slice(2))) return false;

    const formatted = /[^\d]/.test(value);
    return formatted || hasContextBefore(text, start, PHONE_CONTEXT);
  },
  confidence: (value) => (value.startsWith("+55") ? 0.95 : 0.9),
};

const PHONE_CONTEXT = /\btel|fone|celular|\bcel\b|whats|contato|ligar/i;

/** All Brazilian detectors. */
export const br: readonly Detector[] = [cpf, cnpj, pixKey, cep, cnh, plate, phoneBr];
