// The benchmark dataset: fictional texts with every piece of personal data marked by hand.
//
// The labels come from the templates below, never from the library. If they came from Privyl,
// Privyl would always score 100% and the benchmark would prove nothing.
//
// Everything is fake: emails at example.com, IPs from documentation ranges, public test cards,
// fictional phone ranges and CPF/CNPJ/CNH with random digits. The same seed always gives the
// same dataset, so anyone can reproduce the numbers.

import { createFaker, type Faker } from "../packages/privyl/src/testing/index.js";

/** Types of personal data. They match the `token` of the detectors. */
export const ENTITY_TYPES = [
  "EMAIL",
  "PHONE",
  "CARD",
  "IP",
  "SECRET",
  "CPF",
  "CNPJ",
  "PIX",
  "CEP",
  "CNH",
  "PLATE",
  // Portugal
  "NIF",
  "CC",
  "NISS",
  // Argentina
  "CUIT",
  "DNI",
  // United States
  "SSN",
  "ITIN",
  // Mexico
  "CURP",
  "RFC",
  // Chile
  "RUT",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface Entity {
  type: EntityType;
  start: number;
  end: number;
}

export interface BenchmarkRecord {
  id: string;
  /** Where this kind of text comes from (support chat, server log, code...). */
  category: string;
  text: string;
  /** Personal data inside `text`. Empty for "clean" records (only traps). */
  entities: Entity[];
}

/** A slot fills one `{name}` in a template. `type` is set when the value is personal data. */
type Slot = (f: Faker) => { value: string; type?: EntityType };

const pii =
  (type: EntityType, make: (f: Faker) => string): Slot =>
  (f) => ({ value: make(f), type });
const trap =
  (make: (f: Faker) => string): Slot =>
  (f) => ({ value: make(f) });

const digits = (f: Faker, n: number) => Array.from({ length: n }, () => f.int(0, 9)).join("");
const hex = (f: Faker, n: number) =>
  Array.from({ length: n }, () => f.int(0, 15).toString(16)).join("");
const upper = (f: Faker, n: number) =>
  Array.from({ length: n }, () => String.fromCharCode(65 + f.int(0, 25))).join("");
const b64url = (s: string) => btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

/** Changes the last digit, so the check digit no longer matches. */
const breakCheckDigit = (value: string) =>
  value.slice(0, -1) + String((Number(value.at(-1)) + 1) % 10);

const SLOTS: Record<string, Slot> = {
  // ---- personal data ----
  email: pii("EMAIL", (f) => f.email()),
  // Accented emails are valid, but Privyl does not detect them yet (known gap).
  emailAccent: pii(
    "EMAIL",
    (f) => `${f.pick(["joão", "andré", "inês", "conceição"])}.${f.int(1, 99)}@example.com`,
  ),
  cpf: pii("CPF", (f) => f.cpf()),
  cpfDigits: pii("CPF", (f) => f.cpf({ formatted: false })),
  cnpj: pii("CNPJ", (f) => f.cnpj()),
  cnpjDigits: pii("CNPJ", (f) => f.cnpj({ formatted: false })),
  cnpjAlpha: pii("CNPJ", (f) => f.cnpj({ alphanumeric: true })),
  phoneBr: pii("PHONE", (f) => f.phoneBr()),
  phoneBrIntl: pii("PHONE", (f) => f.phoneBr({ international: true })),
  phoneBrLandline: pii("PHONE", (f) => f.phoneBr({ mobile: false })),
  phoneBrDigits: pii("PHONE", (f) => f.phoneBr().replace(/\D/g, "")),
  // Fictional ranges: US 555-01xx and UK 020 7946 0xxx are reserved for films and examples.
  phoneUs: pii("PHONE", (f) => `+1 202 555 01${digits(f, 2)}`),
  phoneUk: pii("PHONE", (f) => `+44 20 7946 0${digits(f, 3)}`),
  card: pii("CARD", (f) => f.card()),
  cardDigits: pii("CARD", (f) => f.card().replace(/\D/g, "")),
  ipv4: pii("IP", (f) => f.ipv4()),
  // 2001:db8::/32 is the IPv6 range reserved for documentation.
  ipv6: pii("IP", (f) => `2001:db8::${hex(f, 4)}:${hex(f, 4)}`),
  pix: pii("PIX", (f) => f.pixKey()),
  cep: pii("CEP", (f) => f.cep()),
  cnh: pii("CNH", (f) => f.cnh()),
  plate: pii("PLATE", (f) => f.plate()),
  plateOld: pii("PLATE", (f) => f.plate({ mercosul: false })),
  // AWS's own documentation example key: never a real credential.
  awsKey: pii("SECRET", () => "AKIAIOSFODNN7EXAMPLE"),
  password: pii("SECRET", (f) => `Fake${upper(f, 3)}${digits(f, 4)}!x`),
  jwt: pii(
    "SECRET",
    (f) =>
      `${b64url('{"alg":"HS256","typ":"JWT"}')}.${b64url(`{"sub":"fake-${digits(f, 6)}"}`)}.${hex(f, 32)}`,
  ),

  // Spaces instead of dots: still a CPF, but Privyl does not detect it (known gap).
  cpfSpaced: pii("CPF", (f) => f.cpf().replace(/[.-]/g, " ")),
  // Written to fool scrapers: still an email, not detected (known gap).
  emailAt: pii("EMAIL", (f) => f.email().replace("@", " [at] ")),
  // ---- other countries ----
  nif: pii("NIF", (f) => f.nif()),
  nifSpaced: pii("NIF", (f) => f.nif({ formatted: true })),
  citizenCard: pii("CC", (f) => f.citizenCard()),
  niss: pii("NISS", (f) => f.niss()),
  cuit: pii("CUIT", (f) => f.cuit()),
  cuitDigits: pii("CUIT", (f) => f.cuit({ formatted: false })),
  dni: pii("DNI", (f) => f.dni()),
  ssn: pii("SSN", (f) => f.ssn()),
  ssnDigits: pii("SSN", (f) => f.ssn().replace(/-/g, "")),
  itin: pii("ITIN", (f) => f.itin()),
  curp: pii("CURP", (f) => f.curp()),
  rfc: pii("RFC", (f) => f.rfc()),
  rfcCompany: pii("RFC", (f) => f.rfc({ company: true })),
  rut: pii("RUT", (f) => f.rut()),
  rutPlain: pii("RUT", (f) => f.rut({ dots: false })),

  // Added in 0.3.0
  emailPlus: pii("EMAIL", (f) => f.email().replace("@", "+loja@")),
  phoneBrSpaced9: pii("PHONE", (f) => f.phoneBr().replace(/\) 9/, ") 9 ")),
  phoneBrEnDash: pii("PHONE", (f) => f.phoneBr().replace("-", "\u2013")),
  cpfNbsp: pii("CPF", (f) => f.cpf().replace(/[.-]/g, "\u00a0")),
  // Fictional ranges again: PT mobile numbers without "+", US 555-01xx without "+".
  phonePtLocal: pii("PHONE", (f) => `912 ${digits(f, 3)} ${digits(f, 3)}`),
  phoneUsLocal: pii("PHONE", (f) => `(202) 555-01${digits(f, 2)}`),
  curpLower: pii("CURP", (f) => f.curp().toLowerCase()),
  rutPlainNoContext: pii("RUT", (f) => f.rut({ dots: false })),

  // ---- traps: look like personal data, but are not ----
  orderId: trap((f) => `${f.int(1, 9)}${digits(f, 10)}`),
  invoice: trap((f) => `${f.int(1, 9)}${digits(f, 13)}`),
  cpfBadDigit: trap((f) => breakCheckDigit(f.cpf())),
  cnpjBadDigit: trap((f) => breakCheckDigit(f.cnpj())),
  cardBadLuhn: trap((f) => breakCheckDigit(f.card())),
  uuid: trap((f) => `${hex(f, 8)}-${hex(f, 4)}-4${hex(f, 3)}-a${hex(f, 3)}-${hex(f, 12)}`),
  date: trap((f) => `${f.int(10, 28)}/${f.int(10, 12)}/20${f.int(20, 26)}`),
  time: trap((f) => `${f.int(10, 23)}:${f.int(10, 59)}:${f.int(10, 59)}`),
  money: trap((f) => `R$ ${f.int(1, 9)}.${digits(f, 3)},${digits(f, 2)}`),
  version4: trap((f) => `${f.int(1, 9)}.${f.int(0, 20)}.${f.int(0, 9)}.${f.int(100, 999)}`),
  semver: trap((f) => `${f.int(1, 9)}.${f.int(0, 20)}.${f.int(0, 9)}`),
  sku: trap((f) => `${upper(f, 3)}-${digits(f, 4)}`),
  lot: trap((f) => `${digits(f, 5)}-${digits(f, 3)}`),
  localhost: trap(() => "127.0.0.1"),
  placeholder: trap((f) => `[${f.pick(["CPF", "EMAIL", "PHONE"])}_${f.int(1, 9)}]`),
  envRef: trap(() => "process.env.DB_PASSWORD"),
  shortNumber: trap((f) => digits(f, 6)),
  protocol: trap((f) => `${digits(f, 5)}-${digits(f, 3)}`),
  nineDigits: trap((f) => `${f.int(1, 9)}${digits(f, 8)}`),
  // Part numbers shaped like an SSN (3-2-4). Some pass the SSN rules by chance.
  partNumber: trap((f) => `${digits(f, 3)}-${digits(f, 2)}-${digits(f, 4)}`),
  cuitBadDigit: trap((f) => breakCheckDigit(f.cuit())),
  rfcGeneric: trap((f) => f.pick(["XAXX010101000", "XEXX010101000"])),
  rutNoContext: trap((f) => f.rut({ dots: false })),
  // Added in 0.3.0
  boleto: trap(
    (f) =>
      `${digits(f, 5)}.${digits(f, 5)} ${digits(f, 5)}.${digits(f, 6)} ${digits(f, 5)}.${digits(f, 6)} ${f.int(1, 9)} ${digits(f, 14)}`,
  ),
  coordinates: trap((f) => `-23.${digits(f, 4)}, -46.${digits(f, 4)}`),
  isbn: trap((f) => `978-85-${digits(f, 3)}-${digits(f, 4)}-${f.int(0, 9)}`),
  lawsuit: trap((f) => `${digits(f, 7)}-${digits(f, 2)}.20${f.int(10, 26)}.8.26.${digits(f, 4)}`),
  coupon: trap((f) => f.plate()), // a coupon code that happens to look like a Mercosul plate
  isoDate: trap((f) => `20${f.int(10, 26)}-${f.int(10, 12)}-${f.int(10, 28)}`),
  mac: trap((f) => Array.from({ length: 6 }, () => hex(f, 2).toUpperCase()).join(":")),
  serial: trap((f) => `SN-${digits(f, 4)}-${digits(f, 4)}-${digits(f, 4)}`),
  usd: trap((f) => `US$ ${f.int(1, 9)},${digits(f, 3)},${digits(f, 3)}.${digits(f, 2)}`),
};

interface Template {
  category: string;
  text: string;
}

// {slot} = a value from SLOTS. Templates are in Portuguese and English, like real projects.
const TEMPLATES: Template[] = [
  // Support chat
  { category: "chat", text: "Oi, sou cliente. Meu CPF é {cpf} e meu e-mail é {email}." },
  { category: "chat", text: "Hi! My card {card} was declined, please call me at {phoneUs}." },
  { category: "chat", text: "Pode me ligar no {phoneBr}? Meu CPF: {cpfDigits}" },
  { category: "chat", text: "Paguei pela chave Pix {pix} e ainda não caiu." },
  { category: "chat", text: "Meu WhatsApp é {phoneBrDigits}, pode chamar a qualquer hora." },
  { category: "chat", text: "Moro no CEP {cep}, entrega para {email} por favor." },
  { category: "chat", text: "Sou da empresa CNPJ {cnpj}, contato {phoneBrLandline}." },
  { category: "chat", text: "Meu número da CNH é {cnh}, venceu mês passado." },
  { category: "chat", text: "O carro de placa {plate} foi multado no pedido {orderId}." },
  { category: "chat", text: "Hello, reach me on {phoneUk} or {email}." },
  // Known gaps, kept on purpose so the numbers are honest
  { category: "chat", text: "Carteira de motorista número {cnh}, categoria B." },
  { category: "chat", text: "Me chama no {phoneBrDigits} depois das 18h." },
  { category: "form", text: "E-mail de contato: {emailAccent}" },
  // Forms and CRM exports
  { category: "form", text: "nome=Cliente Teste;cpf={cpfDigits};email={email};cep={cep}" },
  { category: "form", text: "Empresa: CNPJ {cnpjDigits} | Telefone: {phoneBrIntl}" },
  { category: "form", text: "Fornecedor CNPJ {cnpjAlpha}, e-mail {email}" },
  { category: "form", text: "Veículo placa {plateOld}, habilitação {cnh}" },
  { category: "form", text: "Cartão: {cardDigits}, validade 12/29" },
  // Server logs
  { category: "log", text: "{time} INFO login ok user={email} ip={ipv4}" },
  { category: "log", text: "{time} WARN payment declined card={card} order={orderId}" },
  { category: "log", text: "{time} ERROR request from {ipv6} failed, request_id={uuid}" },
  { category: "log", text: "{time} INFO app version {version4} started on {localhost}" },
  { category: "log", text: "{time} DEBUG cpf={cpf} amount={money}" },
  // Code and config
  { category: "code", text: "AWS_ACCESS_KEY_ID={awsKey}" },
  { category: "code", text: 'const db = { user: "app", password: "{password}" };' },
  { category: "code", text: "Authorization: Bearer {jwt}" },
  { category: "code", text: "DB_PASSWORD={envRef}" },
  { category: "code", text: 'const support = "{email}"; // version {semver}' },
  // Clean texts: only traps, nothing should be detected
  { category: "trap", text: "Pedido {orderId} enviado em {date} às {time}." },
  { category: "trap", text: "Nota fiscal {invoice} no valor de {money}." },
  { category: "trap", text: "CPF digitado errado: {cpfBadDigit}" },
  { category: "trap", text: "CNPJ com dígito errado: {cnpjBadDigit}" },
  { category: "trap", text: "Card number with a typo: {cardBadLuhn}" },
  { category: "trap", text: "request_id={uuid} status=200 duration=35ms" },
  { category: "trap", text: "Produto {sku} em estoque, lote {lot}." },
  { category: "trap", text: "Firmware {version4} instalado, build {semver}." },
  { category: "trap", text: "Resposta da IA: obrigado, {placeholder}!" },
  { category: "trap", text: "Código de verificação {shortNumber} enviado." },

  // ---- Added in 0.2.0. New cases, written after the detectors were improved ----
  { category: "form", text: "Endereço: Rua das Flores, 100 - Recife/PE {cep}" },
  { category: "chat", text: "Meu CPF é {cpfSpaced}, pode confirmar?" },
  { category: "trap", text: "Protocolo {protocol} aberto no suporte." },
  // Known gaps: stricter rules for CEP and old plates miss them without context
  { category: "chat", text: "Deixa no {cep} por favor." },
  { category: "chat", text: "Vi o {plateOld} parado na frente." },
  { category: "chat", text: "Escreve para {emailAt} se precisar." },
  // Portugal
  { category: "chat", text: "Olá, o meu NIF é {nif} e o email {email}." },
  { category: "form", text: "Contribuinte n.º {nifSpaced}; Cartão de Cidadão {citizenCard}" },
  { category: "form", text: "NISS {niss}, inscrito na Segurança Social." },
  { category: "chat", text: "Faturar a {nif}, obrigado." },
  { category: "trap", text: "Encomenda {nineDigits} enviada." },
  // Argentina
  { category: "chat", text: "Hola, mi CUIT es {cuit} y mi DNI {dni}." },
  { category: "form", text: "CUIL {cuitDigits}; email {email}" },
  { category: "chat", text: "Documento {dni}, nacido en 1990." },
  { category: "trap", text: "CUIT con un dígito mal: {cuitBadDigit}" },
  // United States
  { category: "chat", text: "My SSN is {ssn}, email {email}." },
  { category: "form", text: "ssn={ssnDigits};itin={itin}" },
  { category: "trap", text: "Part number {partNumber} is back in stock." },
  { category: "trap", text: "Order {nineDigits} shipped." },
  // Mexico
  { category: "chat", text: "Mi CURP es {curp} y mi RFC {rfc}." },
  { category: "form", text: "Proveedor RFC {rfcCompany}, contacto {email}" },
  { category: "trap", text: "Factura al público en general, RFC {rfcGeneric}." },
  // Chile
  { category: "chat", text: "Mi RUT es {rut}, correo {email}." },
  { category: "form", text: "RUN {rutPlain}" },
  { category: "trap", text: "Lote {rutNoContext} despachado." },

  // ---- Added in 0.3.0. New cases, written before running the new version ----
  { category: "chat", text: "Meu e-mail: {emailPlus} e telefone {phoneBrSpaced9}" },
  { category: "log", text: '{"user":{"email":"{email}","cpf":"{cpfDigits}"},"ip":"{ipv4}"}' },
  { category: "form", text: "Cliente Teste;{cpfDigits};{phoneBrDigits}" },
  { category: "chat", text: "Segue meu cartão {card}, validade 08/30" },
  { category: "chat", text: "Pode ligar no {phoneBrEnDash}, CPF {cpfNbsp}" },
  { category: "chat", text: "Telemóvel {phonePtLocal}, obrigado." },
  { category: "chat", text: "Call me at {phoneUsLocal} after 5pm." },
  { category: "form", text: "curp: {curpLower}" },
  { category: "chat", text: "Cliente {rutPlainNoContext} pidió la factura." },
  { category: "trap", text: "Linha digitável: {boleto}" },
  { category: "trap", text: "Entrega perto de {coordinates}." },
  { category: "trap", text: "ISBN {isbn}, segunda edição." },
  { category: "trap", text: "Processo nº {lawsuit} em andamento." },
  { category: "trap", text: "Use o cupom {coupon} no checkout!" },
  { category: "trap", text: "Backup de {isoDate} concluído, MAC {mac}." },
  { category: "trap", text: "Equipamento {serial} em garantia." },
  { category: "trap", text: "Total: {usd}" },
];

/** How many records each template produces. */
const PER_TEMPLATE = 20;

/** Builds the dataset. Same seed → same records. */
export function buildDataset(seed = 2026): BenchmarkRecord[] {
  const f = createFaker(seed);
  const records: BenchmarkRecord[] = [];

  TEMPLATES.forEach((template, t) => {
    for (let i = 0; i < PER_TEMPLATE; i++) {
      let text = "";
      const entities: Entity[] = [];
      let cursor = 0;
      for (const m of template.text.matchAll(/\{(\w+)\}/g)) {
        text += template.text.slice(cursor, m.index);
        const slot = SLOTS[m[1] as string];
        if (!slot) throw new Error(`Unknown slot {${m[1]}} in template ${t}`);
        const { value, type } = slot(f);
        if (type) entities.push({ type, start: text.length, end: text.length + value.length });
        text += value;
        cursor = m.index + m[0].length;
      }
      text += template.text.slice(cursor);
      records.push({
        id: `${template.category}-${String(t).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
        category: template.category,
        text,
        entities,
      });
    }
  });
  return records;
}
