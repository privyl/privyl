// How Privyl reads and restores the OpenAI Chat Completions and Responses formats.
// Shared by the SDK adapter (privyl/openai) and the proxy.

import { isObject, type RequestMasker } from "../adapters/shared.js";

/* ---------- Chat Completions ---------- */

function maskChatContent(content: unknown, m: RequestMasker): unknown {
  if (typeof content === "string") return m.text(content);
  if (Array.isArray(content)) {
    return content.map((part) =>
      isObject(part) && part.type === "text" && typeof part.text === "string"
        ? { ...part, text: m.text(part.text) }
        : part,
    );
  }
  return content;
}

export function maskChatParams(params: unknown, m: RequestMasker): unknown {
  if (!isObject(params) || !Array.isArray(params.messages)) return params;
  return {
    ...params,
    messages: params.messages.map((msg) => {
      if (!isObject(msg)) return msg;
      const out: Record<string, unknown> = { ...msg, content: maskChatContent(msg.content, m) };
      if (Array.isArray(msg.tool_calls)) {
        out.tool_calls = msg.tool_calls.map((call) =>
          isObject(call) && isObject(call.function) && typeof call.function.arguments === "string"
            ? {
                ...call,
                function: { ...call.function, arguments: m.text(call.function.arguments) },
              }
            : call,
        );
      }
      return out;
    }),
  };
}

export function restoreChatResponse(response: unknown, m: RequestMasker): unknown {
  if (!isObject(response) || !Array.isArray(response.choices)) return response;
  for (const choice of response.choices) {
    if (!isObject(choice) || !isObject(choice.message)) continue;
    const msg = choice.message;
    if (typeof msg.content === "string") msg.content = m.restore(msg.content);
    if (Array.isArray(msg.tool_calls)) {
      for (const call of msg.tool_calls) {
        if (
          isObject(call) &&
          isObject(call.function) &&
          typeof call.function.arguments === "string"
        )
          call.function.arguments = m.restore(call.function.arguments);
      }
    }
  }
  return response;
}

/* ---------- Responses API ---------- */

export function maskResponsesParams(params: unknown, m: RequestMasker): unknown {
  if (!isObject(params)) return params;
  const out: Record<string, unknown> = { ...params };
  if (typeof params.instructions === "string") out.instructions = m.text(params.instructions);
  if (typeof params.input === "string") out.input = m.text(params.input);
  else if (Array.isArray(params.input)) {
    out.input = params.input.map((item) => {
      if (!isObject(item)) return item;
      if (typeof item.content === "string") return { ...item, content: m.text(item.content) };
      if (Array.isArray(item.content)) {
        return {
          ...item,
          content: item.content.map((part) =>
            isObject(part) && typeof part.text === "string"
              ? { ...part, text: m.text(part.text) }
              : part,
          ),
        };
      }
      if (item.type === "function_call_output" && typeof item.output === "string")
        return { ...item, output: m.text(item.output) };
      if (item.type === "function_call" && typeof item.arguments === "string")
        return { ...item, arguments: m.text(item.arguments) };
      return item;
    });
  }
  return out;
}

export function restoreResponsesResponse(response: unknown, m: RequestMasker): unknown {
  if (!isObject(response)) return response;
  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (!isObject(item)) continue;
      if (Array.isArray(item.content)) {
        for (const part of item.content) {
          if (isObject(part) && typeof part.text === "string") part.text = m.restore(part.text);
        }
      }
      if (item.type === "function_call" && typeof item.arguments === "string")
        item.arguments = m.restore(item.arguments);
    }
  }
  // The SDK adds `output_text` (all text joined) as a plain property.
  if (typeof response.output_text === "string")
    response.output_text = m.restore(response.output_text);
  return response;
}
