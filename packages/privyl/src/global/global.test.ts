import { describe, expect, it } from "vitest";
import { createShield, type Detector } from "../core/index.js";
import { createFaker, TEST_CARDS } from "../testing/index.js";
import {
  card,
  email,
  global,
  ipv4,
  ipv6,
  isValidLuhn,
  phone,
  secretAssignment,
  secrets,
} from "./index.js";

const found = (detectors: Detector | readonly Detector[], text: string) =>
  createShield({ detectors: Array.isArray(detectors) ? detectors : [detectors as Detector] })
    .detect(text)
    .map((c) => c.value);

// Fake secrets are built at runtime from repeated characters, so the source file itself
// never contains anything that looks like a real key.
const fake = (prefix: string, length: number, char = "A") => prefix + char.repeat(length);

describe("email", () => {
  it("detects addresses with accents", () => {
    expect(found(email, "contato: joão.silva@example.com")).toEqual(["joão.silva@example.com"]);
    expect(found(email, "inês@exemplo.pt, ok")).toEqual(["inês@exemplo.pt"]);
  });

  it.each(["ana@example.com", "ana.souza+news@mail.example.com", "a_b-c@example.co.uk"])(
    "detects %s",
    (value) => expect(found(email, `write to ${value}.`)).toEqual([value]),
  );

  it("detects generated emails", () => {
    const faker = createFaker(3);
    for (let i = 0; i < 50; i++) {
      const value = faker.email();
      expect(found(email, `<${value}>`)).toEqual([value]);
    }
  });

  it.each(["@example.com", "ana@", "ana@localhost", "ana..b@example.com", "user@@example.com"])(
    "ignores %s",
    (value) => expect(found(email, value)).toEqual([]),
  );
});

describe("international phone", () => {
  it.each(["+1 415 555 0132", "+44 20 7946 0958", "+351 912 345 678", "+1 (415) 555-0132"])(
    "detects %s",
    (value) => expect(found(phone, `call ${value} now`)).toEqual([value]),
  );

  it("needs a leading + and 8 to 15 digits", () => {
    expect(found(phone, "415 555 0132")).toEqual([]);
    expect(found(phone, "+1 23")).toEqual([]);
  });
});

describe("payment card", () => {
  it("detects public test cards", () => {
    for (const value of TEST_CARDS) expect(found(card, `card ${value} ok`)).toEqual([value]);
    expect(found(card, "4111111111111111")).toEqual(["4111111111111111"]);
    expect(found(card, "4111-1111-1111-1111")).toEqual(["4111-1111-1111-1111"]);
  });

  it("rejects wrong Luhn, repeated digits and unknown prefixes", () => {
    expect(found(card, "4111 1111 1111 1112")).toEqual([]);
    expect(found(card, "4444 4444 4444 4444")).toEqual([]);
    expect(found(card, "9111 1111 1111 1111")).toEqual([]);
    expect(found(card, "4111 1111-1111 1111")).toEqual([]); // mixed separators
  });

  it("rejects most random 16-digit numbers", () => {
    const faker = createFaker(9);
    let accepted = 0;
    for (let i = 0; i < 1000; i++) {
      const n = `4${Array.from({ length: 15 }, () => faker.int(0, 9)).join("")}`;
      if (found(card, n).length) {
        expect(isValidLuhn(n)).toBe(true);
        accepted++;
      }
    }
    expect(accepted).toBeLessThan(130); // about 10% pass Luhn by chance
  });
});

describe("IP address", () => {
  it("detects IPv4", () => {
    expect(found(ipv4, "client 203.0.113.42 connected")).toEqual(["203.0.113.42"]);
    expect(found(ipv4, "from=192.0.2.1:8080")).toEqual(["192.0.2.1"]);
  });

  it("ignores invalid IPv4, loopback and longer dotted numbers", () => {
    expect(found(ipv4, "256.1.1.1")).toEqual([]);
    expect(found(ipv4, "01.2.3.4")).toEqual([]);
    expect(found(ipv4, "127.0.0.1")).toEqual([]);
    expect(found(ipv4, "0.0.0.0")).toEqual([]);
    expect(found(ipv4, "1.2.3.4.5")).toEqual([]);
  });

  it("ignores version numbers that look like IPv4", () => {
    expect(found(ipv4, "app version 1.2.3.4 started")).toEqual([]);
    expect(found(ipv4, "Firmware 10.0.0.19 instalado")).toEqual([]);
    expect(found(ipv4, "v2.0.1.0")).toEqual([]);
    expect(found(ipv4, "server 10.0.0.19 is up")).toEqual(["10.0.0.19"]);
  });

  it("detects IPv6", () => {
    expect(found(ipv6, "ip 2001:db8:85a3:0:0:8a2e:370:7334 ok")).toEqual([
      "2001:db8:85a3:0:0:8a2e:370:7334",
    ]);
    expect(found(ipv6, "ip 2001:db8::1 ok")).toEqual(["2001:db8::1"]);
  });

  it("ignores times, MAC addresses, code and loopback", () => {
    expect(found(ipv6, "at 10:30:00")).toEqual([]);
    expect(found(ipv6, "mac aa:bb:cc:dd:ee:ff")).toEqual([]);
    expect(found(ipv6, "std::vector")).toEqual([]);
    expect(found(ipv6, "::1")).toEqual([]);
  });
});

describe("secrets", () => {
  it.each([
    ["AWS", fake("AKIA", 16)],
    ["GitHub", fake("gh" + "p_", 36, "a")],
    ["GitHub fine-grained", fake("github" + "_pat_", 40, "b")],
    ["Anthropic", fake("sk-" + "ant-api03-", 40, "c")],
    ["OpenAI", fake("sk-" + "proj-", 40, "d")],
    ["Stripe", fake("sk" + "_live_", 24, "e")],
    ["Slack", fake("xo" + "xb-", 30, "1")],
    ["Google", fake("AI" + "za", 35, "f")],
    ["JWT", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abcdefghijklmnop"],
  ])("detects a %s key", (_name, value) => {
    expect(found(secrets, `key: ${value}`)).toEqual([value]);
  });

  it("detects a private key block", () => {
    const block = [
      "-----BEGIN RSA PRIVATE KEY-----",
      "AAAA",
      "BBBB",
      "-----END RSA PRIVATE KEY-----",
    ];
    expect(found(secrets, block.join("\n"))).toEqual([block.join("\n")]);
  });

  it("ignores short or unrelated strings", () => {
    expect(found(secrets, "sk-short ghp_short AKIA123")).toEqual([]);
  });
});

describe("secret assignment", () => {
  it.each([
    ["DB_PASSWORD=s3cr3tPass99", "s3cr3tPass99"],
    ['"api_key": "abcd1234efgh5678"', "abcd1234efgh5678"],
    ["const apiKey = 'zz9-plural-z-alpha'", "zz9-plural-z-alpha"],
    ["SECRET_TOKEN: hunter2hunter2", "hunter2hunter2"],
  ])("detects the value in %s", (text, value) => {
    expect(found(secretAssignment, text)).toEqual([value]);
  });

  it.each([
    "API_KEY=${API_KEY}",
    "token = process.env.API_TOKEN",
    "apiKey: config.apiKey",
    "password: <your-password>",
    "password=short",
    "password=********",
    "token = getToken()",
  ])("ignores %s", (text) => {
    expect(found(secretAssignment, text)).toEqual([]);
  });
});

describe("global detectors together", () => {
  it("masks a realistic log line", () => {
    const shield = createShield({ detectors: global });
    const { text } = shield.mask(
      `user=ana@example.com ip=203.0.113.9 card=4111 1111 1111 1111 key=${fake("AKIA", 16)}`,
    );
    expect(text).toBe("user=[EMAIL_1] ip=[IP_1] card=[CARD_1] key=[SECRET_1]");
  });

  it("exports every detector with a unique id", () => {
    expect(new Set(global.map((d) => d.id)).size).toBe(global.length);
  });
});
