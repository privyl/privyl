import { describe, expect, it } from "vitest";
import { createShield, type Detector } from "../core/index.js";
import { global } from "../global/index.js";
import { createFaker } from "../testing/index.js";
import { curp, isValidCurp, isValidRfc, mx, rfc } from "./index.js";

const found = (d: Detector, text: string) =>
  createShield({ detectors: [d] })
    .detect(text)
    .map((c) => c.value);
const faker = createFaker(52);
const breakLast = (v: string) => v.slice(0, -1) + (v.at(-1) === "1" ? "2" : "1");

describe("CURP", () => {
  it("detects generated CURPs", () => {
    for (let i = 0; i < 100; i++) {
      const value = faker.curp();
      expect(isValidCurp(value)).toBe(true);
      expect(found(curp, `Mi CURP es ${value}.`)).toEqual([value]);
    }
  });

  it("accepts lowercase, as people often type it", () => {
    const value = faker.curp().toLowerCase();
    expect(found(curp, `curp: ${value}`)).toEqual([value]);
  });

  it("rejects a wrong check digit, an impossible date or an unknown state", () => {
    const value = faker.curp();
    expect(found(curp, breakLast(value))).toEqual([]);
    expect(found(curp, value.slice(0, 6) + "13" + value.slice(8))).toEqual([]); // month 13
    expect(found(curp, value.slice(0, 11) + "QQ" + value.slice(13))).toEqual([]);
  });
});

describe("RFC", () => {
  it("detects people (13) and companies (12)", () => {
    for (let i = 0; i < 100; i++) {
      const person = faker.rfc();
      const company = faker.rfc({ company: true });
      expect(isValidRfc(person)).toBe(true);
      expect(found(rfc, `RFC ${person} y ${company}`)).toEqual([person, company]);
    }
  });

  it("ignores the generic RFCs and wrong check characters", () => {
    expect(found(rfc, "XAXX010101000")).toEqual([]);
    expect(found(rfc, "XEXX010101000")).toEqual([]);
    expect(found(rfc, breakLast(faker.rfc()))).toEqual([]);
  });

  it("does not find an RFC inside a CURP", () => {
    const shield = createShield({ detectors: [...global, ...mx] });
    const value = faker.curp();
    expect(shield.detect(value).map((c) => c.detector.id)).toEqual(["mx.curp"]);
  });
});
