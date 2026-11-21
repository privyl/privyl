# Examples

Three **fictional** projects full of **fake** personal data. The website demo scans them in the
browser.

| Folder             | What it pretends to be                                  |
| ------------------ | ------------------------------------------------------- |
| `online-store/`    | E-commerce with customers, orders, checkout logs        |
| `support-chatbot/` | Support bot that sends chat history to an AI            |
| `clinic/`          | Clinic system that asks an AI to summarize appointments |

All values come from `privyl/testing`: emails use `example.com`, cards are public test numbers,
IPs are documentation ranges (RFC 5737), and CPFs/CNPJs are random numbers with valid check
digits, linked to nobody. A test (`packages/privyl/src/examples.test.ts`) checks this.

Try it:

```sh
pnpm build
node packages/privyl/dist/cli/index.js scan examples/clinic
```

To regenerate the files (same seed, same output):

```sh
pnpm build && node examples/generate.mjs
```
