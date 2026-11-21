import type { Detector } from "../core/types.js";
import { allSameChar, onlyDigits } from "../core/utils.js";

/** Luhn checksum, used by payment cards. */
export function isValidLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Email address. ASCII only (addresses with accents are not detected yet). */
export const email: Detector = {
  id: "global.email",
  label: "Email",
  token: "EMAIL",
  country: "global",
  pattern:
    /(?<![\w.%+-])[A-Za-z0-9][A-Za-z0-9._%+-]{0,63}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}(?![\w-])/,
  validate: (value) => !value.includes(".."),
  confidence: 0.95,
};

/** International phone number that starts with "+" (E.164: 8 to 15 digits). */
export const phone: Detector = {
  id: "global.phone",
  label: "Phone",
  token: "PHONE",
  country: "global",
  pattern: /(?<![\w+])\+\d{1,3}(?:[ .-]?\(?\d{1,4}\)?){2,5}(?!\d)/,
  validate: (value) => {
    const n = onlyDigits(value).length;
    return n >= 8 && n <= 15;
  },
  confidence: 0.8,
};

/** Payment card number (13 to 19 digits) with a valid Luhn checksum. */
export const card: Detector = {
  id: "global.card",
  label: "Payment card",
  token: "CARD",
  country: "global",
  pattern: /(?<![\d.-])\d(?:[ -]?\d){12,18}(?![\d-]|\.\d)/,
  validate: (value) => {
    const digits = onlyDigits(value);
    // Major networks start with 2-6 (Mastercard, Visa, Amex, Diners, Discover, JCB, Elo...).
    if (!/^[2-6]/.test(digits) || allSameChar(digits)) return false;
    // Separators, if any, must be all spaces or all dashes.
    if (/ /.test(value) && /-/.test(value)) return false;
    return isValidLuhn(digits);
  },
  confidence: 0.9,
};

const isIPv4 = (value: string) =>
  value.split(".").every((part) => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255);

/** IPv4 address. Loopback (127.x) and 0.0.0.0 are ignored. */
export const ipv4: Detector = {
  id: "global.ipv4",
  label: "IP address",
  token: "IP",
  country: "global",
  pattern: /(?<![\w.])\d{1,3}(?:\.\d{1,3}){3}(?![\w]|\.\d)/,
  validate: (value) => isIPv4(value) && !value.startsWith("127.") && value !== "0.0.0.0",
  confidence: 0.8,
};

/** IPv6 address (full or compressed with "::"). Loopback "::1" is ignored. */
export const ipv6: Detector = {
  id: "global.ipv6",
  label: "IP address",
  token: "IP",
  country: "global",
  pattern: /(?<![\w:.])(?:[0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}(?![\w:])/,
  validate: (value) => {
    const compressed = value.split("::").length - 1;
    if (compressed > 1) return false;
    const groups = value.split(":").filter((g) => g !== "");
    if (!groups.every((g) => /^[0-9A-Fa-f]{1,4}$/.test(g))) return false;
    // Without "::" it needs all 8 groups. This avoids times like 10:30:00 and MAC addresses.
    if (compressed === 0) return groups.length === 8;
    return groups.length >= 2 && groups.length <= 7;
  },
  confidence: 0.8,
};

const secret = (id: string, label: string, pattern: RegExp, confidence = 0.97): Detector => ({
  id: `global.secret.${id}`,
  label,
  token: "SECRET",
  country: "global",
  pattern,
  confidence,
});

/** API keys, tokens and private keys from common providers. */
export const secrets: readonly Detector[] = [
  secret("aws", "AWS access key", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/),
  secret("github", "GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_\w{22,255})\b/),
  secret("anthropic", "Anthropic API key", /\bsk-ant-[\w-]{20,}/),
  secret("openai", "OpenAI API key", /\bsk-(?:proj-|svcacct-|admin-)?[\w-]{20,}/, 0.96),
  secret("stripe", "Stripe key", /\b[sr]k_(?:live|test)_[A-Za-z0-9]{16,}\b/),
  secret("slack", "Slack token", /\bxox[abposr]-[A-Za-z0-9-]{10,}/),
  secret("google", "Google API key", /\bAIza[\w-]{35}(?![\w-])/),
  secret("jwt", "JSON Web Token", /\beyJ[\w-]{5,}\.eyJ[\w-]{5,}\.[\w-]{10,}/),
  secret(
    "private-key",
    "Private key",
    /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z]+ )*PRIVATE KEY-----/,
    0.99,
  ),
];

/**
 * A value assigned to a name like `password`, `secret`, `token` or `api_key`,
 * as in `.env` files, configs and code: `DB_PASSWORD=hunter2hunter2`.
 */
export const secretAssignment: Detector = {
  id: "global.secret.assignment",
  label: "Password or secret",
  token: "SECRET",
  country: "global",
  pattern:
    /(?<=(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key)\w*["']?\s*[:=]\s*["']?)[^\s"'`#,;]{8,}/i,
  validate: (value) =>
    // Skip references and templates, not secrets: process.env.X, ${X}, <your-key>, {{x}}, [SECRET_1]
    !/^(?:process\.env|import\.meta|os\.environ|\$|<|\{|%|\[[A-Z]+_\d+\])/.test(value) &&
    // Skip code like config.apiKey or getToken()
    !/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+$/.test(value) &&
    !/[()]/.test(value) &&
    !allSameChar(value),
  confidence: 0.7,
};

/** All global detectors. */
export const global: readonly Detector[] = [
  email,
  card,
  phone,
  ipv4,
  ipv6,
  ...secrets,
  secretAssignment,
];
