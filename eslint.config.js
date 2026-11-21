import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/coverage/**",
      "examples/*/**", // generated fictional projects
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  prettier,
  {
    // Node scripts (for example examples/generate.mjs).
    files: ["**/*.mjs"],
    languageOptions: { globals: { console: "readonly", process: "readonly" } },
  },
  {
    // The library must run in browsers and edge runtimes: no Node APIs outside the CLI and tests.
    files: ["packages/privyl/src/**/*.ts"],
    ignores: ["packages/privyl/src/cli/**", "**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["node:*"], message: "Node APIs are only allowed in src/cli." }] },
      ],
      "no-restricted-globals": [
        "error",
        { name: "process", message: "Node APIs are only allowed in src/cli." },
        { name: "Buffer", message: "Node APIs are only allowed in src/cli." },
        { name: "require", message: "Node APIs are only allowed in src/cli." },
      ],
    },
  },
);
