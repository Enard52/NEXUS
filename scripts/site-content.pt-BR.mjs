import { RELEASES_URL } from "./site-constants.mjs";

export const ptBR = {
  title: "NEXUS — Sua casa inteligente, gerenciada na sua própria rede",
  ogImageAlt: "Ecossistema de casa inteligente NEXUS no computador e no celular",
  description:
    "O NEXUS é um ecossistema de casa inteligente com foco local para Windows, macOS, Linux, Android e iOS. Controle direto dos dispositivos pela sua própria rede local, automações responsivas e métricas de energia em tempo real. Grátis para sempre; plano NEXUS+ opcional.",
  nav: [
    ["#features", "Recursos"],
    ["#how", "Como funciona"],
    ["#integrations", "Integrações"],
    ["#pricing", "Preços"],
    ["#downloads", "Baixar"],
    ["#faq", "Perguntas frequentes"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Casa inteligente com foco local",
    h1a: "Sua casa.",
    h1b: "Com você no controle, em silêncio.",
    lead: "Um único ecossistema para suas luzes, climatização, cortinas e sensores — conversando diretamente com os dispositivos da sua própria rede local. Automações responsivas, medição de energia em tempo real e um controle que continua funcionando quando a internet cai.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Última versão",
    shotAlt: "Interface e central de controle do NEXUS",
    trust: [
      "Grátis, dispositivos ilimitados",
      "Sem nuvem para controlar",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Infraestrutura poderosa. Controle sem esforço.",
    lead: "Cada estado de dispositivo, cada medição de energia e cada cena automática rodam diretamente pela sua rede local, sem depender de nuvens externas.",
    items: [
      [
        "zap",
        "Automações responsivas",
        "Cenários disparados por horário e pôr do sol são executados direto no seu hardware local — e seguem rodando de forma confiável em segundo plano no computador.",
      ],
      [
        "gauge",
        "Leituras de energia em tempo real",
        "Leia a potência e o consumo de energia em tempo real direto de tomadas e interruptores inteligentes compatíveis na sua rede local.",
      ],
      [
        "wifi",
        "Velocidade de rede local",
        "Comunicação direta pela LAN via HTTP, TCP e UDP com as marcas listadas em Integrações. Nenhum desvio pela nuvem no caminho dos comandos.",
      ],
      [
        "lock",
        "Privacidade desde o projeto",
        "A configuração da sua casa e a telemetria dos dispositivos ficam no seu hardware local. Uma conta é necessária para usar o NEXUS; ela guarda sua configuração em uma linha só sua, com controle de acesso em nível de linha. Os comandos dos dispositivos continuam passando pela sua LAN.",
      ],
      [
        "sparkles",
        "Inteligência NEXUS AI",
        "Os comandos locais da casa inteligente são instantâneos e grátis para sempre. O assistente de IA opcional na nuvem dá sugestões inteligentes sempre que você precisar de orientação.",
      ],
      [
        "layers",
        "Protocolos locais abertos",
        "Os conectores diretos conversam na sua LAN. Matter e Zigbee entram pelo seu próprio servidor Home Assistant — a seção Integrações mostra o que é direto e o que passa por ponte.",
      ],
    ],
  },
  how: {
    heading: "Do download à conexão em minutos.",
    steps: [
      [
        "1",
        "Instale e abra",
        "Baixe o instalador nativo para a sua plataforma (Windows, Linux ou Android). Depois, entre na sua conta — ela é necessária para usar o NEXUS e também sincroniza a configuração entre as suas telas.",
      ],
      [
        "2",
        "Adicione seus dispositivos",
        "Escolha a marca, escaneie a rede local ou digite um IP. As marcas com conector direto falam o próprio protocolo — sem nuvem do fabricante nesse caminho.",
      ],
      [
        "3",
        "Viva a sua casa",
        "Cenas, automações agendadas e leituras reais de energia — controle unificado entre computador e celular.",
      ],
    ],
  },
  integrations: {
    heading: "Funciona com o que você já tem.",
    lead: "Primeiro os protocolos locais e gratuitos. O que não tem conector direto continua funcionando pela ponte do Home Assistant.",
    groups: [
      [
        "HTTP local — em todas as plataformas",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Philips Hue bridge",
          "Home Assistant",
        ],
      ],
      [
        "Rede local, sem conta nem chave — app para computador",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (modo DIY)", "Wake-on-LAN"],
      ],
    ],
    more: "Faltou algo? Peça um conector",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Grátis para usar. NEXUS+ quando você quiser mais",
    lead: "",
    currencyNote: "Preços em USD",
    plans: [
      {
        name: "Grátis",
        price: "$0",
        period: "para sempre",
        features: [
          "Dispositivos e cômodos ilimitados em todos os protocolos locais compatíveis",
          "Zero dependência da nuvem: roda localmente na sua própria LAN",
          "30 comandos e ações de dispositivo por dia no NEXUS AI",
          "Automações locais agendadas e cenas personalizadas",
          "Sincronização da conta entre vários dispositivos (cômodos, dispositivos, cenas)",
          "100% privado: sem rastreamento, sem coleta de dados",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "por mês",
        badge: "Mais popular",
        features: [
          "Tudo do plano Grátis, mais:",
          "2.000 respostas do NEXUS AI por mês em vez de 30 por dia",
          "Peça ao NEXUS AI para definir cenas e responder em linguagem simples",
          "Uma conta, válida em todos os dispositivos NEXUS",
          "Teste grátis — 3 dias no mensal, 7 dias no anual; cancele ao fim do período",
        ],
        cta: {
          label: "Comece seu teste grátis",
          monthlyLabel: "Começar teste grátis de 3 dias",
          yearlyLabel: "Começar teste grátis de 7 dias",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Família",
        price: "Free",
        period: "para a família toda",
        badge: "Casa inteira",
        features: [
          "Membros da casa com acesso por função — sem limite de membros",
          "Funções de proprietário, membro e convidado",
          "Permissões de controle, convite e configurações por membro",
          "Cenas e automações sincronizadas entre os seus próprios dispositivos conectados",
          "Ativo em todo o ecossistema (computador e celular)",
          "Totalmente grátis junto com a sua casa",
        ],
        cta: { label: "Comece com a Família", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Cancele quando quiser em Cobrança no app ou pela sua conta neste site. O cancelamento vale a partir do fim do período atual.",
  },
  downloads: {
    heading: "Nativo em todo computador. À vontade no celular.",
    lead: "Sempre grátis. Cada instalador acompanha uma soma de verificação SHA-256 publicada, para você conferir o que está instalando.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64 bits", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian e Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK assinado",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Versão",
    sizeLabel: "Tamanho",
    webCard: {
      title: "Uma conta, em todo o seu ecossistema",
      desc: "Programas para computador com Windows e Linux e o app Android. Conectado, seus cômodos, dispositivos, cenas e automações ficam sincronizados de forma contínua entre as suas telas.",
      cta: { label: "Baixar o NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "No Windows, o caminho mais fácil é a Microsoft Store: o pacote é assinado pela Microsoft e as atualizações chegam pela Store. O .exe direto não é assinado, então o Windows pode avisar sobre um “editor desconhecido” — veja as somas de verificação.",
  },
  faq: {
    heading: "As perguntas importantes, respondidas.",
    items: [
      [
        "O NEXUS funciona totalmente na minha rede local?",
        "Sim. O NEXUS é construído sobre uma arquitetura rigorosa com foco local. Seus dispositivos, cômodos, cenas e a telemetria dos sensores são processados diretamente no hardware da sua casa. Mesmo durante quedas de internet, todos os controles locais, a iluminação e as automações continuam funcionando sem interrupção e sem latência. Entrar na conta sincroniza suas configurações com segurança entre todas as suas telas.",
      ],
      [
        "Preciso instalar o NEXUS ou ele roda no navegador?",
        "Instale o programa para computador (Windows ou Linux) ou o app Android. O NEXUS não é oferecido como app de navegador. Os comandos dos dispositivos passam pela sua própria rede local. Shelly, Philips Hue, ESPHome, Tasmota, WLED e Home Assistant usam HTTP local no programa para computador e no Android. TP-Link Kasa e Yeelight precisam de TCP puro, então rodam no programa para computador. Este site é para conta, downloads e cobrança.",
      ],
      [
        "O que o plano NEXUS+ acrescenta?",
        "O controle essencial da casa inteligente — dispositivos e cômodos ilimitados, automações offline e painéis locais — é grátis. O NEXUS+ inclui tudo do plano Grátis, o NEXUS AI para cenas e perguntas em linguagem simples, 2.000 respostas por mês, conexões avançadas para adicionar dispositivos do Home Assistant e uma conta em todos os dispositivos, com teste de 3 dias no mensal ou de 7 dias no anual. Os comandos dos dispositivos continuam rodando localmente. As funções da casa estão incluídas sem custo extra.",
      ],
      [
        "A qual conta pertence a minha assinatura NEXUS+?",
        "Ao e-mail usado no checkout. Entre neste site ou no app antes de pagar: o checkout abre então com o e-mail da sua conta já preenchido, e a assinatura aparece em todos os dispositivos em que você entrar. O NEXUS+ não pode ser comprado sem uma conta. Se você pagar com outro e-mail, a assinatura fica guardada nesse e-mail e não aparecerá na sua conta até que você entre com ele.",
      ],
      [
        "Como as automações e regras agendadas são executadas?",
        "O mecanismo de automação do NEXUS avalia seus agendamentos e regras de sensores no dispositivo que você mantém ligado — o app para computador fica na bandeja do sistema e executa 24 horas por dia, então as rotinas de iluminação, energia e segurança nunca esperam por uma nuvem. Cenas e temporizadores acionados pelo celular valem na hora pela sua LAN. Novos eventos são enviados aos canais de notificação que você ativar na página Notificações instantâneas: a faixa dentro do app, notificações do sistema, ntfy, Telegram ou o seu próprio webhook HTTPS.",
      ],
      [
        "Quais dispositivos e ecossistemas são compatíveis?",
        "O NEXUS fala o protocolo local de cada dispositivo: Shelly (Gen1 e Gen2+), Tasmota, WLED, ESPHome, Philips Hue e Home Assistant por HTTP local em todas as plataformas, além de TP-Link Kasa, Yeelight, WiZ, Sonoff (modo DIY) e Wake-on-LAN pela rede local no app para computador, sem conta nem chave. Todo o resto — equipamentos Matter ou Zigbee — entra pelo seu próprio servidor Home Assistant, que o NEXUS trata como um único hub local. A descoberta de IP local pareia os dispositivos na hora, sem nuvem de fabricante no meio.",
      ],
      [
        "Como as câmeras de segurança e os sensores são integrados?",
        "O NEXUS reúne suas câmeras de segurança, detectores de movimento e sensores de entrada em um painel de segurança centralizado. Você pode automatizar modos de privacidade, ativar rotinas de vigilância ao sair de casa e ver cada evento de movimento ou de contato no app — e também nos canais de notificação que ativar (notificações do sistema, ntfy, Telegram ou o seu próprio webhook).",
      ],
      [
        "Posso cancelar o NEXUS+ a qualquer momento?",
        "Sim, sem complicação e sem compromisso. Você pode cancelar com um único clique a qualquer momento: nas configurações de Conta e cobrança do app, pelo nosso site ou direto pelo link do pedido no recibo enviado por e-mail. Seus benefícios premium continuam ativos até o fim do ciclo de cobrança, sem novas cobranças.",
      ],
      [
        "Posso controlar minha casa quando estou fora?",
        "Não por meio de uma nuvem do NEXUS: o NEXUS conversa com seus dispositivos diretamente na rede da sua casa e não tem retransmissão. Para acessá-lo de fora, coloque o celular ou o notebook na rede doméstica com uma VPN, como o Tailscale (subnet router) ou o WireGuard no seu roteador; o NEXUS então funciona exatamente como em casa. O NEXUS ainda não tem uma configuração de endereço do hub, então a VPN precisa tornar acessível a sua faixa de endereços locais, e a busca por novos dispositivos só funciona na rede doméstica. Nunca exponha um dispositivo à internet com redirecionamento de portas. O passo a passo está em docs/REMOTE-ACCESS.md no repositório.",
      ],
      [
        "Existe uma versão para iPhone?",
        "Não há app na App Store, porque o NEXUS não usa uma conta paga de Apple Developer. Com um Mac e um Apple ID gratuito, você pode compilá-lo para o seu próprio iPhone (guia: docs/IOS-BUILD.md), e um lançamento também pode anexar um IPA não assinado que o AltStore ou o Sideloadly podem assinar para você; esse caminho ainda não foi verificado em um iPhone real. Um Apple ID gratuito faz o app expirar após 7 dias, e as notificações com o app fechado não estão disponíveis no iOS. O hub da casa continua sendo o app para computador; o iPhone é um cliente.",
      ],
      [
        "Meu dispositivo não está na lista. O que posso fazer?",
        "O NEXUS só é compatível com dispositivos que tenham um protocolo local documentado; dispositivos que funcionam apenas na nuvem não são compatíveis, porque o NEXUS nunca conversa com a nuvem de um fabricante. A lista de compatibilidade (docs/COMPATIBILITY.md) também inclui Sonoff em modo DIY, WiZ, LIFX, Govee (LAN) e Wake-on-LAN. Cada um tem testes automatizados de protocolo, mas um modelo só conta como verificado quando alguém relata que funcionou em um dispositivo real. Escreva para nós pelo formulário de contato deste site (escolha “New Device / Connector Request”) ou por e-mail: a marca e o modelo, o que você esperava e o que aconteceu. Dizer que um modelo funcionou no seu dispositivo real é o que o marca como verificado; nunca inclua senhas, chaves locais ou tokens.",
      ],
      [
        "Preciso de uma conta? O que acontece se o servidor ficar fora do ar?",
        "Sim: você entra uma vez com uma conta de e-mail gratuita para abrir o NEXUS. Depois disso, controlar dispositivos e executar automações acontece na sua própria rede e continua funcionando sem internet. A conta acrescenta a sincronização entre os seus dispositivos, a Família e o assistente de IA, que usam serviços gratuitos na nuvem com limites. Quando um deles está indisponível, por exemplo quando o projeto gratuito do Supabase foi pausado após cerca de uma semana sem atividade, as telas da nuvem dizem que o servidor está inacessível em vez de mostrar algo como salvo; dispositivos, automações e a bandeja continuam funcionando. Se a cota ou o serviço de IA se esgotar, o assistente avisa que não conseguiu responder.",
      ],
      [
        "Posso fazer backup das minhas configurações e levá-las para outro dispositivo?",
        "Sim. As Configurações têm uma seção de backup em que você pode exportar suas configurações e automações para um arquivo JSON e importá-lo em outro dispositivo ou depois de reinstalar. Senhas, tokens e chaves locais são removidos da lista de dispositivos pareados no arquivo, então digite-os novamente após restaurar. Mantenha o arquivo de backup em sigilo.",
      ],
      [
        "Posso exportar meus dados de energia?",
        "Sim. A página Energia pode exportar as leituras reais de potência mais recentes dos seus dispositivos em um arquivo CSV ou JSON. O NEXUS só tem dados dos dispositivos que realmente informam potência; sem nenhum pareado, não há nada para exportar.",
      ],
      [
        "Por que o Windows me avisa ao executar o instalador?",
        "Instale pela Microsoft Store e você não verá este aviso: a Microsoft assina esse pacote durante a certificação e entrega as atualizações pela Store. O download direto do .exe ainda não é assinado com um certificado comercial, então o SmartScreen pode mostrar “editor desconhecido”. Você pode comparar o arquivo com as somas de verificação listadas na seção de downloads antes de executá-lo. Nossa política de assinatura de código tem link no rodapé do site.",
      ],
    ],
  },
  about: {
    title: "Sobre o NEXUS",
    lead: "Uma plataforma de casa inteligente independente e com foco local, projetada para velocidade, privacidade absoluta e posse real do hardware. Ao conversar diretamente com os seus dispositivos pela sua própria rede doméstica, o NEXUS acaba de vez com a dependência de uma nuvem.",
    manifesto: {
      heading: "Por que criamos o NEXUS",
      text: "O mercado moderno de casas inteligentes tomou o caminho errado. Ecossistemas proprietários empurraram os moradores para assinaturas obrigatórias, lentidão dependente da nuvem e rastreamento invasivo por telemetria. Quando a sua conexão com a internet cai, o interruptor da sala não deveria parar de funcionar. Criamos o NEXUS porque acreditamos que a sua casa é o seu santuário: a planta do seu lar, o estado das suas câmeras e as rotinas diárias da sua família pertencem exclusivamente ao seu próprio hardware.",
    },
    pillars: [
      {
        title: "Velocidade com foco local",
        desc: "Toda automação e todo comando são executados pela sua LAN local em milissegundos. Sem idas e vindas a servidores remotos na nuvem, latência zero.",
      },
      {
        title: "Privacidade sem concessões",
        desc: "Sem telemetria de análise, sem perfilamento de comportamento e sem venda das suas rotinas privadas. Uma conta é necessária; sua configuração fica guardada na sua própria linha de conta, protegida em nível de linha. Os comandos dos dispositivos continuam na sua LAN.",
      },
      {
        title: "Sem dependência de fornecedor",
        desc: "Primeiro os protocolos locais abertos: Shelly, Philips Hue, ESPHome, Tasmota e WLED respondem diretamente ao NEXUS, e todo o resto entra pelo seu próprio servidor Home Assistant em vez de uma nuvem de fabricante.",
      },
      {
        title: "SaaS honesto e sustentável",
        desc: "O gerenciamento essencial da casa inteligente é totalmente grátis e ilimitado para sempre. O NEXUS+ é o plano do NEXUS AI e ajuda a cobrir esse uso da nuvem.",
      },
    ],
    architecture: {
      heading: "Projetado para a confiabilidade",
      lead: "O NEXUS mantém um mecanismo leve para computador na bandeja do sistema, para que agendamentos e regras de sensores continuem sendo avaliados enquanto o computador estiver ligado, e o app para celular abre direto na mesma rede local.",
      items: [
        {
          icon: "layers",
          title: "Computador",
          desc: "Os apps para Windows, macOS e Linux ficam na bandeja do sistema e mantêm agendamentos locais e regras de sensores em execução enquanto o computador estiver ligado. Windows e Linux vêm como instaladores prontos; o macOS é compilado a partir do código-fonte (não assinado: clique com o botão direito → Abrir).",
        },
        {
          icon: "wifi",
          title: "Celular",
          desc: "Os apps Android e iOS abrem na mesma rede local; os comandos dos dispositivos continuam passando pela sua LAN. O Android vem como um APK assinado; o iOS é compilado a partir do código-fonte com o Xcode e um Apple ID gratuito.",
        },
        {
          icon: "lock",
          title: "Conta",
          desc: "Uma conta é necessária para que cômodos, dispositivos e cenas sejam os mesmos em todas as telas. Os comandos dos dispositivos não saem da sua rede doméstica.",
        },
      ],
    },
    linksTitle: "Links úteis",
  },
  footer: {
    tagline:
      "Controle toda a sua casa inteligente diretamente pela rede local — sem dependência de fornecedor e sem depender da nuvem. Mesmo quando a internet cai, a sua casa nunca para.",
    product: "Produto",
    productLinks: [
      ["Recursos", "#features"],
      ["Preços", "#pricing"],
      ["Baixar", "#downloads"],
      ["Perguntas frequentes", "#faq"],
      ["Sobre", "/about"],
    ],
    account: "Clientes e suporte",
    accountLinks: [
      ["Contato e suporte técnico", "javascript:nxOpenContactModal('Technical Support')"],
      ["Notas de versão e comunidade", RELEASES_URL],
      ["Baixar os apps", "#downloads"],
    ],
    legal: "Legal",
    legalLinks: [
      ["Privacidade", "/privacy"],
      ["Termos", "/terms"],
      ["Reembolsos", "/refund"],
      ["Assinatura de código", "/code-signing"],
      ["Contribuir", "/contribute"],
    ],
    rights: "Todos os direitos reservados.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
