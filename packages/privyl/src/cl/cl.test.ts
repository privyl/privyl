import { describe, expect, it } from "vitest";
import { createShield, type Detector } from "../core/index.js";
import { global } from "../global/index.js";
import { createFaker } from "../testing/index.js";
import { cl, isValidRut, rut, rutCheckDigit } from "./index.js";

const found = (d: Detector, text: string) =>
  createShield({ detectors: [d] })
    .detect(text)
    .map((c) => c.value);
const faker = createFaker(56);

describe("RUT/RUN", () => {
  it("validates the check digit, including K", () => {
    expect(isValidRut("12.345.678-5")).toBe(true);
    expect(isValidRut("12.345.678-4")).toBe(false);
    let withK = "";
    for (let n = 10_000_000; !withK; n++) if (rutCheckDigit(String(n)) === "K") withK = String(n);
    expect(isValidRut(`${withK}-K`)).toBe(true);
    expect(isValidRut(`${withK}-k`)).toBe(true);
    for (let i = 0; i < 100; i++) expect(isValidRut(faker.rut())).toBe(true);
  });

  it("detects the dotted form anywhere and the plain form near RUT/RUN", () => {
    expect(found(rut, "Cliente 12.345.678-5")).toEqual(["12.345.678-5"]);
    expect(found(rut, "RUT: 12345678-5")).toEqual(["12345678-5"]);
    expect(found(rut, "Lote 12345678-5")).toEqual([]);
    expect(found(rut, "RUT 11.111.111-1")).toEqual([]);
  });

  it("masks a realistic message", () => {
    const shield = createShield({ detectors: [...global, ...cl] });
    const { text } = shield.mask(`Mi RUT es ${faker.rut()}, correo ana@example.com`);
    expect(text).toBe("Mi RUT es [RUT_1], correo [EMAIL_1]");
  });
});
