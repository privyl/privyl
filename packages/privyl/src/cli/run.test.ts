import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hidePartially, scanText } from "../scan/index.js";
import { run } from "./run.js";

let dir: string;

const write = (path: string, content: string | Buffer) => {
  const full = join(dir, path);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content);
};

const cli = (...argv: string[]) => {
  let out = "";
  let err = "";
  const code = run(argv, {
    out: (t) => (out += t),
    err: (t) => (err += t),
    cwd: dir,
    color: false,
  });
  return { code, out, err };
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "privyl-test-"));
  write("data/customers.csv", "name,cpf,email\nAna Exemplo,529.982.247-25,ana@example.com\n");
  write("logs/app.log", "ok\nuser 203.0.113.7 paid with 4111 1111 1111 1111\n");
  write(".env.example", "DB_PASSWORD=s3cr3tPass99\n");
  write("clean.md", "# Nothing here\n");
  write("node_modules/pkg/index.js", "const cpf = '529.982.247-25';");
  write("image.png", "not scanned by extension");
  write("binary.log", Buffer.from([0x68, 0x00, 0x69, 0x00]));
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("privyl scan", () => {
  it("prints findings with file:line and partly hidden values", () => {
    const { code, out } = cli("scan", ".");
    expect(code).toBe(0);
    expect(out).toContain("data/customers.csv");
    expect(out).toMatch(/2:13\s+CPF\s+529\.\*\*\*\.\*\*\*-25/);
    expect(out).toContain("a***@example.com");
    expect(out).toContain("logs/app.log");
    expect(out).toContain(".env.example");
    expect(out).toMatch(/5 finding\(s\) in 3 of 4 file\(s\) scanned/);
    // Real values never appear in the output.
    expect(out).not.toContain("529.982.247-25");
    expect(out).not.toContain("s3cr3tPass99");
  });

  it("skips node_modules, binary files and unknown extensions", () => {
    const { out } = cli("scan", ".", "--json");
    const files = new Set(JSON.parse(out).findings.map((f: { file: string }) => f.file));
    expect([...files].sort()).toEqual([".env.example", "data/customers.csv", "logs/app.log"]);
  });

  it("outputs JSON for CI", () => {
    const { out } = cli("scan", "--json");
    const report = JSON.parse(out);
    expect(report.scanned).toBe(4);
    expect(report.summary.total).toBe(5);
    expect(report.findings[0]).toMatchObject({ file: ".env.example", line: 1, token: "SECRET" });
    expect(out).not.toContain("529.982.247-25");
  });

  it("scans a single file", () => {
    const { out } = cli("scan", "data/customers.csv", "--json");
    expect(JSON.parse(out).summary.total).toBe(2);
  });

  it("reports a clean folder", () => {
    rmSync(join(dir, "data"), { recursive: true });
    rmSync(join(dir, "logs"), { recursive: true });
    rmSync(join(dir, ".env.example"));
    expect(cli("scan").out).toContain("No personal data found in 1 file(s)");
  });

  it("--fix writes masked copies and never touches the originals", () => {
    const { out } = cli("scan", ".", "--fix");
    expect(out).toContain("Wrote 3 masked file(s)");
    expect(readFileSync(join(dir, "privyl-masked/data/customers.csv"), "utf8")).toBe(
      "name,cpf,email\nAna Exemplo,[CPF_1],[EMAIL_1]\n",
    );
    expect(readFileSync(join(dir, "data/customers.csv"), "utf8")).toContain("529.982.247-25");
    expect(existsSync(join(dir, "privyl-masked/clean.md"))).toBe(false);
    // Running again does not scan its own output folder.
    expect(cli("scan", ".", "--json").out).not.toContain("privyl-masked");
  });

  it("--fix --out uses another folder", () => {
    cli("scan", ".", "--fix", "--out", "safe");
    expect(existsSync(join(dir, "safe/logs/app.log"))).toBe(true);
  });

  it("--fix --in-place overwrites the originals only when asked", () => {
    cli("scan", ".", "--fix", "--in-place");
    expect(readFileSync(join(dir, ".env.example"), "utf8")).toBe("DB_PASSWORD=[SECRET_1]\n");
  });

  it("rejects bad usage", () => {
    expect(cli("scan", "--in-place").code).toBe(2);
    expect(cli("scan", "--nope").code).toBe(2);
    expect(cli("scan", "missing-folder").err).toContain("Path not found");
    expect(cli("deploy").code).toBe(2);
    expect(cli("--help").out).toContain("Usage: privyl scan");
  });
});

describe("scanText", () => {
  it("reports line and column", () => {
    const [f] = scanText("a\nb ana@example.com", { file: "x.txt" });
    expect(f).toMatchObject({ file: "x.txt", line: 2, column: 3, type: "global.email" });
  });
});

describe("hidePartially", () => {
  it.each([
    ["529.982.247-25", "CPF", "529.***.***-25"],
    ["ana@example.com", "EMAIL", "a***@example.com"],
    ["4111 1111 1111 1111", "CARD", "411* **** **** **11"],
    ["s3cr3tPass99", "SECRET", "s3cr********"],
    ["01310-100", "CEP", "013**-*00"],
    ["ABC1D23", "PLATE", "A******"],
  ])("%s → %s", (value, token, expected) => {
    expect(hidePartially(value, token)).toBe(expected);
  });
});
