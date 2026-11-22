// Attacks on the library itself. If one of these fails, someone could freeze a server that uses
// Privyl by sending a crafted text (ReDoS), or get real data back where it does not belong.

import { describe, expect, it } from "vitest";
import { createShield } from "./core/index.js";
import { allDetectors } from "./scan/index.js";

const shield = createShield({ detectors: allDetectors });
const N = 100_000;

// Inputs built to make regular expressions backtrack. Normal speed is ~10-50 ms for each one;
// the budget is generous so slow CI machines never fail by accident, but a quadratic regex
// (seconds or minutes) always does. "password" + spaces took 11 s before the fix.
const ATTACKS: Record<string, string> = {
  digits: "1".repeat(N),
  digitsSpaced: "1 ".repeat(N / 2),
  digitsDashed: "1-".repeat(N / 2),
  dots: "1.".repeat(N / 2),
  emailNoTld: "a@" + "a".repeat(N),
  emailLabels: "a@" + "a.".repeat(N / 2),
  emailHyphens: "a@" + "a-".repeat(N / 2),
  emailManyAt: "a@".repeat(N / 2),
  emailLocal: "a.".repeat(N / 2) + "@",
  obfuscatedAt: "a [at] ".repeat(N / 7),
  obfuscatedDot: "a [at] " + "a [dot] ".repeat(N / 8),
  colons: ":".repeat(N),
  hexColons: "a:".repeat(N / 2),
  plusDigits: "+1 ".repeat(N / 3),
  passwordSpaces: "password" + " ".repeat(N) + "=x",
  passwordColon: "password:" + " ".repeat(N) + "x",
  passwordEquals: "password=" + "=".repeat(N),
  cepSpaces: "cep" + " ".repeat(N) + "1",
  labelSpaces: "pedido" + " ".repeat(N) + "52998224725",
  privateKeyNoEnd: "-----BEGIN PRIVATE KEY-----" + "a".repeat(N),
  privateKeyMany: "-----BEGIN PRIVATE KEY-----".repeat(N / 27),
  jwt: "eyJ" + "a".repeat(N),
  upperDigits: "A1".repeat(N / 2),
  placeholders: "[CPF_1]".repeat(N / 7),
  nbsp: " ".repeat(N),
  fullWidthDigits: "１".repeat(N),
};

describe("security: crafted inputs stay fast (no ReDoS)", () => {
  it.each(Object.entries(ATTACKS))("%s", (_name, text) => {
    const started = performance.now();
    const { text: masked, vault } = shield.mask(text);
    shield.unmask(masked, vault);
    expect(performance.now() - started).toBeLessThan(1500);
  });

  it("handles many findings in one text", () => {
    const text = "CPF 529.982.247-25, ana@example.com; ".repeat(5000);
    const started = performance.now();
    const { findings } = shield.mask(text);
    expect(findings).toHaveLength(10_000);
    expect(performance.now() - started).toBeLessThan(1500);
  });
});

describe("security: unmask only restores what this vault masked", () => {
  it("does not restore placeholders the user typed", () => {
    const input = "Copy CPF_1 from the template. My CPF: 529.982.247-25";
    const { text, vault } = shield.mask(input);
    expect(text).not.toMatch(/: \[CPF_1\]$/);
    // The AI repeats both; only the real one comes back as a CPF.
    expect(shield.unmask(text, vault)).toBe(input);
  });

  it("is not confused by replacement patterns in values", () => {
    // String.replace treats "$&" and "$1" specially; unmask must give back the exact value.
    const input = "DB_PASSWORD=Fake$&$1$$abc!";
    const { text, vault } = shield.mask(input);
    expect(text).toBe("DB_PASSWORD=[SECRET_1]");
    expect(shield.unmask(text, vault)).toBe(input);
  });
});
