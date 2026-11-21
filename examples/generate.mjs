// Generates the three FICTIONAL example projects used by the website demo.
//
// Every value comes from privyl/testing: random, format-valid, linked to nobody.
// Emails use example.com, cards are public test cards, IPs are documentation ranges.
//
// Usage (from the repo root):  pnpm build && node examples/generate.mjs

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createFaker } from "../packages/privyl/dist/testing/index.js";

const root = dirname(fileURLToPath(import.meta.url));
const f = createFaker(2026);

const write = (project, path, content) => {
  const full = join(root, project, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content.endsWith("\n") ? content : content + "\n");
};

const times = (n, make) => Array.from({ length: n }, (_, i) => make(i));
const date = (i) => `2026-11-${String((i % 28) + 1).padStart(2, "0")}`;
const time = (i) =>
  `${String(8 + (i % 12)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`;

// A fake JWT (header + payload are fake base64url JSON, the signature is filler).
const fakeJwt = () =>
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbGllbnRlLWV4ZW1wbG8ifQ." +
  "ZmFrZS1zaWduYXR1cmUtZm9yLWRlbW8";

for (const project of ["online-store", "support-chatbot", "clinic"]) {
  rmSync(join(root, project), { recursive: true, force: true });
}

// ---------------------------------------------------------------- online store
{
  const customers = times(12, () => {
    const name = f.name();
    return { name, cpf: f.cpf(), email: f.email(name), phone: f.phoneBr(), cep: f.cep() };
  });

  write(
    "online-store",
    "README.md",
    `# Loja Exemplo (fictional online store)

A fake e-commerce project used by the Privyl demo. **All data is fictional.**

- \`data/customers.csv\`: customer list exported from the admin panel
- \`data/orders.jsonl\`: orders, one JSON per line
- \`logs/checkout.log\`: checkout service logs
- \`src/payment.ts\`: payment integration with a hardcoded secret (a classic mistake)
- \`.env.example\`: environment variables
`,
  );

  write(
    "online-store",
    "data/customers.csv",
    ["id,name,cpf,email,phone,cep"]
      .concat(
        customers.map((c, i) => `${1001 + i},${c.name},${c.cpf},${c.email},${c.phone},${c.cep}`),
      )
      .join("\n"),
  );

  write(
    "online-store",
    "data/orders.jsonl",
    times(15, (i) => {
      const c = customers[i % customers.length];
      const pix = i % 3 === 0;
      return JSON.stringify({
        order: `PED-${20260 + i}`,
        date: date(i),
        customer: c.email,
        document: c.cpf,
        total: Number((49.9 + i * 17.35).toFixed(2)),
        payment: pix
          ? { method: "pix", note: `Pix ${f.pixKey()}` }
          : { method: "card", number: f.card() },
        shipping: { cep: c.cep },
      });
    }).join("\n"),
  );

  write(
    "online-store",
    "logs/checkout.log",
    times(14, (i) => {
      const c = customers[(i * 5) % customers.length];
      const ts = `${date(i)}T${time(i)}Z`;
      if (i % 4 === 0) return `${ts} ERROR payment declined card=${f.card()} ip=${f.ipv4()}`;
      if (i % 4 === 1) return `${ts} INFO  order created for ${c.email} from ${f.ipv4()}`;
      if (i % 4 === 2) return `${ts} WARN  address lookup failed for CEP ${c.cep}`;
      return `${ts} DEBUG customer phone ${c.phone} verified`;
    }).join("\n"),
  );

  write(
    "online-store",
    "src/payment.ts",
    `// Payment integration (fictional).
// The secret below should live in an environment variable, not in the code.

const PAYMENT_SECRET = "loja-exemplo-segredo-2026";

export async function charge(orderId: string, amount: number) {
  return fetch("https://payments.example.com/charge", {
    method: "POST",
    headers: { Authorization: \`Bearer \${PAYMENT_SECRET}\` },
    body: JSON.stringify({ orderId, amount }),
  });
}

// Test customer used during development:
// ${customers[0].name}, CPF ${customers[0].cpf}, card ${f.card()}
`,
  );

  write(
    "online-store",
    ".env.example",
    `DATABASE_URL=postgres://loja:loja@localhost:5432/loja
DATABASE_PASSWORD=senha-dev-loja-123
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
SUPPORT_EMAIL=${f.email("suporte.loja")}
`,
  );
}

// ---------------------------------------------------------------- support chatbot
{
  const users = times(8, () => {
    const name = f.name();
    return { name, cpf: f.cpf(), email: f.email(name), phone: f.phoneBr({ international: true }) };
  });

  write(
    "support-chatbot",
    "README.md",
    `# Atende Bot (fictional support chatbot)

A fake customer support chatbot that sends every message to an AI model.
Used by the Privyl demo. **All data is fictional.**

- \`conversations/2026-11.jsonl\`: chat history sent to the AI
- \`prompts/system.md\`: system prompt
- \`logs/bot.log\`: bot logs
- \`.env.example\`: environment variables
`,
  );

  const lines = [];
  users.forEach((u, i) => {
    const id = `conv-${100 + i}`;
    const msgs = [
      ["user", `Oi, meu nome é ${u.name}. Não recebi meu pedido.`],
      ["assistant", "Claro! Pode me informar seu CPF para eu localizar o pedido?"],
      ["user", i % 2 ? `É ${u.cpf}` : `CPF ${u.cpf.replace(/\D/g, "")}, e-mail ${u.email}`],
      ["assistant", "Obrigado! Encontrei o pedido. Posso te ligar para confirmar o endereço?"],
      [
        "user",
        i % 3 === 0
          ? `Pode sim, meu WhatsApp é ${u.phone}. Se precisar de reembolso, minha chave Pix é ${f.pixKey()}`
          : `Pode, ${u.phone}. Meu CEP é ${f.cep()}.`,
      ],
    ];
    if (i % 4 === 1) msgs.push(["user", `Paguei com o cartão ${f.card()}, pode conferir?`]);
    for (const [role, content] of msgs)
      lines.push(JSON.stringify({ conversation: id, role, content }));
  });
  write("support-chatbot", "conversations/2026-11.jsonl", lines.join("\n"));

  write(
    "support-chatbot",
    "prompts/system.md",
    `# System prompt

You are the support assistant of Atende Exemplo LTDA (CNPJ ${f.cnpj()}).
Be polite, answer in Portuguese, and escalate refunds to a human.

For escalations, email ${f.email("escalacao")} or call ${f.phoneBr({ mobile: false })}.
`,
  );

  write(
    "support-chatbot",
    "logs/bot.log",
    times(12, (i) => {
      const u = users[i % users.length];
      const ts = `${date(i)} ${time(i)}`;
      if (i % 3 === 0) return `[${ts}] session start ip=${f.ipv4()} user=${u.email}`;
      if (i % 3 === 1)
        return `[${ts}] sent to model: "${u.name} CPF ${u.cpf} asked about delivery"`;
      return `[${ts}] auth ok token=${fakeJwt()}`;
    }).join("\n"),
  );

  write(
    "support-chatbot",
    ".env.example",
    `MODEL_PROVIDER=anthropic
AI_API_KEY=coloque-sua-chave-aqui-123
WEBHOOK_SECRET=atende-bot-webhook-2026
`,
  );
}

// ---------------------------------------------------------------- clinic
{
  const patients = times(10, (i) => {
    const name = f.name();
    return {
      name,
      cpf: f.cpf(),
      birth: `19${50 + ((i * 7) % 50)}-0${(i % 9) + 1}-1${i % 9}`,
      phone: f.phoneBr(),
      email: f.email(name),
      cep: f.cep(),
    };
  });

  write(
    "clinic",
    "README.md",
    `# Clínica Exemplo (fictional clinic)

A fake clinic system that uses AI to summarize appointments.
Used by the Privyl demo. **All data is fictional.**

- \`data/patients.csv\`: patient registry
- \`data/appointments.json\`: appointments
- \`notes/summaries.md\`: appointment notes sent to the AI for summaries
- \`logs/access.log\`: access logs

Note: names and birth dates are **not** detected by Privyl yet. They are here on purpose, to show
what is and is not covered.
`,
  );

  write(
    "clinic",
    "data/patients.csv",
    ["name,cpf,birth_date,phone,email,cep"]
      .concat(patients.map((p) => `${p.name},${p.cpf},${p.birth},${p.phone},${p.email},${p.cep}`))
      .join("\n"),
  );

  write(
    "clinic",
    "data/appointments.json",
    JSON.stringify(
      times(8, (i) => {
        const p = patients[i % patients.length];
        return {
          id: `CONS-${3000 + i}`,
          date: date(i * 3),
          patient: { name: p.name, cpf: p.cpf },
          contact: p.phone,
          parking: i % 2 ? { plate: f.plate() } : undefined,
          insurance: { company_cnpj: f.cnpj() },
        };
      }),
      null,
      2,
    ),
  );

  write(
    "clinic",
    "notes/summaries.md",
    patients
      .slice(0, 5)
      .map(
        (p, i) => `## Consulta ${i + 1}

Paciente ${p.name}, CPF ${p.cpf}, retornou para acompanhamento. Contato: ${p.phone}.
${i % 2 ? `Apresentou CNH ${f.cnh()} para cadastro do estacionamento, placa ${f.plate({ mercosul: false })}.` : `Mora no CEP ${p.cep} e prefere receber resultados em ${p.email}.`}
`,
      )
      .join("\n"),
  );

  write(
    "clinic",
    "logs/access.log",
    times(10, (i) => {
      const p = patients[i % patients.length];
      return `${f.ipv4()} - - [${date(i)} ${time(i)}] "GET /patients?email=${p.email} HTTP/1.1" 200`;
    }).join("\n"),
  );

  write(
    "clinic",
    ".env.example",
    `DB_PASSWORD=clinica-dev-senha-456
SMTP_PASSWORD=smtp-exemplo-789xyz
`,
  );
}

console.log("Examples generated.");
