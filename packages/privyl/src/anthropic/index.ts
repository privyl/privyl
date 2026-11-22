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
  overrideMethod,
  refuseStreaming,
  type ProtectOptions,
} from "../adapters/shared.js";
import { maskAnthropicRequest, restoreAnthropicResponse } from "./shape.js";

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
    const masked = maskAnthropicRequest(params, m);
    options.onFindings?.(m.findings);
    const response = await create(masked, ...rest);
    return restoreAnthropicResponse(response, m);
  });
}
