// The `privyl` command line. Node only (uses the file system).

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { createShield } from "../core/shield.js";
import { Vault } from "../core/vault.js";
import { allDetectors, scanText, summarize, type ScanFinding } from "../scan/index.js";

const TEXT_EXTENSIONS = new Set([".log", ".json", ".jsonl", ".csv", ".ts", ".js", ".md", ".env"]);
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage"]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const DEFAULT_OUT = "privyl-masked";

const HELP = `Usage: privyl scan [path] [options]

Finds personal data (CPF, emails, cards, API keys...) in text files.

Options:
  --json        Print results as JSON (for CI)
  --fix         Write masked copies of files with findings to --out
  --out <dir>   Output folder for --fix (default: ${DEFAULT_OUT})
  --in-place    With --fix, overwrite the original files instead (careful!)
  --fail-on-findings
                Exit with code 1 if anything is found (to block a CI build)
  -h, --help    Show this help

Scanned files: ${[...TEXT_EXTENSIONS].join(" ")} and .env.*
Skipped: ${[...SKIP_DIRS].join(", ")}, binary files and files over 10 MB.`;

export interface Io {
  out: (text: string) => void;
  err: (text: string) => void;
  cwd: string;
  color: boolean;
}

interface Options {
  path: string;
  json: boolean;
  fix: boolean;
  out: string;
  inPlace: boolean;
  failOnFindings: boolean;
}

/** Runs the CLI and returns the exit code. */
export function run(argv: readonly string[], io: Io): number {
  const [command, ...rest] = argv;
  if (!command || command === "-h" || command === "--help") {
    io.out(HELP);
    return 0;
  }
  if (command !== "scan") {
    io.err(`Unknown command: ${command}\n\n${HELP}`);
    return 2;
  }

  let options: Options;
  try {
    options = parseOptions(rest);
  } catch (error) {
    io.err(`${(error as Error).message}\n\n${HELP}`);
    return 2;
  }
  if (rest.includes("-h") || rest.includes("--help")) {
    io.out(HELP);
    return 0;
  }

  const root = resolve(io.cwd, options.path);
  if (!existsSync(root)) {
    io.err(`Path not found: ${options.path}`);
    return 2;
  }

  const outDir = resolve(io.cwd, options.out);
  const files = statSync(root).isDirectory() ? listFiles(root, outDir) : [root];
  const base = statSync(root).isDirectory() ? root : dirname(root);

  const shield = createShield({ detectors: allDetectors });
  const vault = new Vault(); // shared, so the same value gets the same placeholder everywhere
  const findings: ScanFinding[] = [];
  const written: string[] = [];
  let scanned = 0;

  for (const file of files) {
    const text = readText(file);
    if (text === undefined) continue;
    scanned++;
    const rel = toPosix(relative(base, file)) || basename(file);
    const found = scanText(text, { file: rel, shield });
    findings.push(...found);

    if (options.fix && found.length > 0) {
      const target = options.inPlace ? file : join(outDir, rel);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, shield.mask(text, { vault }).text);
      written.push(toPosix(relative(io.cwd, target)));
    }
  }

  const summary = summarize(findings);
  if (options.json) {
    io.out(JSON.stringify({ scanned, summary, findings, written }, null, 2));
  } else {
    io.out(formatReport(findings, summary, scanned, written, io.color));
  }
  return options.failOnFindings && findings.length > 0 ? 1 : 0;
}

function parseOptions(args: string[]): Options {
  const options: Options = {
    path: ".",
    json: false,
    fix: false,
    out: DEFAULT_OUT,
    inPlace: false,
    failOnFindings: false,
  };
  let pathSet = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (arg === "--json") options.json = true;
    else if (arg === "--fix") options.fix = true;
    else if (arg === "--in-place") options.inPlace = true;
    else if (arg === "--fail-on-findings") options.failOnFindings = true;
    else if (arg === "--out") {
      const value = args[++i];
      if (!value) throw new Error("--out needs a folder name");
      options.out = value;
    } else if (arg === "-h" || arg === "--help") continue;
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else if (!pathSet) {
      options.path = arg;
      pathSet = true;
    } else throw new Error(`Unexpected argument: ${arg}`);
  }
  if (options.inPlace && !options.fix) throw new Error("--in-place only works with --fix");
  return options;
}

function listFiles(dir: string, outDir: string): string[] {
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && full !== outDir) walk(full);
      } else if (entry.isFile() && isTextFileName(entry.name)) {
        files.push(full);
      }
    }
  };
  walk(dir);
  return files.sort();
}

const isTextFileName = (name: string) =>
  TEXT_EXTENSIONS.has(extname(name).toLowerCase()) || name === ".env" || name.startsWith(".env.");

/** Reads a file as UTF-8, or returns undefined for binary or very large files. */
function readText(file: string): string | undefined {
  if (statSync(file).size > MAX_FILE_BYTES) return undefined;
  const bytes = readFileSync(file);
  if (bytes.subarray(0, 8000).includes(0)) return undefined; // a NUL byte means binary
  return bytes.toString("utf8");
}

const toPosix = (p: string) => p.split("\\").join("/");

function formatReport(
  findings: ScanFinding[],
  summary: ReturnType<typeof summarize>,
  scanned: number,
  written: string[],
  color: boolean,
): string {
  const paint = (code: string) => (s: string) => (color ? `\u001b[${code}m${s}\u001b[0m` : s);
  const bold = paint("1");
  const dim = paint("2");
  const yellow = paint("33");
  const green = paint("32");
  const cyan = paint("36");

  const lines: string[] = [""];
  if (findings.length === 0) {
    lines.push(green(`  ✓ No personal data found in ${scanned} file(s).`), "");
    return lines.join("\n");
  }

  const labelWidth = Math.max(...findings.map((f) => f.label.length));
  let currentFile: string | undefined;
  for (const f of findings) {
    if (f.file !== currentFile) {
      currentFile = f.file;
      lines.push(`  ${bold(cyan(f.file ?? ""))}`);
    }
    const where = dim(`${f.line}:${f.column}`.padEnd(8));
    lines.push(`    ${where} ${yellow(f.label.padEnd(labelWidth))}  ${f.preview}`);
  }

  lines.push("", `  ${bold("Summary")}`);
  for (const row of summary.byLabel) {
    lines.push(`    ${row.label.padEnd(labelWidth)}  ${bold(String(row.count).padStart(5))}`);
  }
  lines.push(
    "",
    `  ${bold(yellow(String(summary.total)))} finding(s) in ${summary.files} of ${scanned} file(s) scanned.`,
  );
  if (written.length > 0) {
    lines.push(green(`  ✓ Wrote ${written.length} masked file(s):`));
    for (const w of written) lines.push(`    ${w}`);
  } else {
    lines.push(dim("  Run with --fix to write masked copies."));
  }
  lines.push("");
  return lines.join("\n");
}
