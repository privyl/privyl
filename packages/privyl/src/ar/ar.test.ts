import { describe, expect, it } from "vitest";
import { br } from "../br/index.js";
import { createShield, type Detector } from "../core/index.js";
import { global } from "../global/index.js";
import { createFaker } from "../testing/index.js";
import { ar, cuit, dni, isValidCuit } from "./index.js";

const found = (d: Detector, text: string) =>
  createShield({ detectors: [d] })
    .detect(text)
    .map((c) => c.value);
const faker = createFaker(54);

describe("CUIT/CUIL", () => {
  it("validates the check digit", () => {
    expect(isValidCuit("20-12345678-6")).toBe(true);
    expect(isValidCuit("20-12345678-5")).toBe(false);
    expect(isValidCuit("99-12345678-6")).toBe(false); // unknown prefix
    for (let i = 0; i < 100; i++) expect(isValidCuit(faker.cuit())).toBe(true);
  });

  it("detects the formatted form anywhere and the digits-only form near CUIT/CUIL", () => {
    expect(found(cuit, "Factura a 20-12345678-6")).toEqual(["20-12345678-6"]);
    expect(found(cuit, "CUIL 20123456786")).toEqual(["20123456786"]);
    expect(found(cuit, "pedido 20123456786")).toEqual([]);
    expect(found(cuit, "20-12345678-5")).toEqual([]);
  });

  it("wins over a CPF when the word CUIT is nearby", () => {
    const shield = createShield({ detectors: [...global, ...br, ...ar] });
    // Find an 11-digit number that is valid as both CPF and CUIT.
    let both = "";
    while (!both) {
      const v = faker.cuit({ formatted: false });
      if (shield.detect(v).some((c) => c.detector.id === "br.cpf")) both = v;
    }
    expect(shield.detect(`CUIT ${both}`)[0]?.detector.id).toBe("ar.cuit");
    expect(shield.detect(`CPF ${both}`)[0]?.detector.id).toBe("br.cpf");
  });
});

describe("DNI", () => {
  it("detects a DNI only right after the word DNI", () => {
    expect(found(dni, "DNI 12.345.678")).toEqual(["12.345.678"]);
    expect(found(dni, "D.N.I.: 7654321")).toEqual(["7654321"]);
    expect(found(dni, "Pedido 12.345.678")).toEqual([]);
    expect(found(dni, "Documento 12.345.678, nacido en 1990")).toEqual(["12.345.678"]);
    expect(found(dni, "Documento 12345678")).toEqual([]); // only the dotted form after "documento"
    expect(found(dni, "mi DNI 12.345.678.")).toEqual(["12.345.678"]); // end of sentence
  });

  it("ignores repeated digits, a Spanish DNI with a letter and a Chilean RUT", () => {
    expect(found(dni, "DNI 11.111.111")).toEqual([]);
    expect(found(dni, "DNI 12345678Z")).toEqual([]);
    expect(found(dni, "DNI 12.345.678-5")).toEqual([]);
  });

  it("masks a realistic message", () => {
    const shield = createShield({ detectors: [...global, ...ar] });
    const { text } = shield.mask(`Hola, mi DNI es ${faker.dni()} y mi CUIT ${faker.cuit()}.`);
    expect(text).toBe("Hola, mi DNI es [DNI_1] y mi CUIT [CUIT_1].");
  });
});
