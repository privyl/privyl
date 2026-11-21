import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "core/index": "src/core/index.ts",
    "global/index": "src/global/index.ts",
    "br/index": "src/br/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2022",
  // Runs everywhere (Node, Bun, Deno, browsers, edge): no Node-specific APIs.
  platform: "neutral",
});
