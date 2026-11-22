// Adapter for the Anthropic SDK (@anthropic-ai/sdk). The SDK is not a dependency:
// pass the client you already have.
//
//   const client = protectAnthropic(new Anthropic());
//   const msg = await client.messages.create({ model, max_tokens, messages });
//
// Before the request: personal data in `system` and `messages` becomes placeholders.
// After the response: placeholders in text blocks and tool inputs go back to the real values.

import {
  RequestMasker,
  isObject,
  overrideMethod,
  refuseStreaming,
  type ProtectOptions,
} from "../adapters/shared.js";

export type { ProtectOptions } from "../adapters/shared.js";

/** The part of the Anthropic client that Privyl needs. */
export interface AnthropicLike {
  messages: { create(...args: never[]): unknown };
}

/** Wraps an Anthropic client so `messages.create` never sends personal data. */
export function protectAnthropic<T extends AnthropicLike>(
  client: T,
  options: ProtectOptions = {},
): T {
  return overrideMethod(client, ["messages", "create"], (create) => async (...args: unknown[]) => {
    const [params, ...rest] = args;
    refuseStreaming(params);
    const m = new RequestMasker(options);
    const masked = maskParams(params, m);
    options.onFindings?.(m.findings);
    const response = await create(masked, ...rest);
    return restoreResponse(response, m);
  });
}

function maskBlock(block: unknown, m: RequestMasker): unknown {
  if (!isObject(block)) return block;
  switch (block.type) {
    case "text":
      return typeof block.text === "string" ? { ...block, text: m.text(block.text) } : block;
    case "tool_use":
      return { ...block, input: m.deep(block.input) };
    case "tool_result":
      if (typeof block.content === "string") return { ...block, content: m.text(block.content) };
      if (Array.isArray(block.content))
        return { ...block, content: block.content.map((b) => maskBlock(b, m)) };
      return block;
    default:
      // Images, documents and thinking blocks are sent unchanged (thinking is signed by the API).
      return block;
  }
}

function maskContent(content: unknown, m: RequestMasker): unknown {
  if (typeof content === "string") return m.text(content);
  if (Array.isArray(content)) return content.map((b) => maskBlock(b, m));
  return content;
}

function maskParams(params: unknown, m: RequestMasker): unknown {
  if (!isObject(params)) return params;
  const out: Record<string, unknown> = { ...params };
  if (params.system !== undefined) out.system = maskContent(params.system, m);
  if (Array.isArray(params.messages)) {
    out.messages = params.messages.map((msg) =>
      isObject(msg) ? { ...msg, content: maskContent(msg.content, m) } : msg,
    );
  }
  return out;
}

function restoreResponse(response: unknown, m: RequestMasker): unknown {
  if (!isObject(response) || !Array.isArray(response.content)) return response;
  response.content = response.content.map((block: unknown) => {
    if (!isObject(block)) return block;
    if (block.type === "text" && typeof block.text === "string")
      return { ...block, text: m.restore(block.text) };
    if (block.type === "tool_use") return { ...block, input: m.restoreDeep(block.input) };
    return block;
  });
  return response;
}
