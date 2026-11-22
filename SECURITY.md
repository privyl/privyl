# Security Policy

Privyl is a privacy tool, so we take security reports seriously.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report it privately through GitHub Security Advisories:
[github.com/privyl/privyl/security/advisories/new](https://github.com/privyl/privyl/security/advisories/new)

Please include:

- What you found and why it matters (for example: a type of personal data that leaks through `mask`).
- Steps or a minimal input to reproduce it. **Use fake data only**, never real personal data.
- The Privyl version and runtime (Node, Bun, Deno, browser, edge).

We will acknowledge your report as soon as possible and keep you updated until it is resolved.

## Supported versions

Privyl is in early development (`0.x`). Only the latest released version receives security fixes.

## Scope

Privyl reduces the risk of sending personal data to AI models. It does not guarantee that every
piece of personal data will be detected. Missed detections of a documented data type are valid
reports; data types we document as "not detected" are feature requests, not vulnerabilities.

## What is tested on every commit

- **Crafted inputs (ReDoS):** long inputs built to make the regular expressions slow must finish
  in well under a second (`packages/privyl/src/security.test.ts`).
- **Placeholders:** `unmask` only restores what the same vault masked. Placeholders the user typed
  (in any form `unmask` accepts) are never reused.
- **Proxy:** requests go only to the configured API, whatever the path. When listening on
  `127.0.0.1` it only accepts requests addressed to `127.0.0.1` or `localhost` (blocks DNS
  rebinding from a web page). Endpoints it cannot protect and streaming are refused, and the log
  holds no values or query strings.
- **CLI:** `scan --fix` refuses to write through symbolic links, and file names are printed
  without terminal control characters.
- **Releases:** GitHub Actions are pinned to commit hashes, the release job has no cache and only
  publishes tags that are on `main`, through npm Trusted Publishing (no npm token stored).

## Using the vault safely

The vault holds the real values. Use one vault per user or conversation: a vault shared between
users would let one user's text bring back another user's data through `unmask`.
