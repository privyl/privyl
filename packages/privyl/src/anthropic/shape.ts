// How Privyl reads and restores the Anthropic Messages API format.
// Shared by the SDK adapter (privyl/anthropic) and the proxy.

import { isObject, type RequestMasker } from "../adapters/shared.js";

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

/** Masks `system` and `messages` of a Messages API request. Returns a copy. */
export function maskAnthropicRequest(params: unknown, m: RequestMasker): unknown {
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

/** Restores text blocks and tool inputs of a Messages API response. */
export function restoreAnthropicResponse(response: unknown, m: RequestMasker): unknown {
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
