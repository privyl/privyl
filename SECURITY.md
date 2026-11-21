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
