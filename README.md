# Privyl

[![npm](https://img.shields.io/npm/v/privyl)](https://www.npmjs.com/package/privyl)
[![CI](https://github.com/privyl/privyl/actions/workflows/ci.yml/badge.svg)](https://github.com/privyl/privyl/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**Use any AI. Keep your data private.**

Privyl (say "PRI-vil", from _private_) is a privacy layer for AI. It masks personal data before
your text reaches any LLM, and restores it in the response.

**[Website](https://privyl.vercel.app)** · [Live demo](https://privyl.vercel.app/en#demo) ·
[Playground](https://privyl.vercel.app/en/playground) · [Docs](https://privyl.vercel.app/en/docs) ·
[Benchmark](https://privyl.vercel.app/en/benchmark)

> **Status:** early release (0.x). The API may still change between minor versions.

## Why

When you send text to Claude, GPT, Gemini, Llama or a local model, any personal data inside it
(emails, phone numbers, card numbers, Brazilian CPF and CNPJ, API keys) goes with it. Privyl
replaces that data with placeholders like `[CPF_1]` before the request and puts the real values
back afterwards. The mapping stays in a `vault` on your machine.

## Usage

```ts
import { createShield } from "privyl";
import { br } from "privyl/br";
import { global } from "privyl/global";

const shield = createShield({ detectors: [...global, ...br] });

const { text, vault, findings } = shield.mask(
  "Customer CPF 529.982.247-25, email joao@example.com",
);
// text → "Customer CPF [CPF_1], email [EMAIL_1]"

const restored = shield.unmask(aiResponse, vault);
```

- The same value always gets the same placeholder inside a vault. Pass `{ vault }` to `mask` to
  keep placeholders consistent across a whole conversation.
- `findings` lists type, position and confidence, **never** the real value, so it is safe to log.
- `unmask` also understands placeholders the AI changed slightly (`[cpf_1]`, `[CPF 1]`, `CPF_1`).
- Privyl makes no network calls (the optional `privyl proxy` only forwards requests to the AI API
  you point it at). The vault lives in memory unless you save it yourself
  (`vault.toJSON()` / `Vault.fromJSON()`); it contains the real data, so store it carefully.

## Use with AI SDKs

Wrap the client you already use. The SDKs are not dependencies of Privyl.

```ts
import Anthropic from "@anthropic-ai/sdk";
import { protectAnthropic } from "privyl/anthropic";

const claude = protectAnthropic(new Anthropic());
const msg = await claude.messages.create({
  model: "claude-sonnet-5-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Meu CPF é 529.982.247-25" }],
});
// Anthropic receives "Meu CPF é [CPF_1]". msg.content comes back with the real CPF.
```

`privyl/openai` works the same way with `protectOpenAI(new OpenAI())`, for
`chat.completions.create` and `responses.create`. Streaming is not supported yet: the call fails
instead of sending unprotected data.

## Proxy (any language)

Not using JavaScript? Run the proxy and point your SDK at it. It masks the request, forwards it to
the AI API and restores the answer.

```sh
npx privyl proxy
# ANTHROPIC_BASE_URL=http://127.0.0.1:8787/anthropic
# OPENAI_BASE_URL=http://127.0.0.1:8787/openai/v1
```

Or with Docker:

```sh
docker build -t privyl-proxy https://github.com/privyl/privyl.git#main:proxy
docker run --rm -p 127.0.0.1:8787:8787 privyl-proxy
```

- Protected: Anthropic `/v1/messages`, OpenAI (or compatible) `/v1/chat/completions` and
  `/v1/responses`. Requests without a body (like listing models) pass through.
- **Fails closed:** a request with a body to any other endpoint is refused, not sent unmasked.
  Streaming (`stream: true`) is refused too, for now.
- Listens on `127.0.0.1` by default. Nothing is written to disk; the log shows only types and
  counts (`masked CPF×1, Email×1`), never values.
- Your app keeps sending its own API key. The proxy passes it on and does not store it.

## Scan a project

See how much personal data a project could send to an AI:

```sh
npx privyl scan ./my-project
```

```
  data/customers.csv
    2:13     CPF    529.***.***-25
    2:28     Email  a***@example.com

  Summary
    CPF       1
    Email     1

  2 finding(s) in 1 of 4 file(s) scanned.
```

- Scans `.log .json .jsonl .csv .ts .js .md .env` and `.env.*`. Skips `node_modules`, `.git`,
  `dist`, binary files and files over 10 MB.
- Values are always shown partly hidden. Nothing leaves your machine.
- `--json` prints a machine-readable report for CI.
- `--fail-on-findings` exits with code 1 when anything is found, so a CI job can block a pull
  request.
- `--fix` writes masked copies to `privyl-masked/` (change it with `--out <dir>`). Originals are
  never changed unless you also pass `--in-place`.

## What is detected

| Country       | Data                 | Notes                                                         |
| ------------- | -------------------- | ------------------------------------------------------------- |
| Global        | Email                | Including accented addresses (`joão@example.com`)             |
| Global        | Phone                | International format starting with `+` (8–15 digits)          |
| Global        | Payment card         | 13–19 digits, Luhn checksum                                   |
| Global        | IP address           | IPv4 and IPv6 (loopback and `version 1.2.3.4` ignored)        |
| Global        | API keys and secrets | AWS, GitHub, Anthropic, OpenAI, Stripe, Slack, Google, JWT,   |
|               |                      | private keys, and values of `password=`, `api_key=`, etc.     |
| Brazil        | CPF                  | Check digits validated                                        |
| Brazil        | CNPJ                 | Check digits validated, including the new alphanumeric CNPJ   |
| Brazil        | Pix key (random)     | UUID right after the word "Pix"                               |
| Brazil        | CEP                  | `01310-100` near an address word (rua, CEP, bairro, "SP"...)  |
| Brazil        | CNH                  | Check digits, near "CNH", "habilitação" or "motorista"        |
| Brazil        | Vehicle plate        | Mercosul `ABC1D23`; old `ABC-1234` only near "placa", "carro" |
| Brazil        | Phone                | `+55`, `(11) 98765-4321`; area code and format validated      |
| Portugal      | NIF                  | Check digit, near "NIF"/"contribuinte" or with `PT` prefix    |
| Portugal      | Cartão de Cidadão    | `12345678 9 ZZ1`, check digit validated                       |
| Portugal      | NISS                 | Check digit, near "NISS"/"Segurança Social"                   |
| Argentina     | CUIT/CUIL            | Check digit; digits-only form needs the word "CUIT"/"CUIL"    |
| Argentina     | DNI                  | Right after the word "DNI" (it has no check digit)            |
| United States | SSN                  | `123-45-6789`, never-issued numbers rejected                  |
| United States | ITIN                 | `9XX-7X-XXXX`, valid ranges only                              |
| Mexico        | CURP                 | Birth date, state and check digit validated                   |
| Mexico        | RFC                  | People and companies, check character validated               |
| Chile         | RUT/RUN              | `12.345.678-5`, check digit (including K)                     |

Import each country from its own path: `privyl/br`, `privyl/pt`, `privyl/ar`, `privyl/us`,
`privyl/mx`, `privyl/cl`. The `scan` command uses all of them.

### What is **not** detected (yet)

- **Names, addresses, dates of birth** and other free-form data. These need a language model.
- Documents from other countries (contributions welcome, see [CONTRIBUTING.md](CONTRIBUTING.md)).
- RG (Brazilian ID card): its format varies by state and has no national check digit.
- A CEP or an old plate (`ABC-1234`) with no address or vehicle word nearby, a DNI without the
  word "DNI", a CPF written with spaces, and emails written as `name [at] example.com`.
- Phone numbers without `+` outside Brazil, and secrets from providers not listed above.
- Data split across lines, encoded (base64, URL encoding) or inside images and PDFs.

An SSN has no check digit, so a part number shaped like `123-45-6789` is masked too.

Validation by check digit means a random number _can_ still match by chance (about 1 in 100 for
CPF). Ambiguous formats, like a raw 11-digit number, need nearby context words to count as a CNH
or phone.

## Test data

`privyl/testing` generates fake data with valid formats, for your own tests:

```ts
import { createFaker } from "privyl/testing";

const faker = createFaker(42); // same seed → same values
faker.cpf(); // "123.456.789-09" style, valid check digits
faker.email(); // always @example.com
faker.card(); // public test card numbers only
```

Generated CPFs and CNPJs are random. They are not linked to any person, but a valid number may
exist in real life, so never use them to look anyone up.

## Principles

- **Precision:** validate check digits and avoid false positives.
- **Ease:** working in two minutes, with three lines of code.
- **Trust:** no network calls, no runtime dependencies, open tests and benchmark.

Privyl reduces the risk of sending personal data to AI. It does not guarantee that every piece of
personal data is detected. The documentation lists what is and is not covered.

## Development

Requires Node 20+ and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm test
pnpm build
```

## License

[MIT](LICENSE) © Nycolas Inowe. See also [SECURITY.md](SECURITY.md).

---

## Português

**Use qualquer IA. Seus dados continuam seus.**

O Privyl é uma camada de privacidade para IA. Ele esconde dados pessoais (e-mail, telefone,
cartão, CPF, CNPJ, chave Pix, chaves de API) antes de o texto chegar a qualquer modelo de IA e
devolve os dados reais na resposta. A relação entre substitutos e dados reais fica num `vault`
que não sai da sua máquina.

Site em português: **[privyl.vercel.app/pt](https://privyl.vercel.app/pt)**

O projeto está no início (versão 0.x) e já está no npm: `npm install privyl`. Além do Brasil,
detecta documentos de Portugal, Argentina, Estados Unidos, México e Chile. O Privyl reduz o risco de enviar dados
pessoais para a IA, mas não garante que todos os dados sejam detectados. Nomes, endereços e datas
de nascimento ainda **não** são detectados. A tabela acima mostra o que é coberto em cada país.
