import type { Detector } from "../core/types.js";
import { allSameChar, hasContextBefore, isAfterCodeLabel, onlyDigits } from "../core/utils.js";
import { BR_AREA_CODES, isValidCnh, isValidCnpj, isValidCpf } from "./checksums.js";

export { cnhCheckDigits, cnpjCheckDigits, cpfCheckDigits } from "./checksums.js";
export { isValidCnh, isValidCnpj, isValidCpf } from "./checksums.js";

const CPF_WORD = /\bcpf\b/i;

/**
 * CPF: 529.982.247-25 or 52998224725, and 529 982 247 25 right after the word "CPF".
 * Check digits are validated. Digits right after "pedido", "nota fiscal" and similar are skipped.
 */
export const cpf: Detector = {
  id: "br.cpf",
  label: "CPF",
  token: "CPF",
  country: "br",
  pattern:
    /(?<![\d.\-/])(?<!\d )(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\d{9}-?\d{2}|\d{3} \d{3} \d{3}[ -]\d{2})(?![\d\-/]|\.\d| \d)/,
  validate: (value, { text, start }) => {
    if (!isValidCpf(value)) return false;
    if (value.includes(" ")) return hasContextBefore(text, start, CPF_WORD); // spaces: ambiguous
    return /[.-]/.test(value) || !isAfterCodeLabel(text, start);
  },
  confidence: (value, { text, start }) => {
    if (hasContextBefore(text, start, CPF_WORD)) return 0.99;
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
  validate: (value, { text, start }) =>
    isValidCnpj(value) && (/[./-]/.test(value) || !isAfterCodeLabel(text, start)),
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

// These make a CEP more likely.
const ADDRESS_WORDS =
  /\bcep\b|endere[çc]o|\brua\b|\bav\.|avenida|alameda|travessa|rodovia|estrada|bairro|logradouro|postal|\bzip\b|\bmoro\b|resid|entrega/i;
// State codes ("São Paulo/SP", "Recife - PE"), uppercase only so words like "se" or "to" don't count.
const STATE_CODE =
  /(?:^|[\s,/-])(?:AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/;

/**
 * CEP: 01310-100, or 01310100 right after the word "CEP".
 * Skipped right after a label like "lote", "pedido" or "protocolo" (those are business codes).
 * An address word (CEP, rua, avenida, bairro...) or a state code like "SP" raises the confidence.
 */
export const cep: Detector = {
  id: "br.cep",
  label: "CEP",
  token: "CEP",
  country: "br",
  pattern: /(?<![\d.\-/])\d{5}-\d{3}(?![\d\-/])|(?<=\bcep\s{0,3}:?\s{0,3})\d{8}(?!\d)/i,
  validate: (value, { text, start }) =>
    onlyDigits(value) !== "00000000" && !isAfterCodeLabel(text, start),
  confidence: (_value, { text, start }) => {
    if (hasContextBefore(text, start, /\bcep\b/i)) return 0.95;
    const address =
      hasContextBefore(text, start, ADDRESS_WORDS, 60) ||
      hasContextBefore(text, start, STATE_CODE, 30);
    return address ? 0.85 : 0.7;
  },
};

/**
 * CNH (driver's license): 11 digits with check digits, only near "CNH", "habilitação" or
 * "carteira de motorista".
 */
export const cnh: Detector = {
  id: "br.cnh",
  label: "CNH",
  token: "CNH",
  country: "br",
  pattern: /(?<!\d)\d{11}(?!\d)/,
  validate: (value, { text, start }) =>
    isValidCnh(value) && hasContextBefore(text, start, /\bcnh\b|habilita|motorista/i, 40),
  confidence: 0.97,
};

const VEHICLE_CONTEXT = /placa|ve[íi]culo|carro|moto|caminh[ãa]o|[ôo]nibus|detran|renavam/i;

/**
 * Vehicle plate: Mercosul ABC1D23, or the old format ABC-1234.
 * The old format looks like a product code, so it is skipped right after "produto", "SKU",
 * "código", "item" and similar labels.
 */
export const plate: Detector = {
  id: "br.plate",
  label: "Vehicle plate",
  token: "PLATE",
  country: "br",
  pattern: /(?<![\w-])[A-Z]{3}(?:-\d{4}|\d[A-Z]\d{2})(?![\w-])/,
  // Both formats are skipped right after a label such as "cupom" or "SKU".
  validate: (_value, { text, start }) => !isAfterCodeLabel(text, start),
  confidence: (value, { text, start }) => {
    if (hasContextBefore(text, start, VEHICLE_CONTEXT, 40)) return 0.95;
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
  pattern:
    /(?<![\d+])(?:\+?55[ .-]?)?(?:\(\d{2}\)|\d{2})[ .-]?(?:9[ .-]?)?\d{4}[ .-]?\d{4}(?!-?\d)/,
  validate: (value, { text, start }) => {
    let digits = onlyDigits(value);
    if (digits.length >= 12 && digits.startsWith("55")) digits = digits.slice(2);
    if (digits.length !== 10 && digits.length !== 11) return false;
    if (!BR_AREA_CODES.includes(Number(digits.slice(0, 2)))) return false;
    const first = digits[2] as string;
    const validLocal = digits.length === 11 ? first === "9" : "2345".includes(first);
    if (!validLocal || allSameChar(digits.slice(2))) return false;

    const formatted = /[^\d]/.test(value);
    if (formatted || hasContextBefore(text, start, PHONE_CONTEXT)) return true;
    // Digits only, no context word: accept a mobile (DDD + 9 + 8 digits) unless it comes right
    // after a label like "pedido". A landline (10 digits) is too ambiguous without context.
    return digits.length === 11 && !isAfterCodeLabel(text, start);
  },
  confidence: (value, { text, start }) => {
    if (value.startsWith("+55")) return 0.95;
    if (/[^\d]/.test(value) || hasContextBefore(text, start, PHONE_CONTEXT)) return 0.9;
    return 0.75; // lower than a bare CPF, so an 11-digit number valid as both stays a CPF
  },
};

const PHONE_CONTEXT =
  /\btel|fone|celular|\bcel\b|whats|\bzap\b|\bwpp\b|contato|\blig[au]|\bchamar?\b/i;

/** All Brazilian detectors. */
export const br: readonly Detector[] = [cpf, cnpj, pixKey, cep, cnh, plate, phoneBr];
