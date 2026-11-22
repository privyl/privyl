// Shared helpers for the AI SDK adapters (privyl/anthropic, privyl/openai).
// No SDK is imported: the adapters work with the client object you already have.

import { createShield, type Shield } from "../core/shield.js";
import type { Finding } from "../core/types.js";
import { Vault } from "../core/vault.js";
import { allDetectors } from "../scan/index.js";

export interface ProtectOptions {
  /** The shield to use. Default: every built-in detector (global and all countries). */
  shield?: Shield;
  /** Called on every request with what was masked (never the real values). */
  onFindings?: (findings: Finding[]) => void;
}

let defaultShield: Shield | undefined;

/** Masks strings for one request. All parts share one vault, so values keep one placeholder. */
export class RequestMasker {
  readonly vault = new Vault();
  readonly findings: Finding[] = [];
  readonly shield: Shield;

  constructor(options: ProtectOptions) {
    this.shield = options.shield ?? (defaultShield ??= createShield({ detectors: allDetectors }));
  }

  text = (value: string): string => {
    const result = this.shield.mask(value, { vault: this.vault });
    this.findings.push(...result.findings);
    return result.text;
  };

  /** Masks every string inside a JSON-like value (tool inputs, function arguments). */
  deep = (value: unknown): unknown => mapStrings(value, this.text);

  restore = (value: string): string => this.shield.unmask(value, this.vault);
  restoreDeep = (value: unknown): unknown => mapStrings(value, this.restore);
}

function mapStrings(value: unknown, fn: (s: string) => string): unknown {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = mapStrings(v, fn);
    return out;
  }
  return value;
}

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

/** Streaming would send text before it can be restored safely, so it is refused for now. */
export function refuseStreaming(params: unknown): void {
  if (isObject(params) && params.stream === true) {
    throw new Error(
      "privyl: streaming is not supported yet. Call without `stream: true`, or mask the text yourself with shield.mask().",
    );
  }
}

type AnyFunction = (...args: never[]) => unknown;

/**
 * Returns `client` with the method at `path` (for example ["messages", "create"]) replaced.
 * Everything else on the client keeps working as before. The original object is not changed.
 */
export function overrideMethod<T extends object>(
  client: T,
  path: readonly [string, string],
  replace: (original: (...args: unknown[]) => Promise<unknown>) => AnyFunction,
): T {
  const [group, method] = path;
  const target = (client as Record<string, unknown>)[group];
  if (!isObject(target) || typeof target[method] !== "function") {
    throw new Error(`privyl: this client has no ${group}.${method}() method`);
  }
  const original = (...args: unknown[]) =>
    (target[method] as (...a: unknown[]) => Promise<unknown>).apply(target, args);
  const replaced = replace(original);
  const wrappedGroup = new Proxy(target, {
    get: (obj, prop, receiver) => (prop === method ? replaced : Reflect.get(obj, prop, receiver)),
  });
  return new Proxy(client, {
    get: (obj, prop, receiver) =>
      prop === group ? wrappedGroup : Reflect.get(obj, prop, receiver),
  });
}
