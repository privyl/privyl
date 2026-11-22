// Small helpers for detector authors.

/** Keeps only the digits 0-9. */
export const onlyDigits = (value: string): string => value.replace(/\D/g, "");

/** True if every character is the same (for example "11111111111"). */
export const allSameChar = (value: string): boolean => /^(.)\1*$/.test(value);

/**
 * True if `keyword` appears in the `distance` characters before the match.
 * Useful for ambiguous formats, for example a raw 11-digit number near the word "CNH".
 */
export function hasContextBefore(
  text: string,
  start: number,
  keyword: RegExp,
  distance = 30,
): boolean {
  return keyword.test(text.slice(Math.max(0, start - distance), start));
}

// Labels that say the next number is a business code, not personal data.
const CODE_LABEL =
  /(?:\bpedido|\border|\bnota fiscal|\bnf-?e?|\binvoice|\bprotocolo|\bprotocol|\brastreio|\btracking|\bsku|\blote|\blot|\bref|\bserial|\bpart(?: number| no)?|\bitem|\bproduto|\bproduct|\bc[oó]digo|\bcode|\bmodelo|\bmodel|\bchamado|\bticket|\bfolio|\bversion|\bvers[aã]o|\bcupom|\bcoupon|\bvoucher|\bpromo|\bboleto|\blinha digit[aá]vel)\.?\s*(?:n[º°o]\.?|nro\.?|#|number|num\.?)?\s*[:=#]?\s*$/i;

/**
 * True when the match comes right after a label like "pedido", "nota fiscal", "lote", "SKU",
 * "order" or "part number". A valid check digit can happen by chance (about 1 in 11 to 1 in 100),
 * so detectors use this to skip business codes.
 */
export function isAfterCodeLabel(text: string, start: number): boolean {
  return CODE_LABEL.test(text.slice(Math.max(0, start - 25), start));
}
