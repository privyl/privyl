// `privyl proxy`: starts the HTTP proxy from the command line.

import { startProxy, type ProxyOptions } from "./proxy-server.js";
import type { Io } from "./run.js";

export const PROXY_HELP = `Usage: privyl proxy [options]

Runs a local server between your app and the AI API. Personal data is masked before the
request leaves this machine and restored in the answer. Nothing is written to disk.

Options:
  --port <n>             Port to listen on (default: 8787)
  --host <addr>          Address to listen on (default: 127.0.0.1, only this machine)
  --anthropic-url <url>  Anthropic API (default: https://api.anthropic.com)
  --openai-url <url>     OpenAI or any compatible API (default: https://api.openai.com)
  --quiet                Do not log requests
  -h, --help             Show this help

Then point your SDK at it:
  ANTHROPIC_BASE_URL=http://127.0.0.1:8787/anthropic
  OPENAI_BASE_URL=http://127.0.0.1:8787/openai/v1

Protected: Anthropic /v1/messages, OpenAI /v1/chat/completions and /v1/responses.
Other requests with a body are refused, and so is streaming (stream: true).`;

export type ProxyArgs = ProxyOptions & { help: boolean; quiet: boolean };

export function parseProxyArgs(argv: readonly string[]): ProxyArgs {
  const args: ProxyArgs = { help: false, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith("--")) throw new Error(`${arg} needs a value`);
      return v;
    };
    if (arg === "-h" || arg === "--help") args.help = true;
    else if (arg === "--quiet") args.quiet = true;
    else if (arg === "--port") {
      const port = Number(value());
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid --port");
      args.port = port;
    } else if (arg === "--host") args.host = value();
    else if (arg === "--anthropic-url") args.anthropicUrl = checkUrl(value());
    else if (arg === "--openai-url") args.openaiUrl = checkUrl(value());
    else throw new Error(`Unknown option: ${arg}`);
  }
  return args;
}

function checkUrl(value: string): string {
  if (!/^https?:\/\//.test(value)) throw new Error(`Not an http(s) URL: ${value}`);
  return value;
}

/** Starts the proxy. Returns an exit code only when it cannot start. */
export async function runProxy(argv: readonly string[], io: Io): Promise<number | undefined> {
  let args: ProxyArgs;
  try {
    args = parseProxyArgs(argv);
  } catch (error) {
    io.err(`${(error as Error).message}\n\n${PROXY_HELP}`);
    return 2;
  }
  const { help, quiet, ...options } = args;
  if (help) {
    io.out(PROXY_HELP);
    return 0;
  }
  try {
    const { url } = await startProxy(quiet ? options : { ...options, log: io.out });
    io.out(`Privyl proxy listening on ${url}

  ANTHROPIC_BASE_URL=${url}/anthropic
  OPENAI_BASE_URL=${url}/openai/v1

Personal data is masked before it leaves this machine. Nothing is written to disk.
Press Ctrl+C to stop.`);
    return undefined;
  } catch (error) {
    io.err(`Could not start the proxy: ${(error as Error).message}`);
    return 1;
  }
}
