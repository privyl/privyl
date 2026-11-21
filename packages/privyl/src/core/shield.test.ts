import { describe, expect, it } from "vitest";
import { createShield, unmask, Vault, type Detector } from "./index.js";

// Tiny detectors used only to test the core. Real detectors live in /global and /br.
const email: Detector = {
  id: "test.email",
  label: "Email",
  token: "EMAIL",
  country: "global",
  pattern: /[a-z0-9.]+@example\.com/,
};
const elevenDigits: Detector = {
  id: "test.id",
  label: "ID",
  token: "ID",
  country: "test",
  pattern: /(?<!\d)\d{11}(?!\d)/,
  confidence: 0.9,
};
const phone: Detector = {
  id: "test.phone",
  label: "Phone",
  token: "PHONE",
  country: "test",
  pattern: /(?<!\d)\d{2} ?\d{9}(?!\d)/,
  confidence: 0.7,
};
const evenOnly: Detector = {
  id: "test.even",
  label: "Even",
  token: "EVEN",
  country: "test",
  pattern: /#\d+/,
  validate: (v) => Number(v.slice(1)) % 2 === 0,
};

const shield = createShield({ detectors: [email, elevenDigits, phone, evenOnly] });

describe("mask", () => {
  it("replaces detected values with numbered placeholders", () => {
    const { text, findings } = shield.mask("Customer 52998224725, email ana@example.com");
    expect(text).toBe("Customer [ID_1], email [EMAIL_1]");
    expect(findings.map((f) => f.placeholder)).toEqual(["[ID_1]", "[EMAIL_1]"]);
  });

  it("gives the same value the same placeholder", () => {
    const { text } = shield.mask("a@example.com, b@example.com, a@example.com");
    expect(text).toBe("[EMAIL_1], [EMAIL_2], [EMAIL_1]");
  });

  it("keeps placeholders consistent across calls when the vault is reused", () => {
    const vault = new Vault();
    const first = shield.mask("Hi a@example.com", { vault });
    const second = shield.mask("Write to b@example.com and a@example.com", { vault });
    expect(first.text).toBe("Hi [EMAIL_1]");
    expect(second.text).toBe("Write to [EMAIL_2] and [EMAIL_1]");
  });

  it("never puts the real value in findings", () => {
    const { findings } = shield.mask("ana@example.com");
    expect(JSON.stringify(findings)).not.toContain("ana@example.com");
    expect(findings[0]).toEqual({
      type: "test.email",
      label: "Email",
      country: "global",
      start: 0,
      end: 15,
      confidence: 0.9,
      placeholder: "[EMAIL_1]",
    });
  });

  it("handles empty text", () => {
    const { text, findings, vault } = shield.mask("");
    expect(text).toBe("");
    expect(findings).toEqual([]);
    expect(vault.size).toBe(0);
  });

  it("returns text unchanged when nothing is found", () => {
    expect(shield.mask("nothing to see here").text).toBe("nothing to see here");
  });

  it("works with unicode, emoji and accents around values", () => {
    const input = "Olá 👋🏽 ação: ana@example.com — 日本語";
    const { text, vault } = shield.mask(input);
    expect(text).toBe("Olá 👋🏽 ação: [EMAIL_1] — 日本語");
    expect(shield.unmask(text, vault)).toBe(input);
  });

  it("uses validate to discard candidates", () => {
    expect(shield.mask("#2 #3 #4").text).toBe("[EVEN_1] #3 [EVEN_2]");
  });

  it("does not reuse a placeholder that already appears in the input", () => {
    const input = "The template uses [EMAIL_1]; real one is ana@example.com";
    const { text, vault } = shield.mask(input);
    expect(text).toBe("The template uses [EMAIL_1]; real one is [EMAIL_2]");
    // Unmask restores the real value and leaves the literal text alone.
    expect(shield.unmask(text, vault)).toBe(input);
  });

  it("does not reuse a regex lastIndex between calls", () => {
    const a = shield.mask("x a@example.com");
    const b = shield.mask("a@example.com");
    expect(a.text).toBe("x [EMAIL_1]");
    expect(b.text).toBe("[EMAIL_1]");
  });
});

describe("overlaps", () => {
  it("keeps the more confident detection", () => {
    // "11 987654321" can only be a phone; "11987654321" matches both ID (0.9) and phone (0.7).
    expect(shield.mask("11987654321").findings.map((f) => f.type)).toEqual(["test.id"]);
    expect(shield.mask("11 987654321").findings.map((f) => f.type)).toEqual(["test.phone"]);
  });

  it("prefers the longer match when confidence is equal", () => {
    const short: Detector = { ...email, id: "t.short", token: "S", pattern: /abc/ };
    const long: Detector = { ...email, id: "t.long", token: "L", pattern: /abcdef/ };
    const s = createShield({ detectors: [short, long] });
    expect(s.mask("abcdef").text).toBe("[L_1]");
  });

  it("uses detector order as the last tie-breaker", () => {
    const a: Detector = { ...email, id: "t.a", token: "A", pattern: /abc/ };
    const b: Detector = { ...email, id: "t.b", token: "B", pattern: /abc/ };
    expect(createShield({ detectors: [a, b] }).mask("abc").text).toBe("[A_1]");
    expect(createShield({ detectors: [b, a] }).mask("abc").text).toBe("[B_1]");
  });

  it("keeps non-overlapping neighbours", () => {
    const a: Detector = { ...email, id: "t.a", token: "A", pattern: /ab/ };
    const b: Detector = { ...email, id: "t.b", token: "B", pattern: /cd/ };
    expect(createShield({ detectors: [a, b] }).mask("abcd").text).toBe("[A_1][B_1]");
  });
});

describe("unmask", () => {
  const { text, vault } = shield.mask("Email ana@example.com, ID 52998224725");

  it("restores the original text", () => {
    expect(text).toBe("Email [EMAIL_1], ID [ID_1]");
    expect(shield.unmask(text, vault)).toBe("Email ana@example.com, ID 52998224725");
  });

  it("restores placeholders the AI repeated", () => {
    expect(unmask("[EMAIL_1] ... again [EMAIL_1]", vault)).toBe(
      "ana@example.com ... again ana@example.com",
    );
  });

  it.each([
    ["[email_1]"],
    ["[Email_1]"],
    ["[EMAIL 1]"],
    ["[EMAIL-1]"],
    ["[ EMAIL_1 ]"],
    ["[EMAIL1]"],
    [String.raw`[EMAIL\_1]`],
    [String.raw`\[EMAIL_1\]`],
    ["EMAIL_1"],
  ])("restores a placeholder the AI changed: %s", (changed) => {
    expect(unmask(`Send it to ${changed}.`, vault)).toBe("Send it to ana@example.com.");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(unmask("[EMAIL_9] and [CPF_1]", vault)).toBe("[EMAIL_9] and [CPF_1]");
  });

  it("does not touch similar words that are not placeholders", () => {
    expect(unmask("EMAIL_10 and MYEMAIL_1 and EMAIL_1x", vault)).toBe(
      "EMAIL_10 and MYEMAIL_1 and EMAIL_1x",
    );
  });

  it("returns text unchanged with an empty vault", () => {
    expect(unmask("[EMAIL_1]", new Vault())).toBe("[EMAIL_1]");
  });
});

describe("Vault", () => {
  it("serializes and restores", () => {
    const { vault } = shield.mask("a@example.com b@example.com");
    const copy = Vault.fromJSON(JSON.parse(JSON.stringify(vault)));
    expect(copy.entries()).toEqual(vault.entries());
    // New values continue the numbering.
    expect(shield.mask("c@example.com", { vault: copy }).text).toBe("[EMAIL_3]");
  });

  it("rejects invalid data", () => {
    expect(() => Vault.fromJSON({ version: 1, entries: [["oops", "x"]] })).toThrow();
  });
});

describe("createShield", () => {
  it("rejects duplicate detector ids", () => {
    expect(() => createShield({ detectors: [email, email] })).toThrow(/Duplicate/);
  });

  it("rejects invalid tokens", () => {
    expect(() => createShield({ detectors: [{ ...email, token: "e-mail" }] })).toThrow(/token/);
  });
});
