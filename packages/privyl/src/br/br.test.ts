import { describe, expect, it } from "vitest";
import { createShield } from "../core/index.js";
import { createFaker } from "../testing/index.js";
import {
  br,
  cep,
  cnh,
  cnpj,
  cpf,
  isValidCnpj,
  isValidCpf,
  phoneBr,
  pixKey,
  plate,
} from "./index.js";

const faker = createFaker(42);
const shield = createShield({ detectors: br });
const types = (text: string) => shield.mask(text).findings.map((f) => f.type);
const only = (detector: typeof cpf) => createShield({ detectors: [detector] });
const found = (detector: typeof cpf, text: string) =>
  only(detector)
    .detect(text)
    .map((c) => c.value);

describe("CPF", () => {
  it("detects formatted and raw CPFs with valid check digits", () => {
    expect(found(cpf, "CPF 529.982.247-25")).toEqual(["529.982.247-25"]);
    expect(found(cpf, "id=52998224725;")).toEqual(["52998224725"]);
    expect(found(cpf, "529982247-25")).toEqual(["529982247-25"]);
  });

  it("detects 200 generated CPFs", () => {
    for (let i = 0; i < 200; i++) {
      const value = faker.cpf({ formatted: i % 2 === 0 });
      expect(found(cpf, `cliente ${value} ok`)).toEqual([value]);
    }
  });

  it("rejects wrong check digits and repeated digits", () => {
    expect(found(cpf, "529.982.247-24")).toEqual([]);
    expect(found(cpf, "52998224726")).toEqual([]);
    expect(found(cpf, "111.111.111-11")).toEqual([]);
    expect(found(cpf, "00000000000")).toEqual([]);
  });

  it("rejects random 11-digit numbers without a valid check digit", () => {
    let accepted = 0;
    for (let i = 0; i < 500; i++) {
      const n = String(faker.int(10_000_000_000, 99_999_999_999));
      if (!isValidCpf(n)) expect(found(cpf, n)).toEqual([]);
      else accepted++;
    }
    expect(accepted).toBeLessThan(15); // about 1% of random numbers pass by chance
  });

  it("does not match inside longer numbers", () => {
    expect(found(cpf, "1529982247250")).toEqual([]);
    expect(found(cpf, "529.982.247-251")).toEqual([]);
  });

  it("is more confident with the word CPF nearby", () => {
    const [near] = only(cpf).detect("CPF: 52998224725");
    const [far] = only(cpf).detect("52998224725");
    expect(near?.confidence).toBeGreaterThan(far?.confidence ?? 1);
  });
});

describe("CNPJ", () => {
  it("detects formatted and raw CNPJs", () => {
    expect(found(cnpj, "CNPJ 11.222.333/0001-81")).toEqual(["11.222.333/0001-81"]);
    expect(found(cnpj, "11222333000181")).toEqual(["11222333000181"]);
  });

  it("detects 200 generated CNPJs, including alphanumeric ones", () => {
    for (let i = 0; i < 200; i++) {
      const value = faker.cnpj({ formatted: i % 2 === 0, alphanumeric: i % 3 === 0 });
      expect(found(cnpj, `empresa ${value}.`)).toEqual([value]);
    }
  });

  it("validates the alphanumeric CNPJ example from the Receita Federal", () => {
    expect(isValidCnpj("12.ABC.345/01DE-35")).toBe(true);
    expect(isValidCnpj("12.ABC.345/01DE-36")).toBe(false);
  });

  it("rejects wrong check digits and repeated digits", () => {
    expect(found(cnpj, "11.222.333/0001-82")).toEqual([]);
    expect(found(cnpj, "11111111111111")).toEqual([]);
  });

  it("ignores unformatted alphanumeric strings", () => {
    expect(found(cnpj, "12ABC34501DE35")).toEqual([]);
  });
});

describe("Pix key (random)", () => {
  const key = createFaker(7).pixKey();

  it("detects a UUID v4 right after the word Pix", () => {
    expect(found(pixKey, `Chave Pix: ${key}`)).toEqual([key]);
    expect(found(pixKey, `pix aleatória ${key.toUpperCase()}`)).toEqual([key.toUpperCase()]);
  });

  it("ignores UUIDs without the word Pix (request ids, database ids)", () => {
    expect(found(pixKey, `request_id=${key}`)).toEqual([]);
  });
});

describe("CEP", () => {
  it("detects formatted CEPs and raw CEPs after the word CEP", () => {
    expect(found(cep, "Rua X, 01310-100, SP")).toEqual(["01310-100"]);
    expect(found(cep, "CEP: 01310100")).toEqual(["01310100"]);
    expect(found(cep, "cep 01310100")).toEqual(["01310100"]);
  });

  it("ignores raw 8 digits without context and 00000-000", () => {
    expect(found(cep, "pedido 01310100")).toEqual([]);
    expect(found(cep, "00000-000")).toEqual([]);
  });
});

describe("CNH", () => {
  it("detects generated CNHs near the word CNH", () => {
    for (let i = 0; i < 100; i++) {
      const value = faker.cnh();
      expect(found(cnh, `CNH nº ${value}`)).toEqual([value]);
    }
  });

  it("needs context: a raw 11-digit number alone is not a CNH", () => {
    const value = faker.cnh();
    expect(found(cnh, value)).toEqual([]);
  });

  it("wins over CPF when the word CNH is nearby", () => {
    // Find a number that is valid as both CPF and CNH.
    let both = "";
    for (let i = 0; !both; i++) {
      const v = faker.cnh();
      if (isValidCpf(v)) both = v;
    }
    expect(types(`CNH ${both}`)).toEqual(["br.cnh"]);
    expect(types(`CPF ${both}`)).toEqual(["br.cpf"]);
  });
});

describe("Vehicle plate", () => {
  it("detects old and Mercosul plates", () => {
    expect(found(plate, "Placa ABC-1234")).toEqual(["ABC-1234"]);
    expect(found(plate, "carro BRA2E19 prata")).toEqual(["BRA2E19"]);
  });

  it("ignores lowercase, longer words and plates without the dash", () => {
    expect(found(plate, "abc-1234")).toEqual([]);
    expect(found(plate, "ABCD-1234")).toEqual([]);
    expect(found(plate, "ABC1234")).toEqual([]);
  });
});

describe("Phone (BR)", () => {
  it.each([
    "+55 11 98765-4321",
    "+5511987654321",
    "(11) 98765-4321",
    "(11) 3456-7890",
    "11 98765-4321",
    "21 9 8765-4321",
    "55 3456-7890",
  ])("detects %s", (value) => {
    expect(found(phoneBr, `ligue ${value} hoje`)).toEqual([value]);
  });

  it("detects 100 generated phones", () => {
    for (let i = 0; i < 100; i++) {
      const value = faker.phoneBr({ mobile: i % 2 === 0, international: i % 3 === 0 });
      expect(found(phoneBr, `contato: ${value}`)).toEqual([value]);
    }
  });

  it("rejects invalid area codes and invalid first digits", () => {
    expect(found(phoneBr, "(10) 98765-4321")).toEqual([]); // DDD 10 does not exist
    expect(found(phoneBr, "(11) 88765-4321")).toEqual([]); // 11 digits must start with 9
    expect(found(phoneBr, "(11) 7456-7890")).toEqual([]); // landlines start with 2-5
  });

  it("accepts digits-only numbers only near words like tel or WhatsApp", () => {
    expect(found(phoneBr, "11987654321")).toEqual([]);
    expect(found(phoneBr, "WhatsApp 11987654321")).toEqual(["11987654321"]);
  });
});

describe("br detectors together", () => {
  it("masks a realistic message", () => {
    const { text } = shield.mask(
      "Cliente CPF 529.982.247-25, empresa 11.222.333/0001-81, CEP 01310-100, " +
        "tel (11) 98765-4321, placa BRA2E19.",
    );
    expect(text).toBe(
      "Cliente CPF [CPF_1], empresa [CNPJ_1], CEP [CEP_1], tel [PHONE_1], placa [PLATE_1].",
    );
  });

  it("exports every detector with a unique id", () => {
    expect(new Set(br.map((d) => d.id)).size).toBe(br.length);
  });
});
