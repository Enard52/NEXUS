import { RELEASES_URL } from "./site-constants.mjs";

export const gl = {
  title: "NEXUS — A túa casa intelixente, xestionada na túa propia rede",
  ogImageAlt: "Ecosistema de casa intelixente NEXUS en escritorio e móbil",
  description:
    "NEXUS é un ecosistema de casa intelixente que prioriza o local, para Windows, macOS, Linux, Android e iOS. Control directo dos dispositivos pola túa rede local, automatizacións áxiles e métricas de enerxía en directo. Gratuíto para sempre; co plan opcional NEXUS+.",
  nav: [
    ["#features", "Funcións"],
    ["#how", "Como funciona"],
    ["#integrations", "Integracións"],
    ["#pricing", "Prezos"],
    ["#downloads", "Descarga"],
    ["#faq", "Preguntas frecuentes"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Casa intelixente, primeiro o local",
    h1a: "A túa casa.",
    h1b: "Baixo o teu control, en silencio.",
    lead: "Un ecosistema unificado para as túas luces, clima, persianas e sensores — que fala directamente cos dispositivos da túa rede local. Automatizacións áxiles, medición de consumo en directo e un control que segue funcionando cando cae internet.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Última versión",
    shotAlt: "Interface e centro de control de NEXUS",
    trust: [
      "Gratis, dispositivos ilimitados",
      "Non necesita a nube para o control",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Infraestrutura potente. Control sen esforzo.",
    lead: "Cada estado de dispositivo, métrica de consumo e escena automatizada funciona directamente pola túa rede local, sen depender de nubes externas.",
    items: [
      [
        "zap",
        "Automatizacións áxiles",
        "Os escenarios activados por hora ou polo solpor execútanse directamente no teu hardware local — e seguen funcionando de forma fiable en segundo plano no escritorio.",
      ],
      [
        "gauge",
        "Lecturas de enerxía en directo",
        "Le a potencia en vatios e o consumo en tempo real directamente de enchufes e interruptores intelixentes compatibles da túa rede local.",
      ],
      [
        "wifi",
        "Velocidade de rede local",
        "Comunicación LAN directa por HTTP, TCP e UDP coas marcas listadas en Integracións. Sen pasar pola nube no camiño da orde.",
      ],
      [
        "lock",
        "Privacidade desde o deseño",
        "A configuración da túa casa e a telemetría dos dispositivos quedan no teu hardware local. Para usar NEXUS fai falta unha conta; garda a túa configuración na túa propia fila baixo control de acceso a nivel de fila. As ordes aos dispositivos seguen indo pola túa LAN.",
      ],
      [
        "sparkles",
        "Intelixencia NEXUS AI",
        "As ordes locais da casa intelixente son instantáneas e gratuítas para sempre. O asistente de IA na nube, opcional, ofrece suxestións intelixentes cando precises orientación.",
      ],
      [
        "layers",
        "Protocolos locais abertos",
        "Os conectores directos falan na túa LAN. Matter e Zigbee únense a través do teu propio servidor Home Assistant — a sección Integracións indica o que é directo e o que pasa por ponte.",
      ],
    ],
  },
  how: {
    heading: "Da descarga á conexión en minutos.",
    steps: [
      [
        "1",
        "Instala e abre",
        "Descarga o instalador nativo para a túa plataforma (Windows, Linux ou Android). Despois inicia sesión — para usar NEXUS fai falta unha conta, que ademais sincroniza a configuración nas túas pantallas.",
      ],
      [
        "2",
        "Engade os teus dispositivos",
        "Escolle a túa marca, analiza a rede local ou introduce unha IP. As marcas con conector directo falan o seu propio protocolo — sen a nube do fabricante nese camiño.",
      ],
      [
        "3",
        "Vive a túa casa",
        "Escenas, automatizacións programadas e lecturas reais de enerxía — control unificado en escritorio e móbil.",
      ],
    ],
  },
  integrations: {
    heading: "Funciona co que xa tes.",
    lead: "Primeiro protocolos locais e gratuítos. Todo o que non teña conector directo segue funcionando a través da ponte de Home Assistant.",
    groups: [
      [
        "HTTP local — en todas as plataformas",
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
        "Rede local, sen conta nin chave — aplicación de escritorio",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (modo DIY)", "Wake-on-LAN"],
      ],
    ],
    more: "Falta algo? Solicita un conector",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Gratis para usar. NEXUS+ cando queiras máis",
    lead: "",
    currencyNote: "Prezos en USD",
    plans: [
      {
        name: "Gratuíto",
        price: "$0",
        period: "para sempre",
        features: [
          "Dispositivos e estancias ilimitados en todos os protocolos locais compatibles",
          "Cero dependencia da nube: funciona en local na túa propia LAN",
          "30 ordes e accións de dispositivo diarias con NEXUS AI",
          "Automatizacións locais programadas e escenas personalizadas",
          "Sincronización da conta en varios dispositivos (estancias, dispositivos, escenas)",
          "100 % privado: sen rastrexo, sen recollida de datos",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "ao mes",
        badge: "Máis popular",
        features: [
          "Todo o do plan Free, e ademais:",
          "2.000 respostas de NEXUS AI ao mes en lugar de 30 ao día",
          "Pídelle a NEXUS AI que configure escenas e responda en linguaxe natural",
          "Unha conta, válida en todos os dispositivos NEXUS",
          "Proba gratuíta — 3 días no mensual, 7 días no anual; cancela ao final do período",
        ],
        cta: {
          label: "Comeza a túa proba gratuíta",
          monthlyLabel: "Comeza a proba gratuíta de 3 días",
          yearlyLabel: "Comeza a proba gratuíta de 7 días",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Familia",
        price: "Gratuíto",
        period: "para toda a familia",
        badge: "Toda a casa",
        features: [
          "Membros do fogar con acceso baseado en roles — sen límite de membros",
          "Roles de propietario, membro e convidado",
          "Permisos de control, convite e axustes por membro",
          "As escenas e automatizacións sincronízanse entre os teus dispositivos con sesión iniciada",
          "Activo en todo o ecosistema (escritorio e móbil)",
          "Totalmente gratuíto coa túa casa",
        ],
        cta: { label: "Comeza con Family", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Cancela cando queiras desde Facturación na aplicación ou desde a túa conta neste sitio. A cancelación ten efecto ao final do período actual.",
  },
  downloads: {
    heading: "Nativo en cada escritorio. Como na casa no teu móbil.",
    lead: "Sempre gratuíto. Cada instalador inclúe unha suma de verificación SHA-256 publicada para que poidas comprobar o que instalas.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64 bits", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian e Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK asinado",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Versión",
    sizeLabel: "Tamaño",
    webCard: {
      title: "Unha conta, en todo o teu ecosistema",
      desc: "Programas de escritorio para Windows e Linux e a aplicación de Android. Coa sesión iniciada, as túas estancias, dispositivos, escenas e automatizacións quedan sincronizados sen costuras nas túas pantallas.",
      cta: { label: "Descarga NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "En Windows o camiño máis sinxelo é a Microsoft Store: o paquete está asinado por Microsoft e as actualizacións chegan a través da Store. O .exe directo non está asinado, así que Windows pode avisar dun «editor descoñecido» — consulta as sumas de verificación.",
  },
  faq: {
    heading: "As preguntas importantes, respondidas.",
    items: [
      [
        "Funciona NEXUS enteiramente na miña rede local?",
        "Si. NEXUS está construído sobre unha arquitectura estrita que prioriza o local. Os teus dispositivos, estancias, escenas e a telemetría dos sensores procésanse directamente no hardware da túa casa. Mesmo durante unha caída de internet, todos os controis locais, a iluminación e as automatizacións seguen funcionando sen problemas e sen latencia. Iniciar sesión sincroniza de xeito seguro os teus axustes en todas as túas pantallas.",
      ],
      [
        "Teño que instalar NEXUS ou funciona no navegador?",
        "Instala o programa de escritorio (Windows ou Linux) ou a aplicación de Android. NEXUS non se ofrece como aplicación de navegador. As ordes aos dispositivos van pola túa propia rede local. Shelly, Philips Hue, ESPHome, Tasmota, WLED e Home Assistant usan HTTP local no programa de escritorio e en Android. TP-Link Kasa e Yeelight precisan TCP en bruto, así que funcionan no programa de escritorio. Este sitio serve para a conta, as descargas e a facturación.",
      ],
      [
        "Que engade o plan NEXUS+?",
        "O control esencial da casa intelixente —dispositivos e estancias ilimitados, automatizacións sen conexión e paneis locais— é gratuíto. NEXUS+ inclúe todo o de Free, NEXUS AI para escenas e preguntas en linguaxe natural, 2.000 respostas ao mes, conexións avanzadas para engadir dispositivos de Home Assistant e unha conta en cada dispositivo, cunha proba de 3 días no mensual ou de 7 días no anual. As ordes aos dispositivos seguen executándose en local. Os roles do fogar están incluídos coa túa casa sen custo adicional.",
      ],
      [
        "A que conta pertence a miña subscrición NEXUS+?",
        "Ao enderezo de correo usado no pagamento. Inicia sesión neste sitio ou na aplicación antes de pagar: o pagamento abrirase entón co correo da túa conta xa cuberto, e a subscrición aparecerá en cada dispositivo no que inicies sesión. NEXUS+ non se pode mercar sen conta. Se pagas con outro correo, a subscrición gárdase baixo ese correo e non aparecerá na túa conta ata que inicies sesión con el.",
      ],
      [
        "Como se executan as automatizacións e as regras programadas?",
        "O motor de automatización de NEXUS avalía os teus horarios e regras de sensores no dispositivo que mantés en marcha — a aplicación de escritorio queda na bandexa do sistema e execútase as 24 horas, polo que as rutinas de iluminación, enerxía e seguridade nunca esperan por unha nube. As escenas e temporizadores activados desde o teu móbil aplícanse ao instante pola túa LAN. Os novos eventos distribúense polos canais de notificación que actives na páxina Notificacións instantáneas: a franxa da aplicación, notificacións do sistema, ntfy, Telegram ou o teu propio webhook HTTPS.",
      ],
      [
        "Que dispositivos e ecosistemas son compatibles?",
        "NEXUS fala o protocolo local propio de cada dispositivo: Shelly (Gen1 e Gen2+), Tasmota, WLED, ESPHome, Philips Hue e Home Assistant por HTTP local en todas as plataformas, ademais de TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY mode) e Wake-on-LAN pola rede local na aplicación de escritorio, sen conta nin chave. Todo o demais —equipos Matter ou Zigbee— únese a través do teu propio servidor Home Assistant, que NEXUS trata como un único concentrador local. O descubrimento local por IP empareja os dispositivos ao instante, sen nube do fabricante polo medio.",
      ],
      [
        "Como se integran as cámaras de seguridade e os sensores?",
        "NEXUS reúne as túas cámaras de seguridade, detectores de movemento e sensores de entrada nun panel de seguridade centralizado. Podes automatizar modos de privacidade, activar rutinas de vixilancia ao saír de casa e ver cada evento de movemento ou contacto na aplicación — e tamén nos canais de notificación que actives (notificacións do sistema, ntfy, Telegram ou o teu propio webhook).",
      ],
      [
        "Podo cancelar NEXUS+ en calquera momento?",
        "Si, sen complicacións e sen compromisos. Podes cancelar cun só clic en calquera momento: desde os axustes de Conta e facturación da aplicación, a través do noso sitio web ou directamente desde a ligazón do pedido no recibo de facturación enviado por correo. Os teus beneficios premium seguen activos ata o final do ciclo de facturación, sen cobros futuros.",
      ],
      [
        "Podo controlar a miña casa cando estou fóra?",
        "Non a través dunha nube de NEXUS: NEXUS fala cos teus dispositivos directamente na rede da túa casa e non ten relevo. Para acceder desde fóra, pon o teu móbil ou portátil na rede da casa cunha VPN como Tailscale (subnet router) ou WireGuard no teu router; NEXUS funciona entón exactamente como na casa. NEXUS aínda non ten un axuste de enderezo do concentrador, así que a VPN debe facer accesible o teu rango de enderezos locais, e a busca de novos dispositivos só funciona na rede da casa. Nunca expoñas un dispositivo a internet con redirección de portos. A guía paso a paso é docs/REMOTE-ACCESS.md no repositorio.",
      ],
      [
        "Hai versión para iPhone?",
        "Non hai aplicación na App Store, porque NEXUS non usa unha conta de pago de Apple Developer. Cun Mac e un Apple ID gratuíto podes compilalo para o teu propio iPhone (guía: docs/IOS-BUILD.md), e unha versión tamén pode incluír un IPA sen asinar que AltStore ou Sideloadly poden asinar por ti; ese camiño aínda non se verificou nun iPhone real. Un Apple ID gratuíto fai caducar a aplicación aos 7 días, e as notificacións coa aplicación pechada non están dispoñibles en iOS. O concentrador da casa segue sendo a aplicación de escritorio; o iPhone é un cliente.",
      ],
      [
        "O meu dispositivo non está na lista. Que podo facer?",
        "NEXUS só admite dispositivos cun protocolo local documentado; os dispositivos que só funcionan na nube non son compatibles porque NEXUS nunca fala coa nube dun fabricante. A lista de compatibilidade (docs/COMPATIBILITY.md) inclúe tamén Sonoff en modo DIY, WiZ, LIFX, Govee (LAN) e Wake-on-LAN. Cada un ten probas automatizadas de protocolo, pero un modelo só conta como verificado cando alguén informa de que funcionou nun dispositivo real. Escríbenos polo formulario de contacto deste sitio (escolle «New Device / Connector Request») ou por correo: a marca e o modelo, o que esperabas e o que pasou. Dicirnos que un modelo funcionou no teu dispositivo real é o que o marca como verificado; non inclúas nunca contrasinais, chaves locais nin tokens.",
      ],
      [
        "Necesito unha conta? Que pasa se o servidor está caído?",
        "Si: inicias sesión unha vez cunha conta de correo gratuíta para abrir NEXUS. Despois, controlar dispositivos e executar automatizacións ocorre na túa propia rede e segue funcionando sen internet. A conta engade sincronización entre os teus dispositivos, Family e o asistente de IA, que usan servizos gratuítos na nube con límites. Cando un deses non está dispoñible, por exemplo cando o proxecto gratuíto de Supabase se pausou tras ao redor dunha semana sen actividade, as pantallas da nube din que o servidor non é accesible en vez de amosar algo como gardado; os dispositivos, as automatizacións e a bandexa seguen funcionando. Se a cota ou o servizo de IA se esgota, o asistente di que non puido responder.",
      ],
      [
        "Podo facer unha copia de seguridade dos meus axustes e movela a outro dispositivo?",
        "Si. Axustes ten unha sección de copia de seguridade onde podes exportar os teus axustes e automatizacións a un ficheiro JSON e importalo noutro dispositivo ou tras unha reinstalación. Os contrasinais, tokens e chaves locais elimínanse da lista de dispositivos emparellados do ficheiro, así que volve introducilos despois de restaurar. Mantén o ficheiro de copia de seguridade en privado.",
      ],
      [
        "Podo exportar os meus datos de enerxía?",
        "Si. A páxina Enerxía pode exportar as últimas lecturas reais de potencia dos teus dispositivos como ficheiro CSV ou JSON. NEXUS só ten datos dos dispositivos que realmente informan da potencia; se non hai ningún emparellado, non hai nada que exportar.",
      ],
      [
        "Por que me avisa Windows ao executar o instalador?",
        "Instala desde a Microsoft Store e non verás este aviso: Microsoft asina ese paquete durante a certificación e entrega as actualizacións a través da Store. A descarga directa do .exe aínda non está asinada cun certificado comercial, así que SmartScreen pode amosar «editor descoñecido». Podes comparar o ficheiro coas sumas de verificación listadas na sección de descargas antes de executalo. A nosa política de sinatura de código está ligada no pé do sitio.",
      ],
    ],
  },
  about: {
    title: "Sobre NEXUS",
    lead: "Unha plataforma de casa intelixente independente, que prioriza o local, deseñada para a velocidade, a privacidade absoluta e a verdadeira propiedade do hardware. Ao falar directamente cos teus dispositivos pola túa rede doméstica, NEXUS elimina para sempre a dependencia da nube.",
    manifesto: {
      heading: "Por que construímos NEXUS",
      text: "A industria moderna da casa intelixente colleu un mal camiño. Os ecosistemas propietarios obrigaron os propietarios a subscricións obrigatorias, latencia dependente da nube e un invasivo rastrexo de telemetría. Cando cae a túa conexión a internet, o interruptor do teu salón non debería deixar de funcionar. Construímos NEXUS porque cremos que a túa casa é o teu santuario: o plano da túa vivenda, o estado das túas cámaras e as túas rutinas familiares diarias pertencen estritamente ao teu propio hardware.",
    },
    pillars: [
      {
        title: "Velocidade, primeiro o local",
        desc: "Cada automatización e orde execútase pola túa LAN local en milisegundos. Sen viaxes de ida e volta a servidores remotos na nube, latencia cero.",
      },
      {
        title: "Privacidade sen concesións",
        desc: "Sen telemetría analítica, sen perfís de comportamento e sen vender as túas rutinas privadas. Fai falta unha conta; a túa configuración gárdase na túa propia fila de conta protexida a nivel de fila. As ordes aos dispositivos seguen na túa LAN.",
      },
      {
        title: "Sen dependencia de fabricante",
        desc: "Primeiro protocolos locais abertos: Shelly, Philips Hue, ESPHome, Tasmota e WLED responden directamente a NEXUS, e todo o demais únese a través do teu propio servidor Home Assistant en lugar dunha nube de fabricante.",
      },
      {
        title: "SaaS honesto e sostible",
        desc: "A xestión básica da casa intelixente é totalmente gratuíta e ilimitada para sempre. NEXUS+ é o plan de NEXUS AI e axuda a cubrir ese uso da nube.",
      },
    ],
    architecture: {
      heading: "Deseñado para a fiabilidade",
      lead: "NEXUS mantén un motor de escritorio lixeiro na bandexa do sistema para que os horarios e as regras dos sensores se sigan avaliando mentres o ordenador está acendido, e a aplicación móbil ábrese directamente sobre a mesma rede local.",
      items: [
        {
          icon: "layers",
          title: "Escritorio",
          desc: "As aplicacións de Windows, macOS e Linux quedan na bandexa do sistema e manteñen en marcha os horarios locais e as regras dos sensores mentres o ordenador está acendido. Windows e Linux envíanse como instaladores listos; macOS compílase desde o código fonte (sen asinar: clic dereito → Open).",
        },
        {
          icon: "wifi",
          title: "Móbil",
          desc: "As aplicacións de Android e iOS ábrense sobre a mesma rede local; as ordes aos dispositivos seguen indo pola túa LAN. Android envíase como APK asinado; iOS compílase desde o código fonte con Xcode e un Apple ID gratuíto.",
        },
        {
          icon: "lock",
          title: "Conta",
          desc: "Fai falta unha conta para que estancias, dispositivos e escenas coincidan en cada pantalla. As ordes aos dispositivos non saen da túa rede doméstica.",
        },
      ],
    },
    linksTitle: "Ligazóns útiles",
  },
  footer: {
    tagline:
      "Controla toda a túa casa intelixente directamente pola túa rede local — sen dependencia de fabricante e sen depender da nube. Mesmo cando cae internet, a túa casa nunca para.",
    product: "Produto",
    productLinks: [
      ["Funcións", "#features"],
      ["Prezos", "#pricing"],
      ["Descarga", "#downloads"],
      ["Preguntas frecuentes", "#faq"],
      ["Sobre nós", "/about"],
    ],
    account: "Clientes e soporte",
    accountLinks: [
      ["Contacto e soporte técnico", "javascript:nxOpenContactModal('Technical Support')"],
      ["Notas de versión e comunidade", RELEASES_URL],
      ["Descarga as aplicacións", "#downloads"],
    ],
    legal: "Legal",
    legalLinks: [
      ["Privacidade", "/privacy"],
      ["Termos", "/terms"],
      ["Reembolsos", "/refund"],
      ["Sinatura de código", "/code-signing"],
      ["Contribúe", "/contribute"],
    ],
    rights: "Todos os dereitos reservados.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
