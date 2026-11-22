// Fake test data with valid formats. Never use real personal data in tests, examples or demos.
//
// Values are random but have correct check digits, so detectors accept them.
// The same seed always gives the same values, so tests and examples are reproducible.

import { cuitCheckDigit } from "../ar/index.js";
import { BR_AREA_CODES, cnhCheckDigits, cnpjCheckDigits, cpfCheckDigits } from "../br/checksums.js";
import { rutCheckDigit } from "../cl/index.js";
import { curpCheckDigit, rfcCheckDigit } from "../mx/index.js";
import { isValidCitizenCard, nifCheckDigit, nissCheckDigit } from "../pt/index.js";

/** Well-known public test card numbers (Visa, Mastercard, Amex, Discover). Not real cards. */
export const TEST_CARDS: readonly string[] = [
  "4111 1111 1111 1111",
  "4242 4242 4242 4242",
  "5555 5555 5555 4444",
  "5105 1051 0510 5100",
  "3782 822463 10005",
  "6011 1111 1111 1117",
];

const FIRST_NAMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Felipe", "Gabi", "Heitor"];
const LAST_NAMES = ["Exemplo", "Ficticio", "Teste", "Modelo", "Amostra", "Simulado"];

export interface Faker {
  /** Random integer between min and max (inclusive). */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  /** A fictional full name. */
  name(): string;
  /** An email at example.com, a domain reserved for documentation. */
  email(name?: string): string;
  cpf(options?: { formatted?: boolean }): string;
  cnpj(options?: { formatted?: boolean; alphanumeric?: boolean }): string;
  cnh(): string;
  cep(): string;
  plate(options?: { mercosul?: boolean }): string;
  phoneBr(options?: { mobile?: boolean; international?: boolean }): string;
  /** A UUID v4, the format of a random Pix key. */
  pixKey(): string;
  /** A public test card number. */
  card(): string;
  /** An IPv4 from the ranges reserved for documentation (RFC 5737). */
  ipv4(): string;
  // ---- Portugal ----
  nif(options?: { formatted?: boolean }): string;
  /** Cartão de Cidadão document number, like "12345678 9 ZZ1". */
  citizenCard(): string;
  niss(): string;
  // ---- Argentina ----
  cuit(options?: { formatted?: boolean }): string;
  dni(): string;
  // ---- United States ----
  ssn(): string;
  itin(): string;
  // ---- Mexico ----
  curp(): string;
  rfc(options?: { company?: boolean }): string;
  // ---- Chile ----
  rut(options?: { dots?: boolean }): string;
}

/** Creates a deterministic generator. Same seed → same values. */
export function createFaker(seed = 1): Faker {
  // mulberry32: a tiny, fast pseudo-random generator. Good for test data, not for security.
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const pick = <T>(items: readonly T[]): T => items[int(0, items.length - 1)] as T;
  const digits = (n: number) => Array.from({ length: n }, () => int(0, 9)).join("");
  const hex = (n: number) => Array.from({ length: n }, () => int(0, 15).toString(16)).join("");
  const letters = (n: number) =>
    Array.from({ length: n }, () => String.fromCharCode(65 + int(0, 25))).join("");
  const notAllSame = (make: () => string) => {
    let v = make();
    while (/^(.)\1*$/.test(v)) v = make();
    return v;
  };

  return {
    int,
    pick,
    name: () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    email(name) {
      const local = (name ?? `${pick(FIRST_NAMES)}.${pick(LAST_NAMES)}`)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".");
      return `${local}${int(1, 99)}@example.com`;
    },
    cpf({ formatted = true } = {}) {
      const base = notAllSame(() => digits(9));
      const v = base + cpfCheckDigits(base);
      return formatted ? `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}` : v;
    },
    cnpj({ formatted = true, alphanumeric = false } = {}) {
      const root = alphanumeric
        ? Array.from({ length: 8 }, () => (int(0, 1) ? letters(1) : digits(1))).join("")
        : notAllSame(() => digits(8));
      const base = root + "0001";
      const v = base + cnpjCheckDigits(base);
      if (!formatted && !alphanumeric) return v;
      return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`;
    },
    cnh() {
      for (;;) {
        const base = notAllSame(() => digits(9));
        const dv = cnhCheckDigits(base);
        if (dv) return base + dv;
      }
    },
    cep: () => `${int(1, 9)}${digits(4)}-${digits(3)}`,
    plate: ({ mercosul = true } = {}) =>
      mercosul
        ? `${letters(3)}${digits(1)}${letters(1)}${digits(2)}`
        : `${letters(3)}-${digits(4)}`,
    phoneBr({ mobile = true, international = false } = {}) {
      const ddd = pick(BR_AREA_CODES);
      const local = mobile ? `9${digits(4)}-${digits(4)}` : `${int(2, 5)}${digits(3)}-${digits(4)}`;
      return international ? `+55 ${ddd} ${local}` : `(${ddd}) ${local}`;
    },
    pixKey: () =>
      `${hex(8)}-${hex(4)}-4${hex(3)}-${pick(["8", "9", "a", "b"])}${hex(3)}-${hex(12)}`,
    card: () => pick(TEST_CARDS),
    ipv4: () => `${pick(["192.0.2", "198.51.100", "203.0.113"])}.${int(1, 254)}`,

    nif({ formatted = false } = {}) {
      const base = notAllSame(() => `${pick(["1", "2", "3"])}${digits(7)}`);
      const v = base + nifCheckDigit(base);
      return formatted ? `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}` : v;
    },
    citizenCard() {
      const civil = notAllSame(() => digits(8));
      let sum = 0;
      for (let i = 0; i < 8; i++) sum += Number(civil[i]) * (9 - i);
      const civilCheck = ((11 - (sum % 11)) % 11) % 10;
      const head = `${civil} ${civilCheck} Z${pick(["Z", "Y", "X"])}`;
      for (let d = 0; ; d++) if (isValidCitizenCard(head + d)) return head + d;
    },
    niss() {
      const base = `1${digits(9)}`;
      return base + nissCheckDigit(base);
    },
    cuit({ formatted = true } = {}) {
      for (;;) {
        const base = `${pick(["20", "23", "27", "30"])}${digits(8)}`;
        const dv = cuitCheckDigit(base);
        if (dv === undefined) continue;
        return formatted ? `${base.slice(0, 2)}-${base.slice(2)}-${dv}` : base + dv;
      }
    },
    dni: () => `${int(10, 45)}.${digits(3)}.${digits(3)}`,
    ssn() {
      let area = int(1, 899);
      if (area === 666) area = 667;
      const pad = (n: number, len: number) => String(n).padStart(len, "0");
      return `${pad(area, 3)}-${pad(int(1, 99), 2)}-${pad(int(1, 9999), 4)}`;
    },
    itin: () => `9${digits(2)}-${int(70, 88)}-${digits(4)}`,
    curp() {
      const consonants = "BCDFGHJKLMNPQRSTVWXYZ";
      const consonant = () => consonants[int(0, consonants.length - 1)] as string;
      const pad = (n: number) => String(n).padStart(2, "0");
      const base =
        letters(1) +
        pick(["A", "E", "I", "O", "U"]) +
        letters(2) +
        pad(int(50, 99)) +
        pad(int(1, 12)) +
        pad(int(1, 28)) +
        pick(["H", "M"]) +
        pick(["DF", "JC", "NL", "PL", "VZ", "YN"]) +
        consonant() +
        consonant() +
        consonant() +
        digits(1);
      return base + curpCheckDigit(base);
    },
    rfc({ company = false } = {}) {
      const pad = (n: number) => String(n).padStart(2, "0");
      const base =
        letters(company ? 3 : 4) +
        pad(int(50, 99)) +
        pad(int(1, 12)) +
        pad(int(1, 28)) +
        letters(1) +
        digits(1);
      return base + rfcCheckDigit(base);
    },
    rut({ dots = true } = {}) {
      const body = String(int(5_000_000, 25_000_000));
      const dv = rutCheckDigit(body);
      if (!dots) return `${body}-${dv}`;
      return `${body.slice(0, -6)}.${body.slice(-6, -3)}.${body.slice(-3)}-${dv}`;
    },
  };
}
