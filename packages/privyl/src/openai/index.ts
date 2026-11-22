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
import {
  maskChatParams,
  maskResponsesParams,
  restoreChatResponse,
  restoreResponsesResponse,
} from "./shape.js";

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
