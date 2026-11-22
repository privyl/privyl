import { describe, expect, it } from "vitest";
import { protectOpenAI } from "./index.js";

const CPF = "529.982.247-25";
const PHONE = "(11) 98765-4321";

function fakeClient() {
  const calls: { api: string; params: unknown }[] = [];
  const client = {
    chat: {
      completions: {
        async create(params: unknown) {
          calls.push({ api: "chat", params });
          return {
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Calling [PHONE_1] about CPF [CPF_1].",
                  tool_calls: [
                    {
                      id: "c1",
                      type: "function",
                      function: { name: "call", arguments: '{"phone":"[PHONE_1]"}' },
                    },
                  ],
                },
              },
            ],
          };
        },
      },
      other: "kept",
    },
    responses: {
      async create(params: unknown) {
        calls.push({ api: "responses", params });
        return {
          output: [
            { type: "message", content: [{ type: "output_text", text: "CPF [CPF_1] ok" }] },
            { type: "function_call", name: "f", arguments: '{"cpf":"[CPF_1]"}' },
          ],
          output_text: "CPF [CPF_1] ok",
        };
      },
    },
    models: { list: () => "models" },
  };
  return { client, calls };
}

describe("protectOpenAI", () => {
  it("protects chat.completions.create", async () => {
    const { client, calls } = fakeClient();
    const res = (await protectOpenAI(client).chat.completions.create({
      model: "gpt-test",
      messages: [
        { role: "system", content: "Be brief." },
        { role: "user", content: [{ type: "text", text: `CPF ${CPF}, phone ${PHONE}` }] },
        {
          role: "assistant",
          content: null,
          tool_calls: [
            { id: "c0", type: "function", function: { name: "f", arguments: `{"cpf":"${CPF}"}` } },
          ],
        },
        { role: "tool", tool_call_id: "c0", content: `found ${CPF}` },
      ],
    })) as {
      choices: {
        message: { content: string; tool_calls: { function: { arguments: string } }[] };
      }[];
    };

    const sent = JSON.stringify(calls[0]?.params);
    expect(sent).not.toContain(CPF);
    expect(sent).not.toContain(PHONE);
    expect(sent).toContain("[CPF_1]");

    const msg = res.choices[0]?.message;
    expect(msg?.content).toBe(`Calling ${PHONE} about CPF ${CPF}.`);
    expect(msg?.tool_calls[0]?.function.arguments).toBe(`{"phone":"${PHONE}"}`);
  });

  it("protects responses.create", async () => {
    const { client, calls } = fakeClient();
    const res = (await protectOpenAI(client).responses.create({
      model: "gpt-test",
      instructions: `User phone: ${PHONE}`,
      input: [{ role: "user", content: [{ type: "input_text", text: `My CPF: ${CPF}` }] }],
    })) as { output_text: string; output: { arguments?: string; content?: { text: string }[] }[] };

    const sent = JSON.stringify(calls[0]?.params);
    expect(sent).not.toContain(CPF);
    expect(sent).not.toContain(PHONE);
    expect(res.output_text).toBe(`CPF ${CPF} ok`);
    expect(res.output[0]?.content?.[0]?.text).toBe(`CPF ${CPF} ok`);
    expect(res.output[1]?.arguments).toBe(`{"cpf":"${CPF}"}`);
  });

  it("protects a plain string input", async () => {
    const { client, calls } = fakeClient();
    await protectOpenAI(client).responses.create({ model: "m", input: `CPF ${CPF}` });
    expect(JSON.stringify(calls[0]?.params)).not.toContain(CPF);
  });

  it("keeps the rest of the client working", () => {
    const { client } = fakeClient();
    const p = protectOpenAI(client);
    expect(p.models.list()).toBe("models");
    expect((p.chat as unknown as { other: string }).other).toBe("kept");
  });

  it("refuses streaming instead of leaking", async () => {
    const { client, calls } = fakeClient();
    await expect(
      protectOpenAI(client).chat.completions.create({ stream: true, messages: [] }),
    ).rejects.toThrow(/streaming/);
    expect(calls).toHaveLength(0);
  });
});
