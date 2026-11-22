// Documentation content. Code samples are shared; prose is translated.

import type { Locale } from "./dictionaries";

export interface DocSection {
  id: string;
  title: string;
  /** Paragraphs. `inline code` in backticks is rendered as code. */
  body: string[];
  code?: string;
}

const code = {
  install: `npm install privyl
# or: pnpm add privyl · yarn add privyl · bun add privyl`,
  quickStart: `import { createShield } from "privyl";
import { br } from "privyl/br";
import { global } from "privyl/global";

const shield = createShield({ detectors: [...global, ...br] });

const { text, vault, findings } = shield.mask(
  "Cliente CPF 529.982.247-25, email joao@example.com",
);
// text → "Cliente CPF [CPF_1], email [EMAIL_1]"

const answer = await askYourAI(text); // Claude, GPT, Gemini, a local model...
const restored = shield.unmask(answer, vault);`,
  conversation: `import { Vault } from "privyl";

const vault = new Vault();
shield.mask("Meu CPF é 529.982.247-25", { vault }).text;
// → "Meu CPF é [CPF_1]"
shield.mask("Confirma o CPF 529.982.247-25?", { vault }).text;
// → "Confirma o CPF [CPF_1]?"  (same placeholder)

// Save it yourself if you need to (it contains the real data):
const saved = JSON.stringify(vault);
const again = Vault.fromJSON(JSON.parse(saved));`,
  unmask: `shield.unmask("Done, [cpf_1]! Sent to [EMAIL 1].", vault);
// → "Done, 529.982.247-25! Sent to joao@example.com."
// Also accepted: [CPF-1], [ CPF_1 ], [CPF\\_1], CPF_1`,
  adapters: `import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { protectAnthropic } from "privyl/anthropic";
import { protectOpenAI } from "privyl/openai";

const claude = protectAnthropic(new Anthropic());
const msg = await claude.messages.create({
  model: "claude-sonnet-5-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Meu CPF é 529.982.247-25" }],
});
// Sent to Anthropic: "Meu CPF é [CPF_1]". msg.content has the real CPF back.

const gpt = protectOpenAI(new OpenAI());
await gpt.chat.completions.create({ model: "gpt-5", messages });
await gpt.responses.create({ model: "gpt-5", input: "..." });

// Optional: your own shield, and a log of what was masked (never the real values)
protectAnthropic(new Anthropic(), { shield, onFindings: (f) => console.log(f) });`,
  countries: `import { createShield } from "privyl";
import { global } from "privyl/global"; // email, phone, card, IP, API keys
import { br } from "privyl/br"; // CPF, CNPJ, Pix, CEP, CNH, plate, phone
import { pt } from "privyl/pt"; // NIF, Cartão de Cidadão, NISS
import { ar } from "privyl/ar"; // CUIT/CUIL, DNI
import { us } from "privyl/us"; // SSN, ITIN
import { mx } from "privyl/mx"; // CURP, RFC
import { cl } from "privyl/cl"; // RUT/RUN

// Pick the countries your users come from: fewer detectors, fewer false alarms.
const shield = createShield({ detectors: [...global, ...br, ...pt] });`,
  proxy: `npx privyl proxy            # http://127.0.0.1:8787

# Point any SDK, in any language, at it:
ANTHROPIC_BASE_URL=http://127.0.0.1:8787/anthropic
OPENAI_BASE_URL=http://127.0.0.1:8787/openai/v1

# Or with Docker:
docker build -t privyl-proxy https://github.com/privyl/privyl.git#main:proxy
docker run --rm -p 127.0.0.1:8787:8787 privyl-proxy`,
  findings: `[
  {
    type: "br.cpf",
    label: "CPF",
    country: "br",
    start: 12,
    end: 26,
    confidence: 0.99,
    placeholder: "[CPF_1]"
  }
]`,
  cli: `npx privyl scan ./my-project            # pretty report
npx privyl scan ./logs --json            # JSON for CI
npx privyl scan . --fail-on-findings     # exit code 1 if anything is found
npx privyl scan . --fix                  # masked copies in ./privyl-masked
npx privyl scan . --fix --out safe       # ...or another folder
npx privyl scan . --fix --in-place       # overwrite originals (careful!)`,
  detector: `import type { Detector } from "privyl";
import { hasContextBefore } from "privyl";

const employeeId: Detector = {
  id: "acme.employee-id",
  label: "Employee ID",
  token: "EMPLOYEE",          // → [EMPLOYEE_1]
  country: "global",
  pattern: /\\bEMP-\\d{6}\\b/,
  validate: (value, { text, start }) => hasContextBefore(text, start, /employee/i),
  confidence: 0.9,
};

const shield = createShield({ detectors: [...global, ...br, employeeId] });`,
  testing: `import { createFaker } from "privyl/testing";

const faker = createFaker(42); // same seed, same values
faker.cpf();     // valid check digits, linked to nobody
faker.cnpj({ alphanumeric: true });
faker.email();   // always @example.com
faker.card();    // public test card numbers only`,
};

const en: DocSection[] = [
  {
    id: "install",
    title: "Install",
    body: [
      "Privyl has no runtime dependencies and works in Node, Bun, Deno, browsers and edge runtimes.",
    ],
    code: code.install,
  },
  {
    id: "quick-start",
    title: "Quick start",
    body: [
      "Create a shield with the detectors you want, mask the text before sending it to the AI, and unmask the answer.",
    ],
    code: code.quickStart,
  },
  {
    id: "conversations",
    title: "Conversations and the vault",
    body: [
      "The vault maps placeholders to real values. Reuse the same vault across a conversation so the same value always gets the same placeholder.",
      "The vault lives in memory. Privyl never sends it anywhere and never writes it to disk. If you store it, remember it contains the real data.",
    ],
    code: code.conversation,
  },
  {
    id: "unmask",
    title: "Unmasking AI answers",
    body: [
      "Models sometimes change placeholders a little. `unmask` accepts common variations and leaves unknown placeholders untouched.",
    ],
    code: code.unmask,
  },
  {
    id: "adapters",
    title: "Use with AI SDKs",
    body: [
      "Wrap the client you already use. Personal data in the request becomes placeholders, and the answer comes back with the real values. The SDKs are not dependencies of Privyl.",
      "Anthropic: `messages.create`. OpenAI (and compatible APIs): `chat.completions.create` and `responses.create`. Text, tool inputs and tool results are protected. Images, files and thinking blocks are sent unchanged.",
      "Streaming (`stream: true`) is not supported yet: the call fails instead of sending unprotected data.",
    ],
    code: code.adapters,
  },
  {
    id: "proxy",
    title: "Proxy (any language)",
    body: [
      "For Python, Go, Ruby or any other language: run the proxy and set the SDK base URL. It masks the request, forwards it and restores the answer.",
      "Protected: Anthropic `/v1/messages`, OpenAI (or compatible) `/v1/chat/completions` and `/v1/responses`. A request with a body to any other endpoint is refused instead of being sent unmasked, and so is streaming.",
      "It listens on `127.0.0.1` by default and writes nothing to disk. The log shows only types and counts, never values. Your API key goes from your app to the provider; the proxy does not store it.",
    ],
    code: code.proxy,
  },
  {
    id: "findings",
    title: "Findings (safe to log)",
    body: [
      "`mask` also returns `findings`: type, position and confidence of each detection. They never contain the real value.",
    ],
    code: code.findings,
  },
  {
    id: "cli",
    title: "CLI: privyl scan",
    body: [
      "Scan a folder to see how much personal data it could send to an AI. Values are always shown partly hidden.",
      "Scanned: `.log .json .jsonl .csv .ts .js .md .env` and `.env.*`. Skipped: `node_modules`, `.git`, `dist`, binary files and files over 10 MB.",
    ],
    code: code.cli,
  },
  {
    id: "countries",
    title: "Countries",
    body: [
      "Each country is its own import, so you only load what you need. Check digits are validated wherever the document has them (CPF, CNPJ, CNH, NIF, CUIT, CURP, RFC, RUT and more).",
      "Formats that are just a few digits (a DNI, a NISS, a CPF without dots) need a context word nearby, like `DNI` or `CPF`. This avoids masking order numbers and invoices.",
    ],
    code: code.countries,
  },
  {
    id: "custom-detectors",
    title: "Custom detectors",
    body: [
      "A detector is a plain object: a regular expression to find candidates, an optional `validate` (check digits, context words) and a `confidence` used to resolve overlaps.",
      "To add a whole country, see CONTRIBUTING.md on GitHub.",
    ],
    code: code.detector,
  },
  {
    id: "testing",
    title: "Fake test data",
    body: [
      "Never use real personal data in tests. `privyl/testing` generates format-valid fake data.",
    ],
    code: code.testing,
  },
  {
    id: "limits",
    title: "Limitations",
    body: [
      "Privyl reduces the risk of sending personal data to AI. It does not guarantee that everything is detected, and it does not make you compliant with LGPD or GDPR by itself.",
      "Not detected yet: names, street addresses, dates of birth, RG, data inside images or PDFs, and encoded data (base64, URL encoding).",
      "Check digits make false positives rare, but a random number can still match by chance (about 1 in 100 for CPF). Ambiguous formats need nearby context words.",
    ],
  },
];

const pt: DocSection[] = [
  {
    id: "install",
    title: "Instalação",
    body: ["O Privyl não tem dependências e funciona em Node, Bun, Deno, navegadores e edge."],
    code: code.install,
  },
  {
    id: "quick-start",
    title: "Começo rápido",
    body: [
      "Crie um escudo com os detectores que quiser, mascare o texto antes de enviar para a IA e restaure a resposta.",
    ],
    code: code.quickStart,
  },
  {
    id: "conversations",
    title: "Conversas e o vault",
    body: [
      "O vault liga cada substituto ao valor real. Reaproveite o mesmo vault durante a conversa para que o mesmo valor receba sempre o mesmo substituto.",
      "O vault fica na memória. O Privyl nunca envia nem grava o vault. Se você salvar, lembre que ele contém os dados reais.",
    ],
    code: code.conversation,
  },
  {
    id: "unmask",
    title: "Restaurando respostas da IA",
    body: [
      "Às vezes o modelo muda um pouco o substituto. O `unmask` aceita as variações comuns e não mexe em substitutos desconhecidos.",
    ],
    code: code.unmask,
  },
  {
    id: "adapters",
    title: "Usar com SDKs de IA",
    body: [
      "Envolva o cliente que você já usa. Os dados pessoais da requisição viram substitutos e a resposta volta com os valores reais. Os SDKs não são dependências do Privyl.",
      "Anthropic: `messages.create`. OpenAI (e APIs compatíveis): `chat.completions.create` e `responses.create`. Textos, entradas e resultados de ferramentas são protegidos. Imagens, arquivos e blocos de raciocínio (thinking) vão sem alteração.",
      "Streaming (`stream: true`) ainda não é suportado: a chamada falha em vez de enviar dados sem proteção.",
    ],
    code: code.adapters,
  },
  {
    id: "proxy",
    title: "Proxy (qualquer linguagem)",
    body: [
      "Para Python, Go, Ruby ou qualquer outra linguagem: rode o proxy e mude a URL base do SDK. Ele mascara a requisição, repassa e restaura a resposta.",
      "Protegidos: Anthropic `/v1/messages`, OpenAI (ou compatível) `/v1/chat/completions` e `/v1/responses`. Uma requisição com corpo para qualquer outro endpoint é recusada em vez de ir sem máscara, e o mesmo vale para streaming.",
      "Por padrão ele escuta em `127.0.0.1` e não grava nada em disco. O log mostra só tipos e quantidades, nunca valores. Sua chave de API vai do seu app para o provedor; o proxy não a guarda.",
    ],
    code: code.proxy,
  },
  {
    id: "findings",
    title: "Findings (seguros para log)",
    body: [
      "O `mask` também devolve `findings`: tipo, posição e confiança de cada detecção. Eles nunca contêm o valor real.",
    ],
    code: code.findings,
  },
  {
    id: "cli",
    title: "CLI: privyl scan",
    body: [
      "Analise uma pasta para ver quantos dados pessoais ela poderia enviar para a IA. Os valores sempre aparecem parcialmente ocultos.",
      "Analisa: `.log .json .jsonl .csv .ts .js .md .env` e `.env.*`. Ignora: `node_modules`, `.git`, `dist`, binários e arquivos acima de 10 MB.",
    ],
    code: code.cli,
  },
  {
    id: "countries",
    title: "Países",
    body: [
      "Cada país é um import separado, então você só carrega o que precisa. O dígito verificador é validado sempre que o documento tem um (CPF, CNPJ, CNH, NIF, CUIT, CURP, RFC, RUT e outros).",
      "Formatos que são só alguns dígitos (DNI, NISS, CPF sem pontos) precisam de uma palavra de contexto por perto, como `DNI` ou `CPF`. Isso evita mascarar números de pedido e notas fiscais.",
    ],
    code: code.countries,
  },
  {
    id: "custom-detectors",
    title: "Detectores próprios",
    body: [
      "Um detector é um objeto simples: uma expressão regular para achar candidatos, um `validate` opcional (dígito verificador, palavras de contexto) e uma `confidence` usada nas sobreposições.",
      "Para adicionar um país inteiro, veja o CONTRIBUTING.md no GitHub.",
    ],
    code: code.detector,
  },
  {
    id: "testing",
    title: "Dados falsos para testes",
    body: [
      "Nunca use dados pessoais reais em testes. O `privyl/testing` gera dados falsos com formato válido.",
    ],
    code: code.testing,
  },
  {
    id: "limits",
    title: "Limitações",
    body: [
      "O Privyl reduz o risco de enviar dados pessoais para a IA. Ele não garante que tudo seja detectado e, sozinho, não torna ninguém adequado à LGPD ou ao GDPR.",
      "Ainda não detectado: nomes, endereços, datas de nascimento, RG, dados dentro de imagens ou PDFs e dados codificados (base64, URL encoding).",
      "O dígito verificador torna falsos positivos raros, mas um número aleatório ainda pode coincidir (cerca de 1 em 100 para CPF). Formatos ambíguos precisam de palavras de contexto por perto.",
    ],
  },
];

export const getDocs = (lang: Locale): DocSection[] => (lang === "pt" ? pt : en);
