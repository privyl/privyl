import type { Vault } from "./vault.js";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Puts the real values back into a text (usually the AI response).
 *
 * AI models sometimes change placeholders a little, so this also accepts:
 * `[cpf_1]`, `[CPF 1]`, `[CPF-1]`, `[ CPF_1 ]`, `[CPF\_1]` (markdown escape) and `CPF_1`.
 * Placeholders that are not in the vault are left untouched.
 */
export function unmask(text: string, vault: Vault): string {
  const tokens = vault.tokens();
  if (tokens.length === 0 || text.length === 0) return text;

  // Longest tokens first, so a short token never steals part of a longer one.
  const tok = tokens
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");

  const bracketed = String.raw`\\?\[\s*(${tok})\s*(?:\\?[_\s-])?\s*(\d+)\s*\\?\]`;
  const bare = String.raw`\b(${tok})\\?_(\d+)\b`;
  const re = new RegExp(`${bracketed}|${bare}`, "gi");

  return text.replace(re, (match, t1?: string, n1?: string, t2?: string, n2?: string) => {
    const token = (t1 ?? t2 ?? "").toUpperCase();
    const n = Number(n1 ?? n2);
    return vault.get(`[${token}_${n}]`) ?? match;
  });
}
