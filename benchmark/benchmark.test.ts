// Runs the benchmark as part of the normal test suite.
//
// The dataset and the results are saved next to this file (dataset.jsonl, results.json).
// `pnpm test` fails if they are out of date, so the numbers on the website are always the real
// output of the current code. To update them after changing a detector, run `pnpm bench`.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildDataset } from "./dataset.js";
import { evaluate } from "./evaluate.js";

const version = (
  JSON.parse(readFileSync(new URL("../packages/privyl/package.json", import.meta.url), "utf8")) as {
    version: string;
  }
).version;

const dataset = buildDataset();

describe("benchmark dataset", () => {
  it("labels point at real text", () => {
    for (const record of dataset) {
      for (const e of record.entities) {
        const value = record.text.slice(e.start, e.end);
        expect(value.length, record.id).toBeGreaterThan(0);
        expect(value.trim(), record.id).toBe(value);
      }
    }
  });

  it("only uses fictional data", () => {
    for (const record of dataset) {
      for (const e of record.entities) {
        const value = record.text.slice(e.start, e.end);
        if (e.type === "EMAIL") expect(value).toMatch(/@example\.com$/);
        if (e.type === "IP")
          expect(value).toMatch(/^(192\.0\.2|198\.51\.100|203\.0\.113)\.|^2001:db8:/);
      }
    }
  });

  it("is saved in dataset.jsonl", async () => {
    const jsonl = dataset.map((r) => JSON.stringify(r)).join("\n") + "\n";
    await expect(jsonl).toMatchFileSnapshot("./dataset.jsonl");
  });
});

describe("benchmark results", () => {
  it("are saved in results.json", async () => {
    const results = evaluate(dataset, version);
    await expect(JSON.stringify(results, null, 2) + "\n").toMatchFileSnapshot("./results.json");
  });
});
