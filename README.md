# Privyl

**Use any AI. Keep your data private.**

Privyl (say "PRI-vil", from _private_) is a privacy layer for AI. It masks personal data before
your text reaches any LLM, and restores it in the response.

> **Status:** early development. Not published to npm yet.

## Why

When you send text to Claude, GPT, Gemini, Llama or a local model, any personal data inside it
(emails, phone numbers, card numbers, Brazilian CPF and CNPJ, API keys) goes with it. Privyl
replaces that data with placeholders like `[CPF_1]` before the request and puts the real values
back afterwards. The mapping stays in a `vault` on your machine.

## Planned usage

```ts
import { createShield } from "privyl";
import { br } from "privyl/br";
import { global } from "privyl/global";

const shield = createShield({ detectors: [...global, ...br] });

const { text, vault } = shield.mask("Customer CPF 529.982.247-25, email joao@example.com");
// text → "Customer CPF [CPF_1], email [EMAIL_1]"

const restored = shield.unmask(aiResponse, vault);
```

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

O projeto está no início e ainda não foi publicado no npm. O Privyl reduz o risco de enviar dados
pessoais para a IA, mas não garante que todos os dados sejam detectados.
