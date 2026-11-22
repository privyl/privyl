// All site text, in English and Portuguese. Add a key to `en` first; TypeScript then
// makes sure `pt` has it too.

export const locales = ["en", "pt"] as const;
export type Locale = (typeof locales)[number];

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

const en = {
  meta: {
    title: "Privyl: Use any AI. Keep your data private.",
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
    badge: "PRIVYL",
    title1: "Use any AI.",
    title2: "Keep your data private.",
    subtitle:
      "Privyl swaps personal data for placeholders before your text reaches Claude, ChatGPT, Gemini or any model, then puts the real values back in the answer. Nothing leaves your machine.",
    copy: "Copy",
    copied: "Copied",
    getStarted: "Get started",
    tryIt: "Try the playground",
    facts: ["3 lines of code", "No network calls", "Built for Brazilian documents"],
  },
  heroDemo: {
    title: "localhost:3000/chat",
    you: "You",
    exposed: "exposed",
    safe: "0 exposed",
    footer: "The AI only sees placeholders. The real values stay in the vault, on your machine.",
    sample:
      "Hi! I'm Ana, CPF 529.982.247-25. My card 4111 1111 1111 1111 was declined. Call me at (11) 98765-4321 or write to ana@example.com.",
  },
  demo: {
    kicker: "Live demo",
    title: "How much personal data is your project sending to AI?",
    subtitle:
      "This is the real Privyl library scanning three fictional projects, running right now inside your browser.",
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
    title: "Now with your own files.\nNo upload.",
    subtitle:
      "Drop text files below. Your browser reads and scans them. There is no upload, and the page is not allowed to connect to other sites.",
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
    title: "Before and after.\nSee what the AI receives.",
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
    title: "Mask, ask, restore.\nZero data exposed.",
    subtitle:
      "Privyl wraps the AI call you already make. Click a step, or watch it run on its own.",
    guide: "Read the quick start",
    steps: [
      {
        tab: "Mask",
        title: "Personal data becomes placeholders",
        body: "Privyl finds CPF, phone, email and more, checks the digits, and swaps each value for a placeholder like [CPF_1].",
      },
      {
        tab: "Ask the AI",
        title: "The model only sees placeholders",
        body: "Send the masked text to any model. It still understands the request. It just never sees the data.",
      },
      {
        tab: "Restore",
        title: "Real values come back in the answer",
        body: "Privyl puts the real values back from the vault, even when the AI changes the placeholder.",
      },
    ],
    ui: {
      url: "localhost:3000/support",
      steps: "Steps",
      message: "Customer message",
      maskedText: "Masked text",
      exposed: "exposed",
      detected: "Detected",
      confidence: "confidence",
      vault: "Vault",
      items: "values",
      vaultNote: "In memory, on your machine. Never sent.",
      model: "Model",
      payload: "What the model receives",
      understands: "Placeholders keep the meaning, so the answer still makes sense.",
      timeline: "Request",
      stages: ["Text masked locally", "Sent to {model}", "Answer received"],
      zero: "personal data sent to the AI",
      aiReply: "AI answer",
      placeholdersOnly: "placeholders only",
      finalReply: "Answer shown to the customer",
      restoredLabel: "restored",
      fromVault: "From the vault",
      robust:
        "The AI wrote [cpf_1] in lowercase. Privyl still restores it, and also handles CPF 1 or [CPF 1].",
    },
    sample:
      "Hi, I'm Ana. CPF 529.982.247-25, phone (11) 98765-4321, email ana@example.com. Can you update my order?",
    reply:
      "Done! The order for CPF {0~} is updated. The receipt goes to {2}, and we will call {1} if anything changes.",
    closing: {
      title: "From prompt to answer, in milliseconds.",
      body: "Masking runs on your machine with no network calls. Three lines of code, any model.",
      cta: "Do this in my project",
      note: "Free and open source. MIT license.",
    },
  },
  anywhere: {
    title: "Any AI.\nAny runtime.",
    subtitle: "Plain text in, plain text out. No SDK lock-in, no runtime dependencies.",
    ai: "AI models",
    runtimes: "Runtimes",
    localModels: "Local models",
    browsers: "Browsers",
    open: "Open",
    trademark: "Logos are trademarks of their owners. Privyl is not affiliated with them.",
  },
  coverage: {
    title: "Coverage by country.\nBrazil first.",
    subtitle:
      "Detectors are plugins, one folder per country. Six countries today, with check digits validated wherever the document has them.",
    country: "Country",
    data: "What is detected",
    global: "Global",
    br: "Brazil",
    pt: "Portugal",
    ar: "Argentina",
    us: "United States",
    mx: "Mexico",
    cl: "Chile",
    addCountry: "Add your country",
    addBody: "Create a folder, write detectors with tests, open a pull request.",
    yourCountry: "your country",
    detectors: "detectors",
    secrets: "API keys & secrets",
    notDetectedTitle: "Not detected yet",
    notDetected:
      "Names, street addresses and dates of birth (they need a language model), RG, data inside images or PDFs, and encoded data.",
  },
  trust: {
    title: "Open source.\nProven, not promised.",
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
    mock: {
      requests: "0 requests to other sites",
      local: "runs locally",
      passed: "passed",
      headers: "Response headers",
    },
    disclaimer:
      "Privyl reduces the risk of sending personal data to AI. No tool detects everything: check what is and is not covered.",
  },
  cta: {
    title: "Protect your next prompt.\nIt takes two minutes.",
    body: "Install, wrap your AI call, done. Your users never know the difference, the AI never sees their data.",
    primary: "Get started",
    secondary: "Star on GitHub",
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
    kicker: "Open benchmark",
    heading: "Real numbers.\nMistakes included.",
    subtitle:
      "An open dataset of fictional texts, labeled by hand, and the exact result of running Privyl on it. Every number below is regenerated by our test suite, so it always matches the code.",
    version: "version",
    texts: "texts",
    labeled: "labeled values",
    precision: "Precision",
    precisionHelp: "Of everything Privyl hid, how much was really personal data.",
    recall: "Recall",
    recallHelp: "Of all the personal data, how much Privyl hid completely.",
    f1: "F1 score",
    f1Help: "The balance between precision and recall.",
    falseAlarms: "False alarms on clean texts",
    falseAlarmsHelp: "Texts with no personal data, only traps, where something was flagged anyway.",
    byType: "By type of data",
    type: "Type",
    support: "Labeled",
    found: "Hidden",
    fp: "False alarms",
    fn: "Missed",
    types: {
      EMAIL: "Email",
      PHONE: "Phone",
      CARD: "Payment card",
      IP: "IP address",
      SECRET: "API keys and secrets",
      CPF: "CPF",
      CNPJ: "CNPJ",
      PIX: "Pix key",
      CEP: "CEP",
      CNH: "CNH",
      PLATE: "Vehicle plate",
      NIF: "NIF (Portugal)",
      CC: "Cartão de Cidadão (Portugal)",
      NISS: "NISS (Portugal)",
      CUIT: "CUIT/CUIL (Argentina)",
      DNI: "DNI (Argentina)",
      SSN: "SSN (United States)",
      ITIN: "ITIN (United States)",
      CURP: "CURP (Mexico)",
      RFC: "RFC (Mexico)",
      RUT: "RUT/RUN (Chile)",
    } as Record<string, string>,
    errorsTitle: "Where Privyl gets it wrong",
    errorsSubtitle:
      "Real mistakes from this run. We show them on purpose: they are the to-do list for the next versions.",
    missed: "Missed",
    falseAlarm: "False alarm",
    methodTitle: "How it works",
    method: [
      {
        title: "Fictional data, labeled by hand",
        body: "Texts are built from templates (support chats, forms, server logs, code). Each template marks where the personal data is, so the labels never come from Privyl itself.",
      },
      {
        title: "Traps on purpose",
        body: "Order numbers, invoices, software versions, product codes, UUIDs and documents with a wrong check digit. None of them is personal data, and a good detector must ignore them.",
      },
      {
        title: "Strict scoring",
        body: "A value counts as hidden only if Privyl covers all of it. Hiding part of an email still leaks the rest, so it counts as missed.",
      },
      {
        title: "Known gaps included",
        body: "Cases Privyl got wrong stay in the dataset after they are fixed, so a later change that breaks them again shows up right away. An 11-digit number valid as both a CPF and a mobile phone is still ambiguous today.",
      },
      {
        title: "Blind first run",
        body: "Each release adds new cases before the detectors are tuned for them, and we publish that first score. In 0.3.0, 340 new cases first scored F1 0.960; after general fixes (not rules for those texts), 0.999. Trust the first-run number more.",
      },
    ],
    limitsTitle: "Limits",
    limits:
      "This dataset is synthetic. Real texts are messier, so expect lower numbers in production. Names, addresses and dates of birth are not measured because Privyl does not detect them yet.",
    reproduceTitle: "Check it yourself",
    reproduceBody: "Clone the repository and run the benchmark. It takes about a second.",
    dataset: "Dataset (JSONL)",
    results: "Results (JSON)",
    code: "Benchmark code",
  },
  docs: {
    title: "Documentation",
    toc: "On this page",
  },
};

export type Dictionary = typeof en;

const pt: Dictionary = {
  meta: {
    title: "Privyl: Use qualquer IA. Seus dados continuam seus.",
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
    badge: "PRIVYL",
    title1: "Use qualquer IA.",
    title2: "Seus dados continuam seus.",
    subtitle:
      "O Privyl troca dados pessoais por substitutos antes de o texto chegar ao Claude, ChatGPT, Gemini ou qualquer modelo e devolve os valores reais na resposta. Nada sai da sua máquina.",
    copy: "Copiar",
    copied: "Copiado",
    getStarted: "Começar",
    tryIt: "Testar no playground",
    facts: ["3 linhas de código", "Nenhuma chamada de rede", "Feito para documentos brasileiros"],
  },
  heroDemo: {
    title: "localhost:3000/chat",
    you: "Você",
    exposed: "expostos",
    safe: "0 expostos",
    footer: "A IA só vê substitutos. Os valores reais ficam no vault, na sua máquina.",
    sample:
      "Oi! Sou a Ana, CPF 529.982.247-25. Meu cartão 4111 1111 1111 1111 foi recusado. Me liga no (11) 98765-4321 ou escreve para ana@example.com.",
  },
  demo: {
    kicker: "Demo ao vivo",
    title: "Quantos dados pessoais o seu projeto está enviando para a IA?",
    subtitle:
      "Esta é a biblioteca Privyl de verdade analisando três projetos fictícios, rodando agora dentro do seu navegador.",
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
    title: "Agora com seus arquivos.\nSem upload.",
    subtitle:
      "Solte arquivos de texto abaixo. O seu navegador lê e analisa. Não há upload, e a página é proibida de se conectar a outros sites.",
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
    title: "Antes e depois.\nVeja o que a IA recebe.",
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
    title: "Mascare, pergunte, restaure.\nNenhum dado exposto.",
    subtitle:
      "O Privyl envolve a chamada de IA que você já faz. Clique em um passo ou veja rodar sozinho.",
    guide: "Ver o guia rápido",
    steps: [
      {
        tab: "Mascarar",
        title: "Dados pessoais viram substitutos",
        body: "O Privyl encontra CPF, telefone, e-mail e mais, confere os dígitos e troca cada valor por um substituto como [CPF_1].",
      },
      {
        tab: "Perguntar à IA",
        title: "O modelo só vê substitutos",
        body: "Envie o texto protegido para qualquer modelo. Ele entende o pedido, só nunca vê os dados.",
      },
      {
        tab: "Restaurar",
        title: "Os valores reais voltam na resposta",
        body: "O Privyl devolve os valores reais a partir do vault, mesmo quando a IA altera o substituto.",
      },
    ],
    ui: {
      url: "localhost:3000/suporte",
      steps: "Passos",
      message: "Mensagem do cliente",
      maskedText: "Texto protegido",
      exposed: "expostos",
      detected: "Detectado",
      confidence: "confiança",
      vault: "Vault",
      items: "valores",
      vaultNote: "Em memória, na sua máquina. Nunca é enviado.",
      model: "Modelo",
      payload: "O que o modelo recebe",
      understands: "Os substitutos mantêm o sentido, então a resposta continua fazendo sentido.",
      timeline: "Requisição",
      stages: ["Texto mascarado localmente", "Enviado para {model}", "Resposta recebida"],
      zero: "dados pessoais enviados para a IA",
      aiReply: "Resposta da IA",
      placeholdersOnly: "só substitutos",
      finalReply: "Resposta mostrada ao cliente",
      restoredLabel: "restaurado",
      fromVault: "Do vault",
      robust:
        "A IA escreveu [cpf_1] em minúsculas. O Privyl restaura mesmo assim, e também entende CPF 1 ou [CPF 1].",
    },
    sample:
      "Oi, sou a Ana. CPF 529.982.247-25, telefone (11) 98765-4321, e-mail ana@example.com. Pode atualizar meu pedido?",
    reply:
      "Pronto! O pedido do CPF {0~} foi atualizado. O comprovante vai para {2}, e ligamos no {1} se algo mudar.",
    closing: {
      title: "Do prompt à resposta, em milissegundos.",
      body: "O mascaramento roda na sua máquina, sem chamadas de rede. Três linhas de código, qualquer modelo.",
      cta: "Fazer isso no meu projeto",
      note: "Gratuito e open source. Licença MIT.",
    },
  },
  anywhere: {
    title: "Qualquer IA.\nQualquer ambiente.",
    subtitle: "Entra texto, sai texto. Sem prender você a um SDK, sem dependências.",
    ai: "Modelos de IA",
    runtimes: "Ambientes",
    localModels: "Modelos locais",
    browsers: "Navegadores",
    open: "Abrir",
    trademark: "Os logos são marcas de seus donos. O Privyl não tem vínculo com eles.",
  },
  coverage: {
    title: "Cobertura por país.\nBrasil primeiro.",
    subtitle:
      "Os detectores são plugins, uma pasta por país. Seis países hoje, com dígito verificador validado sempre que o documento tem um.",
    country: "País",
    data: "O que é detectado",
    global: "Global",
    br: "Brasil",
    pt: "Portugal",
    ar: "Argentina",
    us: "Estados Unidos",
    mx: "México",
    cl: "Chile",
    addCountry: "Adicione seu país",
    addBody: "Crie uma pasta, escreva os detectores com testes e abra um pull request.",
    yourCountry: "seu país",
    detectors: "detectores",
    secrets: "Chaves de API e segredos",
    notDetectedTitle: "Ainda não detectado",
    notDetected:
      "Nomes, endereços e datas de nascimento (precisam de um modelo de linguagem), RG, dados dentro de imagens ou PDFs e dados codificados.",
  },
  trust: {
    title: "Open source.\nComprovado, não prometido.",
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
    mock: {
      requests: "0 requisições para outros sites",
      local: "roda localmente",
      passed: "passaram",
      headers: "Cabeçalhos da resposta",
    },
    disclaimer:
      "O Privyl reduz o risco de enviar dados pessoais para a IA. Nenhuma ferramenta detecta tudo: veja o que é e o que não é coberto.",
  },
  cta: {
    title: "Proteja o seu próximo prompt.\nLeva dois minutos.",
    body: "Instale, envolva a chamada de IA e pronto. Seus usuários não percebem diferença, a IA nunca vê os dados deles.",
    primary: "Começar",
    secondary: "Estrela no GitHub",
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
    kicker: "Benchmark aberto",
    heading: "Números reais.\nCom os erros incluídos.",
    subtitle:
      "Um conjunto aberto de textos fictícios, marcados à mão, e o resultado exato de rodar o Privyl sobre eles. Todo número abaixo é gerado de novo pelos nossos testes, então sempre bate com o código.",
    version: "versão",
    texts: "textos",
    labeled: "valores marcados",
    precision: "Precisão",
    precisionHelp: "De tudo o que o Privyl escondeu, quanto era mesmo dado pessoal.",
    recall: "Cobertura (recall)",
    recallHelp: "De todos os dados pessoais, quanto o Privyl escondeu por inteiro.",
    f1: "Nota F1",
    f1Help: "O equilíbrio entre precisão e cobertura.",
    falseAlarms: "Alarmes falsos em textos limpos",
    falseAlarmsHelp:
      "Textos sem dado pessoal, só com armadilhas, em que algo foi marcado mesmo assim.",
    byType: "Por tipo de dado",
    type: "Tipo",
    support: "Marcados",
    found: "Escondidos",
    fp: "Alarmes falsos",
    fn: "Perdidos",
    types: {
      EMAIL: "E-mail",
      PHONE: "Telefone",
      CARD: "Cartão de pagamento",
      IP: "Endereço IP",
      SECRET: "Chaves de API e segredos",
      CPF: "CPF",
      CNPJ: "CNPJ",
      PIX: "Chave Pix",
      CEP: "CEP",
      CNH: "CNH",
      PLATE: "Placa de veículo",
      NIF: "NIF (Portugal)",
      CC: "Cartão de Cidadão (Portugal)",
      NISS: "NISS (Portugal)",
      CUIT: "CUIT/CUIL (Argentina)",
      DNI: "DNI (Argentina)",
      SSN: "SSN (Estados Unidos)",
      ITIN: "ITIN (Estados Unidos)",
      CURP: "CURP (México)",
      RFC: "RFC (México)",
      RUT: "RUT/RUN (Chile)",
    },
    errorsTitle: "Onde o Privyl erra",
    errorsSubtitle:
      "Erros reais desta rodada. Mostramos de propósito: eles são a lista de tarefas das próximas versões.",
    missed: "Perdido",
    falseAlarm: "Alarme falso",
    methodTitle: "Como funciona",
    method: [
      {
        title: "Dados fictícios, marcados à mão",
        body: "Os textos saem de modelos (chats de suporte, formulários, logs de servidor, código). Cada modelo marca onde está o dado pessoal, então o gabarito nunca vem do próprio Privyl.",
      },
      {
        title: "Armadilhas de propósito",
        body: "Números de pedido, notas fiscais, versões de software, códigos de produto, UUIDs e documentos com dígito verificador errado. Nada disso é dado pessoal, e um bom detector precisa ignorar.",
      },
      {
        title: "Correção rigorosa",
        body: "Um valor só conta como escondido se o Privyl cobrir ele inteiro. Esconder só parte de um e-mail ainda vaza o resto, então conta como perdido.",
      },
      {
        title: "Falhas conhecidas incluídas",
        body: "Casos em que o Privyl errou continuam no conjunto depois de corrigidos, então uma mudança futura que os quebre de novo aparece na hora. Um número de 11 dígitos válido como CPF e como celular ao mesmo tempo ainda é ambíguo hoje.",
      },
      {
        title: "Primeira rodada às cegas",
        body: "Cada versão acrescenta casos novos antes de ajustar os detectores para eles, e publicamos essa primeira nota. Na 0.3.0, 340 casos novos tiveram F1 0,960 na primeira rodada; depois de correções gerais (não regras para aqueles textos), 0,999. Confie mais no número da primeira rodada.",
      },
    ],
    limitsTitle: "Limites",
    limits:
      "Este conjunto é sintético. Textos reais são mais bagunçados, então espere números menores em produção. Nomes, endereços e datas de nascimento não são medidos porque o Privyl ainda não os detecta.",
    reproduceTitle: "Confira você mesmo",
    reproduceBody: "Clone o repositório e rode o benchmark. Leva cerca de um segundo.",
    dataset: "Conjunto de dados (JSONL)",
    results: "Resultados (JSON)",
    code: "Código do benchmark",
  },
  docs: {
    title: "Documentação",
    toc: "Nesta página",
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, pt };

export const getDictionary = (lang: Locale): Dictionary => dictionaries[lang];

export const GITHUB_URL = "https://github.com/privyl/privyl";
