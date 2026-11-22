// The Privyl proxy: a small HTTP server between your app and the AI API. Node only.
//
//   your app ──► privyl proxy (masks) ──► api.anthropic.com / api.openai.com
//   your app ◄── privyl proxy (restores) ◄──┘
//
// Point the SDK at it with ANTHROPIC_BASE_URL=http://127.0.0.1:8787/anthropic or
// OPENAI_BASE_URL=http://127.0.0.1:8787/openai/v1. Nothing is written to disk: each request gets
// its own vault in memory, which is thrown away when the response is sent.
//
// It fails closed: a request with a body to an endpoint Privyl cannot protect is refused instead
// of being forwarded unmasked.

import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { RequestMasker, isObject } from "../adapters/shared.js";
import { maskAnthropicRequest, restoreAnthropicResponse } from "../anthropic/shape.js";
import type { Shield } from "../core/shield.js";
import type { Finding } from "../core/types.js";
import {
  maskChatParams,
  maskResponsesParams,
  restoreChatResponse,
  restoreResponsesResponse,
} from "../openai/shape.js";

export interface ProxyOptions {
  /** Default: 8787. Use 0 for any free port. */
  port?: number;
  /** Default: 127.0.0.1 (only this machine). Use 0.0.0.0 inside Docker. */
  host?: string;
  /** Default: https://api.anthropic.com */
  anthropicUrl?: string;
  /** Default: https://api.openai.com (any OpenAI-compatible API works). */
  openaiUrl?: string;
  /** Default: every built-in detector. */
  shield?: Shield;
  /** Called with one line per request (method, path, status, what was masked). No values. */
  log?: (line: string) => void;
  /** Largest request body accepted. Default: 10 MB. */
  maxBodyBytes?: number;
}

type Transform = (body: unknown, m: RequestMasker) => unknown;
interface Route {
  mask: Transform;
  restore: Transform;
}

/** Endpoints that are protected. A request with a body to any other path is refused. */
const ROUTES: Record<string, Record<string, Route>> = {
  anthropic: {
    "/v1/messages": { mask: maskAnthropicRequest, restore: restoreAnthropicResponse },
    "/v1/messages/count_tokens": { mask: maskAnthropicRequest, restore: (r) => r },
  },
  openai: {
    "/v1/chat/completions": { mask: maskChatParams, restore: restoreChatResponse },
    "/v1/responses": { mask: maskResponsesParams, restore: restoreResponsesResponse },
  },
};

// Headers that belong to one connection and must not be forwarded.
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  // fetch decompresses the answer, so these would describe the wrong bytes.
  "accept-encoding",
  "content-encoding",
]);

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Starts the proxy. Resolves when it is listening, with its address. */
export async function startProxy(
  options: ProxyOptions = {},
): Promise<{ server: Server; url: string }> {
  const server = createProxyServer(options);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 8787, options.host ?? "127.0.0.1", resolve);
  });
  const { address, port } = server.address() as AddressInfo;
  const host = address.includes(":") ? `[${address}]` : address;
  return { server, url: `http://${host}:${port}` };
}

/** Creates the proxy server without starting it. */
export function createProxyServer(options: ProxyOptions = {}): Server {
  const upstreams: Record<string, string> = {
    anthropic: trimSlash(options.anthropicUrl ?? "https://api.anthropic.com"),
    openai: trimSlash(options.openaiUrl ?? "https://api.openai.com"),
  };
  const maxBody = options.maxBodyBytes ?? 10 * 1024 * 1024;

  return createServer((req, res) => {
    const started = Date.now();
    let findings: Finding[] = [];
    handle(req, res, (f) => (findings = f))
      .catch((error: unknown) => {
        const status = error instanceof HttpError ? error.status : 502;
        const message =
          error instanceof HttpError ? error.message : "Could not reach the AI provider.";
        sendJson(res, status, { error: { type: "privyl_proxy_error", message } });
      })
      .finally(() => {
        const masked = findings.length ? ` · masked ${summarizeFindings(findings)}` : "";
        options.log?.(
          `${req.method} ${pathOnly(req.url)} → ${res.statusCode}${masked} · ${Date.now() - started}ms`,
        );
      });
  });

  async function handle(
    req: IncomingMessage,
    res: ServerResponse,
    report: (findings: Finding[]) => void,
  ): Promise<void> {
    const url = new URL(req.url ?? "/", "http://proxy");
    if (url.pathname === "/health") return sendJson(res, 200, { ok: true });

    const [, provider = "", ...parts] = url.pathname.split("/");
    const base = upstreams[provider];
    if (!base) {
      throw new HttpError(
        404,
        "Unknown path. Use /anthropic/... or /openai/... (see privyl proxy --help).",
      );
    }
    const path = `/${parts.join("/")}`;
    const route = ROUTES[provider]?.[path];
    const target = `${base}${path}${url.search}`;
    const headers = forwardHeaders(req);
    const method = req.method ?? "GET";

    // Requests without a body (listing models, reading a batch...) carry no text to mask.
    if (method === "GET" || method === "HEAD" || method === "DELETE") {
      return relay(res, await fetch(target, { method, headers }));
    }
    if (!route) {
      throw new HttpError(
        403,
        `Privyl does not protect ${method} ${path} yet, so the request was not sent. Protected: ${Object.keys(ROUTES[provider] ?? {}).join(", ")}.`,
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(await readBody(req, maxBody));
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(400, "The request body is not valid JSON.");
    }
    if (isObject(body) && body.stream === true) {
      throw new HttpError(
        400,
        "Streaming is not supported by the Privyl proxy yet. Send the request without `stream: true`.",
      );
    }

    const m = new RequestMasker(options.shield ? { shield: options.shield } : {});
    const masked = route.mask(body, m);
    report(m.findings);
    headers.set("content-type", "application/json");
    const upstream = await fetch(target, { method, headers, body: JSON.stringify(masked) });

    const text = await upstream.text();
    let out: string;
    try {
      out = JSON.stringify(route.restore(JSON.parse(text), m));
    } catch {
      // Not JSON (rare, for example an HTML error page): placeholders are restored as plain text.
      out = m.restore(text);
    }
    sendText(res, upstream.status, upstream.headers, out);
  }
}

function forwardHeaders(req: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined || HOP_BY_HOP.has(name)) continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  return headers;
}

async function relay(res: ServerResponse, upstream: Response): Promise<void> {
  // Bytes, not text: a GET can download a file.
  sendText(res, upstream.status, upstream.headers, Buffer.from(await upstream.arrayBuffer()));
}

function sendText(res: ServerResponse, status: number, from: Headers, body: string | Buffer): void {
  from.forEach((value, name) => {
    if (!HOP_BY_HOP.has(name)) res.setHeader(name, value);
  });
  res.setHeader("content-length", Buffer.byteLength(body));
  res.statusCode = status;
  res.end(body);
}

function sendJson(res: ServerResponse, status: number, value: unknown): void {
  if (res.headersSent) return void res.end();
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req: IncomingMessage, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      // Too big: stop keeping it, but let it arrive so the 413 answer can still be sent.
      if (size <= max) chunks.push(chunk);
    });
    req.on("end", () => {
      if (size > max) reject(new HttpError(413, `The request body is larger than ${max} bytes.`));
      else resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

/** "CPF×2, Email×1": types and counts only, never values. */
function summarizeFindings(findings: Finding[]): string {
  const counts = new Map<string, number>();
  for (const f of findings) counts.set(f.label, (counts.get(f.label) ?? 0) + 1);
  return [...counts].map(([label, n]) => `${label}×${n}`).join(", ");
}

const trimSlash = (url: string) => url.replace(/\/+$/, "");
// Query strings can hold ids or keys, so the log shows only the path.
const pathOnly = (url = "/") => url.split("?")[0];
