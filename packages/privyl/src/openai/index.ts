// Adapter for the OpenAI SDK (openai). The SDK is not a dependency: pass the client you have.
// Also works with OpenAI-compatible clients (same API shape).
//
//   const client = protectOpenAI(new OpenAI());
//   await client.chat.completions.create({ model, messages });   // Chat Completions
//   await client.responses.create({ model, input });             // Responses
//
// Before the request: personal data becomes placeholders.
// After the response: placeholders in text and tool-call arguments go back to the real values.

import {
  RequestMasker,
  isObject,
  overrideMethod,
  refuseStreaming,
  type ProtectOptions,
} from "../adapters/shared.js";

export type { ProtectOptions } from "../adapters/shared.js";

/** The part of the OpenAI client that Privyl needs. */
export interface OpenAILike {
  chat: { completions: { create(...args: never[]): unknown } };
}

/**
 * Wraps an OpenAI client so `chat.completions.create` and `responses.create` never send personal
 * data. Other methods keep working, unprotected.
 */
export function protectOpenAI<T extends OpenAILike>(client: T, options: ProtectOptions = {}): T {
  const wrap =
    (
      maskParams: (p: unknown, m: RequestMasker) => unknown,
      restore: (r: unknown, m: RequestMasker) => unknown,
    ) =>
    (create: (...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) => {
      const [params, ...rest] = args;
      refuseStreaming(params);
      const m = new RequestMasker(options);
      const masked = maskParams(params, m);
      options.onFindings?.(m.findings);
      return restore(await create(masked, ...rest), m);
    };

  // chat.completions.create: `chat` holds `completions`, so wrap one level deeper.
  const chat = (client as Record<string, unknown>).chat as Record<string, object>;
  const completions = overrideMethod(
    chat as object & { completions: object },
    ["completions", "create"],
    wrap(maskChatParams, restoreChatResponse),
  );
  let result = new Proxy(client, {
    get: (obj, prop, receiver) =>
      prop === "chat" ? completions : Reflect.get(obj, prop, receiver),
  });

  const responses = (client as Record<string, unknown>).responses;
  if (isObject(responses) && typeof responses.create === "function") {
    result = overrideMethod(
      result,
      ["responses", "create"],
      wrap(maskResponsesParams, restoreResponsesResponse),
    );
  }
  return result;
}

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

function maskChatParams(params: unknown, m: RequestMasker): unknown {
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

function restoreChatResponse(response: unknown, m: RequestMasker): unknown {
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

function maskResponsesParams(params: unknown, m: RequestMasker): unknown {
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

function restoreResponsesResponse(response: unknown, m: RequestMasker): unknown {
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
