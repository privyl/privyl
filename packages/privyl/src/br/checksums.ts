// Check digit math for Brazilian documents. Shared by the detectors and the test data generator.

const digitsOf = (s: string) => [...s].map(Number);

/** The two CPF check digits for the first 9 digits. */
export function cpfCheckDigits(base9: string): string {
  const d = digitsOf(base9);
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += (d[i] as number) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = calc(9);
  d.push(d1);
  return `${d1}${calc(10)}`;
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/[.\-\s]/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  return cpfCheckDigits(digits.slice(0, 9)) === digits.slice(9);
}

// CNPJ characters are worth their ASCII code minus 48, so "0"-"9" → 0-9 and "A" → 17.
// This also covers the alphanumeric CNPJ used by the Receita Federal from July 2026.
const CNPJ_W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/** The two CNPJ check digits for the first 12 characters (digits or A-Z). */
export function cnpjCheckDigits(base12: string): string {
  const v = [...base12.toUpperCase()].map((c) => c.charCodeAt(0) - 48);
  const calc = (weights: number[]) => {
    let sum = 0;
    weights.forEach((w, i) => (sum += (v[i] as number) * w));
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(CNPJ_W1);
  v.push(d1);
  return `${d1}${calc(CNPJ_W2)}`;
}

export function isValidCnpj(value: string): boolean {
  const chars = value.replace(/[.\-/\s]/g, "").toUpperCase();
  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars) || /^(.)\1{13}$/.test(chars)) return false;
  return cnpjCheckDigits(chars.slice(0, 12)) === chars.slice(12);
}

/** The two CNH check digits for the first 9 digits (algorithm used by the Detran). */
export function cnhCheckDigits(base9: string): string | undefined {
  const d = digitsOf(base9);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (d[i] as number) * (9 - i);
  let d1 = sum % 11;
  let discount = 0;
  if (d1 >= 10) {
    d1 = 0;
    discount = 2;
  }
  sum = 0;
  for (let i = 0; i < 9; i++) sum += (d[i] as number) * (1 + i);
  const r = sum % 11;
  const d2 = r >= 10 ? 0 : r - discount;
  return d2 < 0 ? undefined : `${d1}${d2}`;
}

export function isValidCnh(value: string): boolean {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  return cnhCheckDigits(value.slice(0, 9)) === value.slice(9);
}

/** Area codes (DDD) in use in Brazil. */
export const BR_AREA_CODES: readonly number[] = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43,
  44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77,
  79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
];
