import { RELEASES_URL } from "./site-constants.mjs";

export const ca = {
  title: "NEXUS — La teva llar intel·ligent, gestionada a la teva pròpia xarxa",
  ogImageAlt: "L'ecosistema de llar intel·ligent NEXUS a l'ordinador i al mòbil",
  description:
    "NEXUS és un ecosistema de llar intel·ligent «local primer» per a Windows, macOS, Linux, Android i iOS. Control directe dels dispositius a través de la teva xarxa local, automatitzacions àgils i mesures d'energia en directe. Gratuït per sempre; pla NEXUS+ opcional.",
  nav: [
    ["#features", "Funcions"],
    ["#how", "Com funciona"],
    ["#integrations", "Integracions"],
    ["#pricing", "Preus"],
    ["#downloads", "Descàrrega"],
    ["#faq", "Preguntes freqüents"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Llar intel·ligent local primer",
    h1a: "La teva llar.",
    h1b: "Sota el teu control, en silenci.",
    lead: "Un únic ecosistema per a llums, climatització, persianes i sensors, que parla directament amb els dispositius de la teva xarxa local. Automatitzacions àgils, mesura d'energia en directe i un control que continua funcionant quan cau internet.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Darrera versió",
    shotAlt: "Interfície i centre de control de NEXUS",
    trust: [
      "Gratuït, dispositius il·limitats",
      "Cap núvol necessari per al control",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Infraestructura potent. Control senzill.",
    lead: "Cada estat de dispositiu, mesura d'energia i escena automatitzada s'executa directament a la teva xarxa local, sense dependències de núvols externs.",
    items: [
      [
        "zap",
        "Automatitzacions àgils",
        "Els escenaris activats per hora o per posta de sol s'executen directament al teu maquinari local i continuen de forma fiable en segon pla a l'ordinador.",
      ],
      [
        "gauge",
        "Lectures d'energia en directe",
        "Llegeix en temps real els watts i el consum directament dels endolls i interruptors intel·ligents compatibles de la teva xarxa local.",
      ],
      [
        "wifi",
        "Velocitat de xarxa local",
        "Comunicació directa per LAN mitjançant HTTP, TCP i UDP amb les marques que apareixen a Integracions. Cap salt pel núvol en el camí de les ordres.",
      ],
      [
        "lock",
        "Privadesa des del disseny",
        "La configuració de la teva llar i la telemetria dels dispositius es queden al teu maquinari local. Cal un compte per utilitzar NEXUS; hi desa la teva configuració a la teva pròpia fila, sota control d'accés a nivell de fila. Les ordres als dispositius continuen anant per la teva LAN.",
      ],
      [
        "sparkles",
        "Intel·ligència NEXUS AI",
        "Les ordres locals de la llar intel·ligent són instantànies i gratuïtes per sempre. L'assistent d'IA al núvol, opcional, t'ofereix suggeriments intel·ligents quan necessites orientació.",
      ],
      [
        "layers",
        "Protocols locals oberts",
        "Els connectors directes parlen per la teva LAN. Matter i Zigbee s'hi afegeixen a través del teu propi servidor Home Assistant; la secció Integracions detalla què és directe i què passa per pont.",
      ],
    ],
  },
  how: {
    heading: "De la descàrrega a la connexió en pocs minuts.",
    steps: [
      [
        "1",
        "Instal·la i obre",
        "Descarrega l'instal·lador natiu per a la teva plataforma (Windows, Linux o Android). Després inicia la sessió: cal un compte per utilitzar NEXUS, i també sincronitza la configuració entre les teves pantalles.",
      ],
      [
        "2",
        "Afegeix els teus dispositius",
        "Tria la teva marca, escaneja la xarxa local o introdueix una IP. Les marques amb connector directe parlen el seu propi protocol, sense cap núvol del fabricant pel mig.",
      ],
      [
        "3",
        "Viu la teva llar",
        "Escenes, automatitzacions programades i lectures d'energia reals: control unificat a l'ordinador i al mòbil.",
      ],
    ],
  },
  integrations: {
    heading: "Funciona amb el que ja tens.",
    lead: "Primer, protocols locals i gratuïts. Tot allò que no té connector directe continua funcionant a través del pont de Home Assistant.",
    groups: [
      [
        "HTTP local — a totes les plataformes",
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
        "Xarxa local, sense compte ni clau — aplicació d'escriptori",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (mode DIY)", "Wake-on-LAN"],
      ],
    ],
    more: "Et falta alguna cosa? Sol·licita un connector",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Gratuït. NEXUS+ quan en vulguis més",
    lead: "",
    currencyNote: "Preus en USD",
    plans: [
      {
        name: "Free",
        price: "$0",
        period: "per sempre",
        features: [
          "Dispositius i estances il·limitats amb tots els protocols locals compatibles",
          "Cap dependència del núvol: funciona localment a la teva pròpia LAN",
          "30 ordres i accions de dispositius diàries amb NEXUS AI",
          "Automatitzacions locals programades i escenes personalitzades",
          "Sincronització del compte entre dispositius (estances, dispositius, escenes)",
          "100% privat: sense seguiment ni recollida de dades",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "al mes",
        badge: "El més popular",
        features: [
          "Tot el del nivell Free, i a més:",
          "2.000 respostes de NEXUS AI al mes en lloc de 30 al dia",
          "Demana a NEXUS AI que configuri escenes i et respongui en llenguatge natural",
          "Un sol compte, vàlid a tots els dispositius NEXUS",
          "Prova gratuïta: 3 dies amb el pla mensual, 7 amb l'anual; cancel·la quan acabi el període",
        ],
        cta: {
          label: "Comença la prova gratuïta",
          monthlyLabel: "Comença la prova gratuïta de 3 dies",
          yearlyLabel: "Comença la prova gratuïta de 7 dies",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Family",
        price: "Free",
        period: "per a tota la família",
        badge: "Tota la llar",
        features: [
          "Membres de la llar amb accés segons el seu rol, sense límit de membres",
          "Rols de propietari, membre i convidat",
          "Permisos de control, invitació i configuració per a cada membre",
          "Les escenes i automatitzacions se sincronitzen entre els teus propis dispositius amb la sessió iniciada",
          "Actiu a tot l'ecosistema (ordinador i mòbil)",
          "Totalment gratuït amb la teva llar",
        ],
        cta: { label: "Comença amb Family", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Cancel·la quan vulguis des de Facturació a l'aplicació o des del teu compte en aquest lloc. La cancel·lació té efecte al final del període en curs.",
  },
  downloads: {
    heading: "Natiu a cada ordinador. A casa al teu mòbil.",
    lead: "Sempre gratuït. Cada instal·lador inclou una suma de verificació SHA-256 publicada perquè puguis comprovar què instal·les.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64 bits", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian i Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK signat",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Versió",
    sizeLabel: "Mida",
    webCard: {
      title: "Un sol compte, a tot el teu ecosistema",
      desc: "Els programes d'escriptori per a Windows i Linux i l'aplicació d'Android. Amb la sessió iniciada, les teves estances, dispositius, escenes i automatitzacions es mantenen sincronitzats entre les teves pantalles.",
      cta: { label: "Descarrega NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "A Windows, el camí més fàcil és la Microsoft Store: el paquet està signat per Microsoft i les actualitzacions arriben per la Store. L'.exe directe no està signat, de manera que Windows pot avisar d'un «editor desconegut»; consulta les sumes de verificació.",
  },
  faq: {
    heading: "Les preguntes importants, amb resposta.",
    items: [
      [
        "NEXUS funciona totalment a la meva xarxa local?",
        "Sí. NEXUS es basa en una arquitectura «local primer» estricta. Els teus dispositius, estances, escenes i la telemetria dels sensors es processen directament al maquinari de casa teva. Fins i tot durant una caiguda d'internet, tots els controls locals, la il·luminació i les automatitzacions continuen funcionant sense problemes i sense latència. Iniciar la sessió sincronitza de manera segura la teva configuració entre totes les teves pantalles.",
      ],
      [
        "Cal instal·lar NEXUS o funciona al navegador?",
        "Instal·la el programa d'escriptori (Windows o Linux) o l'aplicació d'Android. NEXUS no s'ofereix com a aplicació de navegador. Les ordres als dispositius viatgen per la teva pròpia xarxa local. Shelly, Philips Hue, ESPHome, Tasmota, WLED i Home Assistant fan servir HTTP local al programa d'escriptori i a Android. TP-Link Kasa i Yeelight necessiten TCP pur, de manera que funcionen al programa d'escriptori. Aquest lloc serveix per al compte, les descàrregues i la facturació.",
      ],
      [
        "Què afegeix el pla NEXUS+?",
        "El control essencial de la llar intel·ligent (dispositius i estances il·limitats, automatitzacions sense connexió i panells locals) és gratuït. NEXUS+ inclou tot el de Free, NEXUS AI per a escenes i preguntes en llenguatge natural, 2.000 respostes al mes, connexions avançades per afegir dispositius de Home Assistant i un compte a cada dispositiu, amb una prova de 3 dies al pla mensual o de 7 dies a l'anual. Les ordres als dispositius continuen executant-se en local. Els rols de la llar s'inclouen amb la teva llar sense cap cost addicional.",
      ],
      [
        "A quin compte pertany la meva subscripció a NEXUS+?",
        "A l'adreça de correu electrònic utilitzada en el pagament. Inicia la sessió en aquest lloc o a l'aplicació abans de pagar: el pagament s'obre amb el correu del teu compte ja emplenat i la subscripció apareix a tots els dispositius on iniciïs la sessió. NEXUS+ no es pot comprar sense un compte. Si pagues amb un altre correu, la subscripció es desa sota aquest correu i no apareixerà al teu compte fins que hi iniciïs la sessió.",
      ],
      [
        "Com s'executen les automatitzacions i les regles programades?",
        "El motor d'automatització de NEXUS avalua els teus horaris i regles de sensors al dispositiu que mantens en marxa: l'aplicació d'escriptori es queda a la safata del sistema i s'executa les 24 hores, de manera que les rutines d'il·luminació, energia i seguretat mai no esperen un núvol. Les escenes i els temporitzadors activats des del mòbil s'apliquen a l'instant per la teva LAN. Els nous esdeveniments es distribueixen als canals de notificació que activis a la pàgina de Notificacions instantànies: la franja de l'aplicació, les notificacions del sistema, ntfy, Telegram o el teu propi webhook HTTPS.",
      ],
      [
        "Quins dispositius i ecosistemes són compatibles?",
        "NEXUS parla el protocol local propi de cada dispositiu: Shelly (Gen1 i Gen2+), Tasmota, WLED, ESPHome, Philips Hue i Home Assistant per HTTP local a totes les plataformes, i a més TP-Link Kasa, Yeelight, WiZ, Sonoff (mode DIY) i Wake-on-LAN per la xarxa local a l'aplicació d'escriptori, sense compte ni clau. Tota la resta, com ara equips Matter o Zigbee, s'hi afegeix a través del teu propi servidor Home Assistant, que NEXUS tracta com un únic concentrador local. El descobriment per IP local vincula els dispositius a l'instant, sense cap núvol de fabricant pel mig.",
      ],
      [
        "Com s'integren les càmeres de seguretat i els sensors?",
        "NEXUS agrupa les teves càmeres de seguretat, detectors de moviment i sensors d'entrada en un tauler de seguretat centralitzat. Pots automatitzar modes de privadesa, activar rutines de vigilància en sortir de casa i veure cada moviment o esdeveniment de contacte a l'aplicació, i també als canals de notificació que activis (notificacions del sistema, ntfy, Telegram o el teu propi webhook).",
      ],
      [
        "Puc cancel·lar NEXUS+ quan vulgui?",
        "Sí, sense complicacions i sense compromisos. Pots cancel·lar amb un sol clic en qualsevol moment: des de la configuració de Compte i facturació de l'aplicació, a través del nostre lloc web o directament des de l'enllaç de la comanda que hi ha al rebut de facturació enviat per correu. Els avantatges premium continuen actius fins al final del cicle de facturació, sense cap càrrec futur.",
      ],
      [
        "Puc controlar la llar quan sóc fora?",
        "No a través d'un núvol de NEXUS: NEXUS parla amb els teus dispositius directament a la xarxa de casa i no té cap relé. Per accedir-hi des de fora, connecta el mòbil o l'ordinador a la xarxa de casa amb una VPN com Tailscale (subnet router) o WireGuard al router; NEXUS funciona aleshores exactament com a casa. NEXUS encara no té cap paràmetre d'adreça del concentrador, de manera que la VPN ha de fer accessible el teu rang d'adreces local, i l'escaneig de nous dispositius només funciona a la xarxa de casa. No exposis mai un dispositiu a internet amb redirecció de ports. La guia pas a pas és docs/REMOTE-ACCESS.md al repositori.",
      ],
      [
        "Hi ha una versió per a iPhone?",
        "No hi ha cap aplicació a l'App Store, perquè NEXUS no utilitza un compte de pagament d'Apple Developer. Amb un Mac i un Apple ID gratuït pots compilar-la per al teu propi iPhone (guia: docs/IOS-BUILD.md), i una versió també pot adjuntar un IPA sense signar que AltStore o Sideloadly poden signar per tu; aquest camí encara no s'ha verificat en un iPhone real. Amb un Apple ID gratuït l'aplicació caduca als 7 dies, i a iOS no hi ha notificacions quan l'aplicació és tancada. El concentrador de la llar continua sent l'aplicació d'escriptori; l'iPhone és un client.",
      ],
      [
        "El meu dispositiu no és a la llista. Què puc fer?",
        "NEXUS només és compatible amb dispositius que tenen un protocol local documentat; els dispositius només de núvol no són compatibles perquè NEXUS mai no parla amb el núvol d'un fabricant. La llista de compatibilitat (docs/COMPATIBILITY.md) també inclou Sonoff en mode DIY, WiZ, LIFX, Govee (LAN) i Wake-on-LAN. Cadascun té proves automatitzades de protocol, però un model només compta com a verificat quan algú informa que ha funcionat en un dispositiu real. Escriu-nos amb el formulari de contacte d'aquest lloc (tria «New Device / Connector Request») o per correu electrònic: la marca i el model, què esperaves i què ha passat. Que ens diguis que un model ha funcionat al teu dispositiu real és el que el marca com a verificat; no hi incloguis mai contrasenyes, claus locals ni tokens.",
      ],
      [
        "Necessito un compte? Què passa si el servidor no funciona?",
        "Sí: inicies la sessió una sola vegada amb un compte de correu gratuït per obrir NEXUS. Després, el control dels dispositius i l'execució de les automatitzacions passen a la teva pròpia xarxa i continuen funcionant sense internet. El compte afegeix la sincronització entre dispositius, Family i l'assistent d'IA, que fan servir serveis al núvol gratuïts amb límits. Quan un d'ells no està disponible, per exemple quan el projecte gratuït de Supabase s'ha posat en pausa després d'una setmana aproximada sense activitat, les pantalles del núvol diuen que el servidor no és accessible en lloc de mostrar quelcom com a desat; els dispositius, les automatitzacions i la safata continuen funcionant. Si la quota o el servei d'IA s'ha esgotat, l'assistent diu que no ha pogut respondre.",
      ],
      [
        "Puc fer una còpia de seguretat de la configuració i passar-la a un altre dispositiu?",
        "Sí. La Configuració té una secció de còpia de seguretat on pots exportar la configuració i les automatitzacions a un fitxer JSON i importar-lo en un altre dispositiu o després d'una reinstal·lació. Les contrasenyes, els tokens i les claus locals s'eliminen de la llista de dispositius vinculats del fitxer, de manera que cal tornar-los a introduir després de restaurar. Guarda el fitxer de còpia de seguretat en privat.",
      ],
      [
        "Puc exportar les meves dades d'energia?",
        "Sí. La pàgina d'Energia pot exportar les darreres lectures reals de potència dels teus dispositius en un fitxer CSV o JSON. NEXUS només té dades dels dispositius que realment informen de la potència; si no n'hi ha cap de vinculat, no hi ha res a exportar.",
      ],
      [
        "Per què Windows m'avisa quan executo l'instal·lador?",
        "Si l'instal·les des de la Microsoft Store no veuràs aquest avís: Microsoft signa aquest paquet durant la certificació i lliura les actualitzacions per la Store. La descàrrega directa de l'.exe encara no està signada amb un certificat comercial, de manera que SmartScreen pot mostrar «editor desconegut». Abans d'executar-lo, pots comparar el fitxer amb les sumes de verificació que apareixen a la secció de descàrregues. La nostra política de signatura de codi és enllaçada al peu del lloc.",
      ],
    ],
  },
  about: {
    title: "Sobre NEXUS",
    lead: "Una plataforma de llar intel·ligent independent i «local primer», pensada per a la velocitat, la privadesa absoluta i la veritable propietat del maquinari. En parlar directament amb els teus dispositius per la teva pròpia xarxa domèstica, NEXUS elimina per sempre la dependència d'un núvol.",
    manifesto: {
      heading: "Per què hem creat NEXUS",
      text: "La indústria moderna de la llar intel·ligent va prendre un mal camí. Els ecosistemes propietaris van obligar els propietaris a subscripcions obligatòries, retards dependents del núvol i un seguiment invasiu de la telemetria. Quan cau la teva connexió a internet, l'interruptor del teu menjador no hauria de deixar de funcionar. Hem creat NEXUS perquè creiem que la teva llar és el teu santuari: el plànol de casa, l'estat de les teves càmeres i les rutines diàries de la teva família pertanyen estrictament al teu propi maquinari.",
    },
    pillars: [
      {
        title: "Velocitat local primer",
        desc: "Cada automatització i cada ordre s'executa per la teva LAN local en mil·lisegons. Sense viatges a servidors remots al núvol, latència zero.",
      },
      {
        title: "Privadesa sense concessions",
        desc: "Sense telemetria d'analítica, sense perfilat de comportament i sense vendre les teves rutines privades. Cal un compte; la teva configuració es desa a la fila del teu propi compte, protegida a nivell de fila. Les ordres als dispositius continuen a la teva LAN.",
      },
      {
        title: "Sense dependència de fabricants",
        desc: "Primer, protocols locals oberts: Shelly, Philips Hue, ESPHome, Tasmota i WLED responen directament a NEXUS, i tota la resta s'hi afegeix a través del teu propi servidor Home Assistant en lloc d'un núvol de fabricant.",
      },
      {
        title: "Un SaaS honest i sostenible",
        desc: "La gestió bàsica de la llar intel·ligent és totalment gratuïta i il·limitada per sempre. NEXUS+ és el pla de NEXUS AI i ajuda a cobrir aquest ús del núvol.",
      },
    ],
    architecture: {
      heading: "Dissenyat per ser fiable",
      lead: "NEXUS manté un motor d'escriptori lleuger a la safata del sistema perquè els horaris i les regles de sensors continuïn avaluant-se mentre l'ordinador és encès, i l'aplicació mòbil s'obre directament sobre la mateixa xarxa local.",
      items: [
        {
          icon: "layers",
          title: "Escriptori",
          desc: "Les aplicacions de Windows, macOS i Linux es queden a la safata del sistema i mantenen en marxa els horaris locals i les regles de sensors mentre l'ordinador és encès. Windows i Linux s'ofereixen com a instal·ladors llestos; macOS es compila des del codi font (sense signar: clic dret → Obre).",
        },
        {
          icon: "wifi",
          title: "Mòbil",
          desc: "Les aplicacions d'Android i iOS s'obren sobre la mateixa xarxa local; les ordres als dispositius continuen anant per la teva LAN. Android s'ofereix com a APK signat; iOS es compila des del codi font amb Xcode i un Apple ID gratuït.",
        },
        {
          icon: "lock",
          title: "Compte",
          desc: "Cal un compte perquè les estances, els dispositius i les escenes coincideixin a cada pantalla. Les ordres als dispositius no surten de la teva xarxa domèstica.",
        },
      ],
    },
    linksTitle: "Enllaços útils",
  },
  footer: {
    tagline:
      "Controla tota la teva llar intel·ligent directament per la teva xarxa local, sense dependència de cap fabricant ni de cap núvol. Fins i tot quan cau internet, casa teva no s'atura mai.",
    product: "Producte",
    productLinks: [
      ["Funcions", "#features"],
      ["Preus", "#pricing"],
      ["Descàrrega", "#downloads"],
      ["Preguntes freqüents", "#faq"],
      ["Sobre nosaltres", "/about"],
    ],
    account: "Clients i assistència",
    accountLinks: [
      ["Contacte i assistència tècnica", "javascript:nxOpenContactModal('Technical Support')"],
      ["Notes de versió i comunitat", RELEASES_URL],
      ["Descarrega les aplicacions", "#downloads"],
    ],
    legal: "Legal",
    legalLinks: [
      ["Privadesa", "/privacy"],
      ["Condicions", "/terms"],
      ["Reemborsaments", "/refund"],
      ["Signatura de codi", "/code-signing"],
      ["Contribueix", "/contribute"],
    ],
    rights: "Tots els drets reservats.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
