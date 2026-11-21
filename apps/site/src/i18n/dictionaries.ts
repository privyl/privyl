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
      "Open-source privacy layer for AI. Masks personal data before it reaches any model and restores it in the answer. Runs on your machine. Built for Brazilian documents.",
  },
  nav: {
    docs: "Docs",
    playground: "Playground",
    benchmark: "Benchmark",
    github: "GitHub",
    stars: "stars on GitHub",
    languageGroup: "Language",
    skip: "Skip to content",
    menu: "Main navigation",
  },
  hero: {
    badge: "Open source · MIT · zero dependencies",
    title1: "Use any AI.",
    title2: "Keep your data private.",
    subtitle:
      "Privyl swaps personal data for placeholders before your text reaches Claude, ChatGPT, Gemini or any model — and puts the real values back in the answer. Nothing leaves your machine.",
    copy: "Copy",
    copied: "Copied",
    getStarted: "Get started",
    tryIt: "Try the playground",
    facts: ["3 lines of code", "No network calls", "Built for Brazilian documents"],
  },
  heroDemo: {
    title: "chat → AI",
    you: "You",
    exposed: "exposed",
    safe: "0 exposed",
    footer: "The AI only sees placeholders. The real values stay in the vault, on your machine.",
    sample:
      "Hi! I'm Ana, CPF 529.982.247-25. My card 4111 1111 1111 1111 was declined — call me at (11) 98765-4321 or write to ana@example.com.",
  },
  demo: {
    kicker: "Live demo",
    title: "How much personal data is your project sending to AI?",
    subtitle:
      "This is the real Privyl library scanning three fictional projects — running right now, inside your browser.",
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
      total: "Total found",
      cpf: "CPFs",
      email: "Emails",
      card: "Cards",
      secret: "Secrets",
    },
  },
  drop: {
    title: "Now try it with your own files",
    subtitle:
      "Drop text files below. Your browser reads and scans them — there is no upload, and the page is not allowed to connect to other sites.",
    cta: "Choose files",
    hint: "or drag and drop .log .json .csv .md .txt .env…",
    privacy: "Processed locally · no upload",
    results: "Results",
    empty: "Your results will appear here.",
    none: "No personal data found.",
    skipped: "skipped (binary or larger than 5 MB)",
    tooMany: "Only the first 25 files were scanned.",
    clear: "Clear",
    inFiles: "in",
    files: "file(s)",
  },
  beforeAfter: {
    title: "Before and after",
    subtitle:
      "What the AI would receive, and what it receives with Privyl. Real output of the library.",
    before: "Without Privyl",
    after: "With Privyl",
    found: "exposed",
    scenarios: {
      chat: {
        label: "Support chat",
        text: "Hi, I'm Ana. My CPF is 529.982.247-25 and my card 4111 1111 1111 1111 was declined. Call me at +55 11 98765-4321 or ana@example.com.",
      },
      log: {
        label: "Server log",
        text: "2026-11-21T14:02:11Z ERROR payment declined user=bruno@example.com cpf=11144477735 ip=203.0.113.42 card=5555 5555 5555 4444",
      },
      code: {
        label: "Code & .env",
        text: 'const customer = { cnpj: "11.222.333/0001-81", "pix": "3f2b9a4e-1c7d-4e8a-9b6f-2d4c8e1a7b3c" };\nDB_PASSWORD=s3cr3tPass99\nAWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
      },
    },
  },
  how: {
    title: "How it works",
    subtitle: "Three steps around the call you already make.",
    steps: [
      {
        title: "Mask",
        body: "Privyl finds personal data and swaps it for placeholders like [CPF_1]. The real values go to a vault that never leaves your machine.",
      },
      {
        title: "Ask the AI",
        body: "Send the masked text to any model. It still understands the request — it just never sees the data.",
      },
      {
        title: "Unmask",
        body: "Privyl puts the real values back in the answer, even when the AI writes [cpf_1] or CPF 1.",
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
    open: "Open",
    trademark: "Logos are trademarks of their owners. Privyl is not affiliated with them.",
  },
  coverage: {
    title: "Coverage by country",
    subtitle: "Detectors are plugins, one folder per country. Brazil first, more on the way.",
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
    title: "Open source. Proven, not promised.",
    items: [
      { title: "MIT license", body: "Read every line, fork it, use it at work." },
      {
        title: "No network calls",
        body: "The library never talks to the internet. Check the code.",
      },
      {
        title: "Tested on every commit",
        body: "True and false positive tests for every detector.",
      },
      {
        title: "Locked-down website",
        body: "A strict security policy blocks this page from sending data to any other site.",
      },
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
    subtitle: "Type or paste anything. Masking and unmasking happen live, in your browser.",
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
      "Camada de privacidade open source para IA. Esconde dados pessoais antes de chegarem a qualquer modelo e devolve na resposta. Roda na sua máquina. Feito para documentos brasileiros.",
  },
  nav: {
    docs: "Docs",
    playground: "Playground",
    benchmark: "Benchmark",
    github: "GitHub",
    stars: "estrelas no GitHub",
    languageGroup: "Idioma",
    skip: "Pular para o conteúdo",
    menu: "Navegação principal",
  },
  hero: {
    badge: "Open source · MIT · zero dependências",
    title1: "Use qualquer IA.",
    title2: "Seus dados continuam seus.",
    subtitle:
      "O Privyl troca dados pessoais por substitutos antes de o texto chegar ao Claude, ChatGPT, Gemini ou qualquer modelo — e devolve os valores reais na resposta. Nada sai da sua máquina.",
    copy: "Copiar",
    copied: "Copiado",
    getStarted: "Começar",
    tryIt: "Testar no playground",
    facts: ["3 linhas de código", "Nenhuma chamada de rede", "Feito para documentos brasileiros"],
  },
  heroDemo: {
    title: "chat → IA",
    you: "Você",
    exposed: "expostos",
    safe: "0 expostos",
    footer: "A IA só vê substitutos. Os valores reais ficam no vault, na sua máquina.",
    sample:
      "Oi! Sou a Ana, CPF 529.982.247-25. Meu cartão 4111 1111 1111 1111 foi recusado — me liga no (11) 98765-4321 ou escreve para ana@example.com.",
  },
  demo: {
    kicker: "Demo ao vivo",
    title: "Quantos dados pessoais o seu projeto está enviando para a IA?",
    subtitle:
      "Esta é a biblioteca Privyl de verdade analisando três projetos fictícios — rodando agora, dentro do seu navegador.",
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
    title: "Agora teste com seus arquivos",
    subtitle:
      "Solte arquivos de texto abaixo. O seu navegador lê e analisa — não há upload, e a página é proibida de se conectar a outros sites.",
    cta: "Escolher arquivos",
    hint: "ou arraste .log .json .csv .md .txt .env…",
    privacy: "Processado localmente · sem upload",
    results: "Resultado",
    empty: "O resultado aparece aqui.",
    none: "Nenhum dado pessoal encontrado.",
    skipped: "ignorado (binário ou maior que 5 MB)",
    tooMany: "Só os 25 primeiros arquivos foram analisados.",
    clear: "Limpar",
    inFiles: "em",
    files: "arquivo(s)",
  },
  beforeAfter: {
    title: "Antes e depois",
    subtitle: "O que a IA receberia, e o que ela recebe com o Privyl. Saída real da biblioteca.",
    before: "Sem Privyl",
    after: "Com Privyl",
    found: "expostos",
    scenarios: {
      chat: {
        label: "Chat de suporte",
        text: "Oi, sou a Ana. Meu CPF é 529.982.247-25 e meu cartão 4111 1111 1111 1111 foi recusado. Me liga no (11) 98765-4321 ou ana@example.com.",
      },
      log: {
        label: "Log do servidor",
        text: "2026-11-21T14:02:11Z ERROR pagamento recusado cliente=bruno@example.com cpf=11144477735 ip=203.0.113.42 cartao=5555 5555 5555 4444",
      },
      code: {
        label: "Código e .env",
        text: 'const cliente = { cnpj: "11.222.333/0001-81", "pix": "3f2b9a4e-1c7d-4e8a-9b6f-2d4c8e1a7b3c" };\nDB_PASSWORD=s3cr3tPass99\nAWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
      },
    },
  },
  how: {
    title: "Como funciona",
    subtitle: "Três passos em volta da chamada que você já faz.",
    steps: [
      {
        title: "Mascarar",
        body: "O Privyl encontra dados pessoais e troca por substitutos como [CPF_1]. Os valores reais vão para um vault que nunca sai da sua máquina.",
      },
      {
        title: "Perguntar à IA",
        body: "Envie o texto protegido para qualquer modelo. Ele entende o pedido — só nunca vê os dados.",
      },
      {
        title: "Restaurar",
        body: "O Privyl coloca os valores reais de volta na resposta, mesmo quando a IA escreve [cpf_1] ou CPF 1.",
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
    open: "Abrir",
    trademark: "Os logos são marcas de seus donos. O Privyl não tem vínculo com eles.",
  },
  coverage: {
    title: "Cobertura por país",
    subtitle: "Os detectores são plugins, uma pasta por país. Brasil primeiro, outros a caminho.",
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
    title: "Open source. Comprovado, não prometido.",
    items: [
      { title: "Licença MIT", body: "Leia cada linha, faça fork, use no trabalho." },
      {
        title: "Sem chamadas de rede",
        body: "A biblioteca nunca fala com a internet. Confira no código.",
      },
      {
        title: "Testado a cada commit",
        body: "Testes de acertos e de falsos positivos para cada detector.",
      },
      {
        title: "Site blindado",
        body: "Uma política de segurança rígida impede esta página de enviar dados para qualquer outro site.",
      },
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
    subtitle:
      "Digite ou cole qualquer coisa. Mascarar e restaurar acontece ao vivo, no seu navegador.",
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
