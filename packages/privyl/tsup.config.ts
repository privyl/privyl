import { defineConfig } from "tsup";

export default defineConfig([
  {
    // The library. Runs everywhere (Node, Bun, Deno, browsers, edge): no Node-specific APIs.
    entry: {
      "core/index": "src/core/index.ts",
      "global/index": "src/global/index.ts",
      "br/index": "src/br/index.ts",
      "scan/index": "src/scan/index.ts",
      "testing/index": "src/testing/index.ts",
      "anthropic/index": "src/anthropic/index.ts",
      "openai/index": "src/openai/index.ts",
    },
    format: ["esm", "cjs"],
    // The library has no Node types, which also keeps the type build small and fast.
    dts: { compilerOptions: { types: [] } },
    clean: true,
    sourcemap: true,
    target: "es2022",
    platform: "neutral",
  },
  {
    // The `privyl` command line. Node only.
    entry: { "cli/index": "src/cli/index.ts" },
    format: ["esm"],
    target: "node20",
    platform: "node",
    banner: { js: "#!/usr/bin/env node" },
  },
]);
