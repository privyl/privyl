import { describe, expect, it } from "vitest";
import { br } from "../br/index.js";
import { createShield, type Detector } from "../core/index.js";
import { global } from "../global/index.js";
import { createFaker } from "../testing/index.js";
import {
  citizenCard,
  isValidCitizenCard,
  isValidNif,
  isValidNiss,
  nif,
  niss,
  pt,
} from "./index.js";

const found = (d: Detector, text: string) =>
  createShield({ detectors: [d] })
    .detect(text)
    .map((c) => c.value);
const faker = createFaker(351);
const breakLast = (v: string) => v.slice(0, -1) + String((Number(v.at(-1)) + 1) % 10);

describe("NIF", () => {
  it("validates the check digit", () => {
    expect(isValidNif("123456789")).toBe(true);
    expect(isValidNif("123456780")).toBe(false);
    expect(isValidNif("411111111")).toBe(false); // 4 is not a valid first digit
    for (let i = 0; i < 100; i++) expect(isValidNif(faker.nif())).toBe(true);
  });

  it("detects a NIF near the word NIF or contribuinte, or with the PT prefix", () => {
    expect(found(nif, "NIF: 123456789")).toEqual(["123456789"]);
    expect(found(nif, "Contribuinte n.º 123 456 789")).toEqual(["123 456 789"]);
    expect(found(nif, "VAT PT123456789")).toEqual(["PT123456789"]);
    expect(found(nif, "Fatura para PT123456789")).toEqual(["PT123456789"]);
  });

  it("ignores 9-digit numbers without context and wrong check digits", () => {
    expect(found(nif, "Encomenda 123456789 enviada")).toEqual([]);
    expect(found(nif, "NIF 123456780")).toEqual([]);
    expect(found(nif, "NIF 1234567890")).toEqual([]); // part of a longer number
  });
});

describe("Cartão de Cidadão", () => {
  it("detects generated numbers, with or without spaces", () => {
    for (let i = 0; i < 100; i++) {
      const value = faker.citizenCard();
      expect(found(citizenCard, `CC ${value} válido`)).toEqual([value]);
      const compact = value.replace(/ /g, "");
      expect(found(citizenCard, compact)).toEqual([compact]);
    }
  });

  it("rejects a wrong check digit", () => {
    const value = faker.citizenCard();
    expect(isValidCitizenCard(breakLast(value))).toBe(false);
    expect(found(citizenCard, breakLast(value))).toEqual([]);
  });
});

describe("NISS", () => {
  it("detects a NISS near the word NISS or Segurança Social", () => {
    for (let i = 0; i < 50; i++) {
      const value = faker.niss();
      expect(isValidNiss(value)).toBe(true);
      expect(found(niss, `NISS ${value}`)).toEqual([value]);
      expect(found(niss, `Segurança Social: ${value}`)).toEqual([value]);
    }
  });

  it("needs context and a valid check digit", () => {
    const value = faker.niss();
    expect(found(niss, value)).toEqual([]);
    expect(found(niss, `NISS ${breakLast(value)}`)).toEqual([]);
  });
});

describe("pt with global and br", () => {
  const shield = createShield({ detectors: [...global, ...br, ...pt] });

  it("masks a realistic message", () => {
    const cc = faker.citizenCard();
    const { text } = shield.mask(
      `Olá, o meu NIF é 123456789, CC ${cc} e o email inês@exemplo.pt. Telemóvel +351 912 345 678.`,
    );
    expect(text).toBe(
      "Olá, o meu NIF é [NIF_1], CC [CC_1] e o email [EMAIL_1]. Telemóvel [PHONE_1].",
    );
  });

  it("NISS wins over CPF/CNH when the word NISS is nearby", () => {
    const value = faker.niss();
    const [c] = shield.detect(`NISS ${value}`);
    expect(c?.detector.id).toBe("pt.niss");
  });
});
