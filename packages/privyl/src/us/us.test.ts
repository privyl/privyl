import { describe, expect, it } from "vitest";
import { createShield, type Detector } from "../core/index.js";
import { global } from "../global/index.js";
import { createFaker } from "../testing/index.js";
import { isValidItin, isValidSsn, itin, ssn, us } from "./index.js";

const found = (d: Detector, text: string) =>
  createShield({ detectors: [d] })
    .detect(text)
    .map((c) => c.value);
const faker = createFaker(1);

describe("SSN", () => {
  it("knows which numbers are never issued", () => {
    expect(isValidSsn("000-12-3456")).toBe(false);
    expect(isValidSsn("666-12-3456")).toBe(false);
    expect(isValidSsn("912-12-3456")).toBe(false); // 9xx is an ITIN
    expect(isValidSsn("123-00-4567")).toBe(false);
    expect(isValidSsn("123-45-0000")).toBe(false);
    for (let i = 0; i < 100; i++) expect(isValidSsn(faker.ssn())).toBe(true);
  });

  it("detects the dashed form anywhere and 9 digits only near SSN", () => {
    const value = faker.ssn();
    expect(found(ssn, `customer ${value} on file`)).toEqual([value]);
    const digits = value.replace(/-/g, "");
    expect(found(ssn, `SSN: ${digits}`)).toEqual([digits]);
    expect(found(ssn, `order ${digits}`)).toEqual([]);
    expect(found(ssn, "call 555-123-4567")).toEqual([]); // phone shape, not 3-2-4
    expect(found(ssn, `Part number ${value} is back in stock`)).toEqual([]);
    expect(found(ssn, `SKU #${value}`)).toEqual([]);
    expect(found(ssn, `order ${value}, SSN ${value}`)).toEqual([value]); // only the second
  });
});

describe("Phone (US)", () => {
  const phone = us.find((d) => d.id === "us.phone") as Detector;
  it("detects (202) 555-0123 anywhere and 202-555-0123 near call/phone", () => {
    expect(found(phone, "Call me at (202) 555-0123 after 5pm")).toEqual(["(202) 555-0123"]);
    expect(found(phone, "phone 202-555-0123")).toEqual(["202-555-0123"]);
    expect(found(phone, "ref 202-555-0123")).toEqual([]);
    expect(found(phone, "(911) 555-0123")).toEqual([]); // N11 service code
    expect(found(phone, "(202) 155-0123")).toEqual([]); // exchange starts with 1
  });
});

describe("ITIN", () => {
  it("detects ITINs and not SSNs", () => {
    for (let i = 0; i < 50; i++) {
      const value = faker.itin();
      expect(isValidItin(value)).toBe(true);
      expect(found(itin, `ITIN ${value}`)).toEqual([value]);
      expect(found(ssn, `ITIN ${value}`)).toEqual([]);
    }
    expect(isValidItin("912-45-6789")).toBe(false); // group 45 is not used
  });

  it("masks a realistic message", () => {
    const shield = createShield({ detectors: [...global, ...us] });
    const { text } = shield.mask(
      `My SSN is ${faker.ssn()}, my partner's ITIN is ${faker.itin()}, email ann@example.com.`,
    );
    expect(text).toBe("My SSN is [SSN_1], my partner's ITIN is [ITIN_1], email [EMAIL_1].");
  });
});
