# Contributing to Privyl

Thanks for helping! Privyl is small on purpose: simple, readable code with no runtime
dependencies.

## Setup

Requires Node 20+ and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm test      # run tests
pnpm lint      # ESLint + Prettier
pnpm build     # build the package
```

## Rules

- **Never use real personal data** in tests, examples, issues or pull requests. Use
  `privyl/testing` (`createFaker`) or obviously fake values (`@example.com`, public test cards).
- The library must not make network calls and must run in Node, Bun, Deno, browsers and edge
  runtimes. Do not use Node-only APIs in `core`, `global`, `br` or any country folder.
- Every detector needs tests for **true positives** (what it should find) and **false positives**
  (what it must ignore).
- Keep pull requests small and focused, with clear commit messages in English.

## How to add a country

Each country is a folder in `packages/privyl/src/<code>/` (ISO 3166 code in lowercase) that
exports an array of detectors.

1. **Create the folder**, for example `packages/privyl/src/pt/index.ts` for Portugal.
2. **Write the detectors.** A detector is a plain object:

   ```ts
   import type { Detector } from "../core/types.js";
   import { hasContextBefore, onlyDigits } from "../core/utils.js";

   export const nif: Detector = {
     id: "pt.nif", // "<country>.<name>", unique
     label: "NIF", // human readable
     token: "NIF", // placeholder → [NIF_1]; uppercase letters/digits only
     country: "pt",
     pattern: /(?<!\d)\d{9}(?!\d)/, // finds candidates
     validate: (value, { text, start }) =>
       isValidNif(onlyDigits(value)) && hasContextBefore(text, start, /\bnif\b/i),
     confidence: 0.9, // 0–1, used when two detections overlap
   };

   export const pt: readonly Detector[] = [nif];
   ```

   Tips:
   - Use lookarounds like `(?<!\d)` and `(?!\d)` so you never match part of a longer number.
   - Validate check digits whenever the document has them.
   - If the format is ambiguous (just N digits), require a context word with `hasContextBefore`.
   - Higher `confidence` wins when two detectors match the same text.

3. **Add the entry point** in `packages/privyl/tsup.config.ts` (`"pt/index": "src/pt/index.ts"`)
   and in `packages/privyl/package.json` under `exports` (`"./pt"`).
4. **Write tests** in `packages/privyl/src/pt/pt.test.ts`: true positives, false positives
   (wrong check digits, repeated digits, numbers inside longer numbers) and an overlap test with
   `global`.
5. **Add test data** to `packages/privyl/src/testing/index.ts` if the format has check digits.
6. **Update the coverage table** in `README.md`, including what is _not_ detected.

## Reporting security problems

Please do not open a public issue. See [SECURITY.md](SECURITY.md).
