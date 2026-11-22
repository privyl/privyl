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
  return text.replace(placeholderPattern(tokens), (match, ...groups: unknown[]) => {
    return vault.get(canonical(groups)) ?? match;
  });
}

/**
 * Every placeholder written in `text` in any form `unmask` accepts (`CPF_1`, `[cpf 1]`...),
 * as canonical placeholders (`[CPF_1]`). `mask` skips these so it never reuses them.
 */
export function placeholdersIn(text: string, tokens: readonly string[]): Set<string> {
  const found = new Set<string>();
  if (tokens.length === 0) return found;
  for (const m of text.matchAll(placeholderPattern(tokens))) found.add(canonical(m.slice(1)));
  return found;
}

/** The lenient placeholder pattern. Groups: token and number (bracketed), token and number (bare). */
function placeholderPattern(tokens: readonly string[]): RegExp {
  // Longest tokens first, so a short token never steals part of a longer one.
  const tok = [...tokens]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");
  const bracketed = String.raw`\\?\[\s*(${tok})\s*(?:\\?[_\s-])?\s*(\d+)\s*\\?\]`;
  const bare = String.raw`\b(${tok})\\?_(\d+)\b`;
  return new RegExp(`${bracketed}|${bare}`, "gi");
}

function canonical(groups: unknown[]): string {
  const [t1, n1, t2, n2] = groups as (string | undefined)[];
  return `[${(t1 ?? t2 ?? "").toUpperCase()}_${Number(n1 ?? n2)}]`;
}
