// Safety net for /examples: every value must be clearly fake.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanText, summarize } from "./scan/index.js";
import { TEST_CARDS } from "./testing/index.js";

const examplesDir = join(import.meta.dirname, "../../../examples");
const projects = ["online-store", "support-chatbot", "clinic"];

const filesOf = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesOf(join(dir, e.name)) : [join(dir, e.name)],
  );

const allText = projects
  .flatMap((p) => filesOf(join(examplesDir, p)))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

describe("examples", () => {
  it("only uses @example.com emails", () => {
    const emails = allText.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? [];
    expect(emails.length).toBeGreaterThan(0);
    for (const e of emails) expect(e).toMatch(/@(?:[\w-]+\.)*example\.com$/);
  });

  it("only uses public test cards", () => {
    const cards = scanText(allText).filter((f) => f.token === "CARD");
    expect(cards.length).toBeGreaterThan(0);
    const raw = allText.match(/\d{4} \d{4,6} \d{4,5}(?: \d{4})?/g) ?? [];
    for (const c of raw) expect(TEST_CARDS).toContain(c);
  });

  it("only uses IPs reserved for documentation", () => {
    const ips = allText.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) ?? [];
    for (const ip of ips) expect(ip).toMatch(/^(?:192\.0\.2|198\.51\.100|203\.0\.113)\./);
  });

  it.each(projects)("%s has personal data for the demo", (project) => {
    const text = filesOf(join(examplesDir, project))
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    expect(summarize(scanText(text)).total).toBeGreaterThan(30);
  });
});
