import { describe, expect, it } from "vitest";
import { protectAnthropic } from "./index.js";

const CPF = "529.982.247-25";
const EMAIL = "ana@example.com";

/** A fake Anthropic client: records what it receives and answers with the placeholders. */
function fakeClient(reply: (sent: string) => unknown) {
  const calls: unknown[] = [];
  const client = {
    apiKey: "test",
    messages: {
      async create(params: unknown) {
        calls.push(params);
        return reply(JSON.stringify(params));
      },
      count() {
        return "other method";
      },
    },
    models: { list: () => "models" },
  };
  return { client, calls };
}

describe("protectAnthropic", () => {
  it("masks system, text and tool results, and restores the answer", async () => {
    const { client, calls } = fakeClient(() => ({
      content: [
        { type: "text", text: "Done, [cpf_1]! Receipt sent to [EMAIL_1]." },
        { type: "tool_use", id: "t1", name: "send", input: { to: "[EMAIL_1]", n: 1 } },
      ],
    }));
    const found: string[] = [];
    const protectedClient = protectAnthropic(client, {
      onFindings: (f) => found.push(...f.map((x) => x.placeholder)),
    });

    const res = (await protectedClient.messages.create({
      model: "claude-test",
      max_tokens: 100,
      system: `Customer email: ${EMAIL}`,
      messages: [
        { role: "user", content: `My CPF is ${CPF}` },
        {
          role: "user",
          content: [
            { type: "text", text: `Again: ${CPF}` },
            { type: "tool_result", tool_use_id: "t0", content: `email ${EMAIL}` },
          ],
        },
      ],
    })) as { content: { type: string; text?: string; input?: unknown }[] };

    const sent = JSON.stringify(calls[0]);
    expect(sent).not.toContain(CPF);
    expect(sent).not.toContain(EMAIL);
    expect(sent).toContain("[CPF_1]");
    expect(sent).toContain("[EMAIL_1]");
    expect(sent).toContain('"model":"claude-test"');

    expect(res.content[0]?.text).toBe(`Done, ${CPF}! Receipt sent to ${EMAIL}.`);
    expect(res.content[1]?.input).toEqual({ to: EMAIL, n: 1 });
    expect(found).toContain("[CPF_1]");
  });

  it("masks plain-text documents and search results", async () => {
    const { client, calls } = fakeClient(() => ({ content: [] }));
    await protectAnthropic(client).messages.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              title: `Ficha de ${EMAIL}`,
              source: { type: "text", media_type: "text/plain", data: `CPF ${CPF}` },
            },
            {
              type: "document",
              source: { type: "content", content: [{ type: "text", text: `CPF ${CPF}` }] },
            },
            {
              type: "search_result",
              source: "https://example.com",
              title: "Cliente",
              content: [{ type: "text", text: `email ${EMAIL}` }],
            },
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: "JVBERi0" },
            },
          ],
        },
      ],
    });
    const sent = JSON.stringify(calls[0]);
    expect(sent).not.toContain(CPF);
    expect(sent).not.toContain(EMAIL);
    expect(sent).toContain("JVBERi0"); // PDFs go unchanged
  });

  it("does not change the caller's params", async () => {
    const { client } = fakeClient(() => ({ content: [] }));
    const params = { messages: [{ role: "user", content: `CPF ${CPF}` }] };
    await protectAnthropic(client).messages.create(params);
    expect(params.messages[0]?.content).toBe(`CPF ${CPF}`);
  });

  it("keeps the rest of the client working", () => {
    const { client } = fakeClient(() => ({}));
    const p = protectAnthropic(client);
    expect(p.messages.count()).toBe("other method");
    expect(p.models.list()).toBe("models");
    expect(p.apiKey).toBe("test");
  });

  it("refuses streaming instead of leaking", async () => {
    const { client, calls } = fakeClient(() => ({}));
    await expect(
      protectAnthropic(client).messages.create({ stream: true, messages: [] }),
    ).rejects.toThrow(/streaming/);
    expect(calls).toHaveLength(0);
  });

  it("fails clearly with a wrong client", () => {
    expect(() => protectAnthropic({} as never)).toThrow(/messages\.create/);
  });
});
