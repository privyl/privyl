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
