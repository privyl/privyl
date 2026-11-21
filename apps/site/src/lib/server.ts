// Server-only helpers. They run at build time (or on the server), never in the browser.
// `server-only` makes the build fail if a browser component ever imports this file.
import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

export interface ExampleFile {
  path: string;
  content: string;
}

export interface ExampleProject {
  id: string;
  files: ExampleFile[];
}

const EXAMPLES_DIR = join(process.cwd(), "../../examples");
// Fixed list: only these fictional folders are ever read. Nothing comes from the request.
export const EXAMPLE_IDS = ["online-store", "support-chatbot", "clinic"] as const;

/** Reads the fictional example projects from /examples (README files are left out). */
export function loadExamples(): ExampleProject[] {
  return EXAMPLE_IDS.map((id) => {
    const root = join(EXAMPLES_DIR, id);
    const files: ExampleFile[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && entry.name !== "README.md") {
          files.push({
            path: relative(root, full).split("\\").join("/"),
            content: readFileSync(full, "utf8"),
          });
        }
      }
    };
    walk(root);
    files.sort((a, b) => a.path.localeCompare(b.path));
    return { id, files };
  });
}

/**
 * GitHub star count, refreshed at most once an hour. Public API, no token, no user data sent.
 * Returns undefined if GitHub is slow or unreachable, so the page never breaks.
 */
export async function getStars(): Promise<number | undefined> {
  try {
    const res = await fetch("https://api.github.com/repos/privyl/privyl", {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { stargazers_count?: unknown };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : undefined;
  } catch {
    return undefined;
  }
}
