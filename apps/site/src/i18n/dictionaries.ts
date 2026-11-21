// All site text, in English and Portuguese. Add a key to `en` first; TypeScript then
// makes sure `pt` has it too.

export const locales = ["en", "pt"] as const;
export type Locale = (typeof locales)[number];

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const en = {
  meta: {
    title: "Privyl — Use any AI. Keep your data private.",
    description:
      "Open-source privacy layer for AI. Mask personal data before it reaches any LLM, restore it after. Great with Brazilian documents.",
  },
  nav: {
    docs: "Docs",
    playground: "Playground",
    benchmark: "Benchmark",
    github: "GitHub",
    stars: "stars on GitHub",
    language: "Português",
    languageLabel: "Ler em português",
    skip: "Skip to content",
    menu: "Main navigation",
  },
  hero: {
    badge: "Open source · MIT · zero dependencies",
    title1: "Use any AI.",
    title2: "Keep your data private.",
    subtitle:
      "Privyl masks personal data before your text reaches Claude, GPT, Gemini or any model, and puts it back in the answer. Everything runs on your machine.",
    copy: "Copy",
    copied: "Copied",
    getStarted: "Get started",
    github: "GitHub",
    facts: ["3 lines of code", "No network calls", "Built for Brazilian documents"],
  },
  demo: {
    kicker: "Live demo",
    title: "How much personal data is your project sending to AI?",
    subtitle:
      "This is the real Privyl library scanning three fictional projects, right here in your browser.",
    projects: {
      "online-store": "Online store",
      "support-chatbot": "Support chatbot",
      clinic: "Clinic",
    } as Record<string, string>,
    files: "Files",
    found: "found",
    replay: "Run again",
    notice: "All data is fictional. Nothing is sent to a server.",
    totals: {
      total: "Total findings",
      cpf: "CPFs",
      email: "Emails",
      card: "Cards",
      secret: "Secrets",
    },
  },
  drop: {
    title: "Try it with your own files",
    subtitle:
      "Drop text files here. They are read and scanned by your browser: nothing is uploaded.",
    cta: "Choose files",
    hint: "or drag and drop .log .json .csv .md .txt .env…",
    privacy: "Processed locally · no upload",
    results: "Results",
    none: "No personal data found.",
    skipped: "skipped (binary or larger than 5 MB)",
    clear: "Clear",
    inFiles: "in",
    files: "file(s)",
  },
  beforeAfter: {
    title: "Before and after",
    subtitle: "What the AI would see, and what it sees with Privyl.",
    before: "Without Privyl",
    after: "With Privyl",
    sample:
      "Hi, I'm Ana. My CPF is 529.982.247-25 and my card 4111 1111 1111 1111 was declined. Call me at +55 11 98765-4321 or ana@example.com.",
  },
  how: {
    title: "How it works",
    steps: [
      {
        title: "Mask",
        body: "Privyl finds personal data and swaps it for placeholders like [CPF_1]. The real values stay in a vault on your machine.",
      },
      {
        title: "Ask the AI",
        body: "Send the masked text to any model. It can still reason about the request, without ever seeing the data.",
      },
      {
        title: "Unmask",
        body: "Privyl puts the real values back in the answer, even if the AI wrote the placeholder a little differently.",
      },
    ],
  },
  anywhere: {
    title: "Works with any AI, anywhere",
    subtitle: "Plain text in, plain text out. No SDK lock-in, no runtime dependencies.",
    ai: "AI models",
    runtimes: "Runtimes",
    localModels: "Local models",
    browsers: "Browsers",
    edge: "Edge",
  },
  coverage: {
    title: "Coverage by country",
    subtitle: "Detectors are plugins per country. Brazil first, more on the way.",
    country: "Country",
    data: "What is detected",
    global: "Global",
    br: "Brazil",
    addCountry: "Add your country",
    secrets: "API keys & secrets",
    notDetectedTitle: "Not detected yet",
    notDetected:
      "Names, street addresses and dates of birth (they need a language model), RG, data inside images or PDFs, and encoded data.",
  },
  trust: {
    title: "Open source. Prove it, don't promise it.",
    items: [
      { title: "MIT license", body: "Read every line, fork it, use it at work." },
      { title: "No network calls", body: "The library never talks to the internet." },
      { title: "Tested on every commit", body: "True and false positive tests for each detector." },
      { title: "Zero dependencies", body: "Runs in Node, Bun, Deno, browsers and edge." },
    ],
    source: "Source code",
    security: "Security policy",
    benchmark: "Benchmark",
    disclaimer:
      "Privyl reduces the risk of sending personal data to AI. No tool detects everything: check what is and is not covered.",
  },
  footer: {
    tagline: "Use any AI. Keep your data private.",
    license: "MIT License",
  },
  playground: {
    title: "Playground",
    subtitle: "Type anything. Masking and unmasking happen live, in your browser.",
    input: "Your text",
    masked: "What the AI receives",
    vault: "Vault (stays on your machine)",
    placeholder: "Placeholder",
    value: "Real value",
    empty: "Nothing detected yet.",
    response: "AI response (edit it)",
    restored: "Restored response",
    detectors: "Detectors",
    sample:
      "Olá! Sou o Bruno, CPF 529.982.247-25, empresa 11.222.333/0001-81.\nMeu WhatsApp é (11) 98765-4321 e meu e-mail bruno@example.com.\nChave Pix: 3f2b9a4e-1c7d-4e8a-9b6f-2d4c8e1a7b3c\nCEP 01310-100, placa BRA2E19.\nDB_PASSWORD=s3cr3tPass99",
    response1:
      "Thanks, [cpf_1]! I updated the record for [CNPJ_1] and will send the receipt to [EMAIL 1]. We'll call [PHONE_1] tomorrow.",
    notice: "Nothing you type leaves this page.",
  },
  benchmark: {
    title: "Benchmark",
    soon: "Coming soon",
    body: "An open dataset of fictional texts, with precision and recall for every detector, so anyone can check our numbers and compare tools.",
    follow: "Follow the project on GitHub",
  },
  docs: {
    title: "Documentation",
    toc: "On this page",
  },
};

export type Dictionary = typeof en;

const pt: Dictionary = {
  meta: {
    title: "Privyl — Use qualquer IA. Seus dados continuam seus.",
    description:
      "Camada de privacidade open source para IA. Esconde dados pessoais antes de chegarem a qualquer LLM e devolve depois. Excelente com documentos brasileiros.",
  },
  nav: {
    docs: "Docs",
    playground: "Playground",
    benchmark: "Benchmark",
    github: "GitHub",
    stars: "estrelas no GitHub",
    language: "English",
    languageLabel: "Read in English",
    skip: "Pular para o conteúdo",
    menu: "Navegação principal",
  },
  hero: {
    badge: "Open source · MIT · zero dependências",
    title1: "Use qualquer IA.",
    title2: "Seus dados continuam seus.",
    subtitle:
      "O Privyl esconde dados pessoais antes de o texto chegar ao Claude, GPT, Gemini ou qualquer modelo, e devolve os dados reais na resposta. Tudo roda na sua máquina.",
    copy: "Copiar",
    copied: "Copiado",
    getStarted: "Começar",
    github: "GitHub",
    facts: ["3 linhas de código", "Nenhuma chamada de rede", "Feito para documentos brasileiros"],
  },
  demo: {
    kicker: "Demo ao vivo",
    title: "Quantos dados pessoais o seu projeto está enviando para a IA?",
    subtitle:
      "Esta é a biblioteca Privyl de verdade analisando três projetos fictícios, aqui mesmo no seu navegador.",
    projects: {
      "online-store": "Loja online",
      "support-chatbot": "Chatbot de suporte",
      clinic: "Clínica",
    },
    files: "Arquivos",
    found: "encontrados",
    replay: "Rodar de novo",
    notice: "Todos os dados são fictícios. Nada é enviado para servidor.",
    totals: {
      total: "Total encontrado",
      cpf: "CPFs",
      email: "E-mails",
      card: "Cartões",
      secret: "Segredos",
    },
  },
  drop: {
    title: "Teste com seus arquivos",
    subtitle:
      "Solte arquivos de texto aqui. Eles são lidos e analisados pelo seu navegador: nada é enviado.",
    cta: "Escolher arquivos",
    hint: "ou arraste .log .json .csv .md .txt .env…",
    privacy: "Processado localmente · sem upload",
    results: "Resultado",
    none: "Nenhum dado pessoal encontrado.",
    skipped: "ignorado (binário ou maior que 5 MB)",
    clear: "Limpar",
    inFiles: "em",
    files: "arquivo(s)",
  },
  beforeAfter: {
    title: "Antes e depois",
    subtitle: "O que a IA veria, e o que ela vê com o Privyl.",
    before: "Sem Privyl",
    after: "Com Privyl",
    sample:
      "Oi, sou a Ana. Meu CPF é 529.982.247-25 e meu cartão 4111 1111 1111 1111 foi recusado. Me liga no (11) 98765-4321 ou ana@example.com.",
  },
  how: {
    title: "Como funciona",
    steps: [
      {
        title: "Mascarar",
        body: "O Privyl encontra dados pessoais e troca por substitutos como [CPF_1]. Os valores reais ficam num vault na sua máquina.",
      },
      {
        title: "Perguntar à IA",
        body: "Envie o texto protegido para qualquer modelo. Ele entende o pedido sem nunca ver os dados.",
      },
      {
        title: "Restaurar",
        body: "O Privyl coloca os valores reais de volta na resposta, mesmo se a IA escrever o substituto um pouco diferente.",
      },
    ],
  },
  anywhere: {
    title: "Funciona com qualquer IA, em qualquer lugar",
    subtitle: "Entra texto, sai texto. Sem prender você a um SDK, sem dependências.",
    ai: "Modelos de IA",
    runtimes: "Ambientes",
    localModels: "Modelos locais",
    browsers: "Navegadores",
    edge: "Edge",
  },
  coverage: {
    title: "Cobertura por país",
    subtitle: "Os detectores são plugins por país. Brasil primeiro, outros a caminho.",
    country: "País",
    data: "O que é detectado",
    global: "Global",
    br: "Brasil",
    addCountry: "Adicione seu país",
    secrets: "Chaves de API e segredos",
    notDetectedTitle: "Ainda não detectado",
    notDetected:
      "Nomes, endereços e datas de nascimento (precisam de um modelo de linguagem), RG, dados dentro de imagens ou PDFs e dados codificados.",
  },
  trust: {
    title: "Open source. Provar, não prometer.",
    items: [
      { title: "Licença MIT", body: "Leia cada linha, faça fork, use no trabalho." },
      { title: "Sem chamadas de rede", body: "A biblioteca nunca fala com a internet." },
      {
        title: "Testado a cada commit",
        body: "Testes de acertos e de falsos positivos por detector.",
      },
      { title: "Zero dependências", body: "Roda em Node, Bun, Deno, navegadores e edge." },
    ],
    source: "Código-fonte",
    security: "Política de segurança",
    benchmark: "Benchmark",
    disclaimer:
      "O Privyl reduz o risco de enviar dados pessoais para a IA. Nenhuma ferramenta detecta tudo: veja o que é e o que não é coberto.",
  },
  footer: {
    tagline: "Use qualquer IA. Seus dados continuam seus.",
    license: "Licença MIT",
  },
  playground: {
    title: "Playground",
    subtitle: "Digite qualquer coisa. Mascarar e restaurar acontece ao vivo, no seu navegador.",
    input: "Seu texto",
    masked: "O que a IA recebe",
    vault: "Vault (fica na sua máquina)",
    placeholder: "Substituto",
    value: "Valor real",
    empty: "Nada detectado ainda.",
    response: "Resposta da IA (edite)",
    restored: "Resposta restaurada",
    detectors: "Detectores",
    sample: en.playground.sample,
    response1:
      "Obrigado, [cpf_1]! Atualizei o cadastro de [CNPJ_1] e vou mandar o recibo para [EMAIL 1]. Vamos ligar para [PHONE_1] amanhã.",
    notice: "Nada do que você digita sai desta página.",
  },
  benchmark: {
    title: "Benchmark",
    soon: "Em breve",
    body: "Um conjunto de dados aberto com textos fictícios, com precisão e recall de cada detector, para qualquer pessoa conferir nossos números e comparar ferramentas.",
    follow: "Acompanhe o projeto no GitHub",
  },
  docs: {
    title: "Documentação",
    toc: "Nesta página",
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, pt };

export const getDictionary = (lang: Locale): Dictionary => dictionaries[lang];

export const GITHUB_URL = "https://github.com/privyl/privyl";
