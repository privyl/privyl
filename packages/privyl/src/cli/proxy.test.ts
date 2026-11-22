import { createServer, request, type IncomingHttpHeaders, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { parseProxyArgs } from "./proxy.js";
import { startProxy } from "./proxy-server.js";

const CPF = "529.982.247-25";
const EMAIL = "ana@example.com";

/** A fake AI API on localhost: records what it receives and answers with the placeholders. */
interface Received {
  method: string;
  path: string;
  headers: IncomingHttpHeaders;
  body: string;
}
let received: Received[] = [];
let upstream: Server;
let upstreamUrl = "";
let proxy: Server;
let proxyUrl = "";
const logs: string[] = [];

function answer(path: string): unknown {
  if (path === "/v1/messages")
    return {
      content: [
        { type: "text", text: "Done, [CPF_1]. Receipt sent to [EMAIL_1]." },
        { type: "tool_use", id: "t1", name: "send", input: { to: "[EMAIL_1]" } },
      ],
    };
  if (path === "/v1/chat/completions")
    return { choices: [{ message: { role: "assistant", content: "CPF [CPF_1] ok" } }] };
  return { data: [{ id: "model-test" }] };
}

beforeAll(async () => {
  upstream = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const path = (req.url ?? "").split("?")[0] ?? "";
      received.push({
        method: req.method ?? "",
        path: req.url ?? "",
        headers: req.headers,
        body: Buffer.concat(chunks).toString("utf8"),
      });
      res.writeHead(200, { "content-type": "application/json", "request-id": "req_test" });
      res.end(JSON.stringify(answer(path)));
    });
  });
  await new Promise<void>((r) => upstream.listen(0, "127.0.0.1", r));
  upstreamUrl = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;

  ({ server: proxy, url: proxyUrl } = await startProxy({
    port: 0,
    anthropicUrl: upstreamUrl,
    openaiUrl: `${upstreamUrl}/`,
    log: (line) => logs.push(line),
    maxBodyBytes: 50_000,
  }));
});

afterAll(() => {
  proxy.close();
  upstream.close();
});

beforeEach(() => {
  received = [];
  logs.length = 0;
});

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${proxyUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("privyl proxy", () => {
  it("masks an Anthropic request and restores the answer", async () => {
    const res = await post(
      "/anthropic/v1/messages?beta=true",
      {
        model: "claude-test",
        max_tokens: 100,
        system: `Customer email: ${EMAIL}`,
        messages: [{ role: "user", content: `My CPF is ${CPF}` }],
      },
      { "x-api-key": "test-key", "anthropic-version": "2023-06-01" },
    );
    const json = (await res.json()) as { content: { text?: string; input?: unknown }[] };

    expect(res.status).toBe(200);
    expect(res.headers.get("request-id")).toBe("req_test");
    const sent = received[0];
    expect(sent?.path).toBe("/v1/messages?beta=true");
    expect(sent?.body).not.toContain(CPF);
    expect(sent?.body).not.toContain(EMAIL);
    expect(sent?.body).toContain("[CPF_1]");
    expect(sent?.headers["x-api-key"]).toBe("test-key");
    expect(sent?.headers["anthropic-version"]).toBe("2023-06-01");

    expect(json.content[0]?.text).toBe(`Done, ${CPF}. Receipt sent to ${EMAIL}.`);
    expect(json.content[1]?.input).toEqual({ to: EMAIL });
  });

  it("masks an OpenAI request", async () => {
    const res = await post(
      "/openai/v1/chat/completions",
      { model: "gpt-test", messages: [{ role: "user", content: `CPF ${CPF}` }] },
      { authorization: "Bearer test-key" },
    );
    const json = (await res.json()) as { choices: { message: { content: string } }[] };
    expect(received[0]?.body).not.toContain(CPF);
    expect(received[0]?.headers.authorization).toBe("Bearer test-key");
    expect(json.choices[0]?.message.content).toBe(`CPF ${CPF} ok`);
  });

  it("logs types and counts, never the values or the query string", async () => {
    await post("/anthropic/v1/messages?key=abc", {
      messages: [{ role: "user", content: `CPF ${CPF}, ${EMAIL}` }],
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatch(/^POST \/anthropic\/v1\/messages → 200 · masked CPF×1, Email×1 · /);
    expect(logs[0]).not.toContain(CPF);
    expect(logs[0]).not.toContain("abc");
  });

  it("refuses streaming without calling the API", async () => {
    const res = await post("/openai/v1/chat/completions", { stream: true, messages: [] });
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/Streaming is not supported/);
    expect(received).toHaveLength(0);
  });

  it("refuses endpoints it cannot protect instead of sending data unmasked", async () => {
    const res = await post("/openai/v1/embeddings", { input: `CPF ${CPF}` });
    expect(res.status).toBe(403);
    expect(await res.text()).toMatch(/does not protect POST \/v1\/embeddings/);
    expect(received).toHaveLength(0);
  });

  it("passes requests without a body through", async () => {
    const res = await fetch(`${proxyUrl}/openai/v1/models`, {
      headers: { authorization: "Bearer test-key" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [{ id: "model-test" }] });
    expect(received[0]?.method).toBe("GET");
    expect(received[0]?.path).toBe("/v1/models");
  });

  it("answers clear errors", async () => {
    expect((await post("/anthropic/v1/messages", "{not json")).status).toBe(400);
    expect((await post("/anthropic/v1/messages", { big: "x".repeat(60_000) })).status).toBe(413);
    expect((await post("/somewhere/else", {})).status).toBe(404);
    expect(received).toHaveLength(0);
    const health = await fetch(`${proxyUrl}/health`);
    expect(await health.json()).toEqual({ ok: true });
  });

  it("blocks requests addressed to another host (DNS rebinding from a web page)", async () => {
    const { port } = new URL(proxyUrl);
    const status = await new Promise<number>((resolve, reject) => {
      const req = request(
        {
          host: "127.0.0.1",
          port,
          path: "/openai/v1/models",
          headers: { host: "evil.example:8787" },
        },
        (res) => {
          res.resume();
          resolve(res.statusCode ?? 0);
        },
      );
      req.on("error", reject);
      req.end();
    });
    expect(status).toBe(403);
    expect(received).toHaveLength(0);
  });

  it("never sends a request to another host, whatever the path", async () => {
    for (const path of [
      "/openai//evil.example/v1/models",
      "/openai/@evil.example/v1/models",
      "/openai/%2F%2Fevil.example/v1/models",
      "/openai/..%2F..%2Fevil.example",
    ]) {
      await fetch(`${proxyUrl}${path}`);
    }
    const upstreamHost = new URL(upstreamUrl).host;
    for (const r of received) expect(r.headers.host).toBe(upstreamHost);
  });

  it("explains itself when opened in a browser", async () => {
    const res = await fetch(`${proxyUrl}/`);
    const json = (await res.json()) as { name: string; protected: Record<string, string[]> };
    expect(json.name).toBe("privyl proxy");
    expect(json.protected.anthropic).toContain("/v1/messages");
    expect(received).toHaveLength(0);
  });

  it("answers 502 when the AI API cannot be reached", async () => {
    const { server, url } = await startProxy({ port: 0, anthropicUrl: "http://127.0.0.1:9" });
    try {
      const res = await fetch(`${url}/anthropic/v1/messages`, {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      });
      expect(res.status).toBe(502);
    } finally {
      server.close();
    }
  });
});

describe("privyl proxy options", () => {
  it("parses the command line", () => {
    expect(parseProxyArgs(["--port", "9000", "--host", "0.0.0.0", "--quiet"])).toMatchObject({
      port: 9000,
      host: "0.0.0.0",
      quiet: true,
    });
    expect(parseProxyArgs(["--openai-url", "http://localhost:11434"]).openaiUrl).toBe(
      "http://localhost:11434",
    );
    expect(() => parseProxyArgs(["--port", "abc"])).toThrow(/port/);
    expect(() => parseProxyArgs(["--openai-url", "localhost"])).toThrow(/URL/);
    expect(() => parseProxyArgs(["--nope"])).toThrow(/Unknown option/);
  });
});
