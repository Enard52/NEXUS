import { RELEASES_URL } from "./site-constants.mjs";

export const af = {
  title: "NEXUS — Jou slimhuis, bestuur op jou eie netwerk",
  ogImageAlt: "NEXUS-slimhuis-ekosisteem op rekenaar en foon",
  description:
    "NEXUS is 'n plaaslik-eerste slimhuis-ekosisteem vir Windows, macOS, Linux, Android en iOS. Direkte toestelbeheer oor jou eie plaaslike netwerk, vinnige outomatiserings en lewendige energiemetings. Vir ewig gratis; opsionele NEXUS+-plan.",
  nav: [
    ["#features", "Kenmerke"],
    ["#how", "Hoe dit werk"],
    ["#integrations", "Integrasies"],
    ["#pricing", "Pryse"],
    ["#downloads", "Laai af"],
    ["#faq", "Gereelde vrae"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Plaaslik-eerste slimhuis",
    h1a: "Jou huis.",
    h1b: "Stilweg onder jou beheer.",
    lead: "Een verenigde ekosisteem vir jou ligte, klimaat, skerms en sensors — wat direk met die toestelle op jou eie plaaslike netwerk praat. Vinnige outomatiserings, lewendige kragmeting en beheer wat bly werk wanneer die internet afgaan.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Nuutste weergawe",
    shotAlt: "NEXUS-koppelvlak en beheersentrum",
    trust: [
      "Gratis, onbeperkte toestelle",
      "Geen wolk nodig vir beheer nie",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Kragtige infrastruktuur. Moeitelose beheer.",
    lead: "Elke toestelstatus, kragmeting en outomatiese toneel loop direk oor jou plaaslike netwerk, sonder eksterne wolkafhanklikhede.",
    items: [
      [
        "zap",
        "Vinnige outomatiserings",
        "Tyd- en sonsondergang-geaktiveerde scenario's loop direk op jou plaaslike hardeware — en gaan betroubaar op die agtergrond voort op die rekenaar.",
      ],
      [
        "gauge",
        "Lewendige energiemetings",
        "Lees intydse watt en kragverbruik direk van ondersteunde slim-proppe en skakelaars op jou plaaslike netwerk.",
      ],
      [
        "wifi",
        "Plaaslike netwerkspoed",
        "Direkte LAN-kommunikasie oor HTTP, TCP en UDP met die handelsmerke wat onder Integrasies gelys word. Geen wolk-omweg in die opdragpad nie.",
      ],
      [
        "lock",
        "Privaatheid by ontwerp",
        "Jou huisopstelling en toestel-telemetrie bly op jou plaaslike hardeware. 'n Rekening is nodig om NEXUS te gebruik; dit stoor jou opstelling in jou eie ry onder toegangsbeheer op rynvlak. Toestelopdragte gaan steeds oor jou LAN.",
      ],
      [
        "sparkles",
        "NEXUS AI-intelligensie",
        "Plaaslike slimhuis-opdragte is onmiddellik en vir ewig gratis. 'n Opsionele wolk-KI-assistent bied slim voorstelle wanneer jy leiding nodig het.",
      ],
      [
        "layers",
        "Oop plaaslike protokolle",
        "Direkte koppelaars praat op jou LAN. Matter en Zigbee sluit aan via jou eie Home Assistant-bediener — die afdeling Integrasies lys wat direk teenoor oorbrug is.",
      ],
    ],
  },
  how: {
    heading: "Van aflaai tot gekoppel in minute.",
    steps: [
      [
        "1",
        "Installeer en maak oop",
        "Laai die inheemse installeerder vir jou platform af (Windows, Linux of Android). Meld dan aan — 'n rekening is nodig om NEXUS te gebruik, en dit sinkroniseer ook die opstelling oor jou skerms.",
      ],
      [
        "2",
        "Voeg jou toestelle by",
        "Kies jou handelsmerk, skandeer die plaaslike netwerk of voer 'n IP in. Handelsmerke met 'n direkte koppelaar praat hul eie protokol — geen verkoperwolk in daardie pad nie.",
      ],
      [
        "3",
        "Leef jou huis",
        "Tonele, geskeduleerde outomatiserings en regte energiemetings — verenigde beheer oor rekenaar en foon.",
      ],
    ],
  },
  integrations: {
    heading: "Werk met wat jy reeds het.",
    lead: "Gratis, plaaslike protokolle eerste. Enigiets sonder 'n direkte koppelaar werk steeds deur die Home Assistant-brug.",
    groups: [
      [
        "Plaaslike HTTP — op elke platform",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Philips Hue-brug",
          "Home Assistant",
        ],
      ],
      [
        "Plaaslike netwerk, geen rekening of sleutel nodig nie — rekenaartoepassing",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY-modus)", "Wake-on-LAN"],
      ],
    ],
    more: "Ontbreek iets? Versoek 'n koppelaar",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Gratis om te gebruik. NEXUS+ wanneer jy meer wil hê",
    lead: "",
    currencyNote: "Pryse in USD",
    plans: [
      {
        name: "Free",
        price: "$0",
        period: "vir ewig",
        features: [
          "Onbeperkte toestelle en kamers oor elke ondersteunde plaaslike protokol",
          "Geen wolkafhanklikheid nie: loop plaaslik op jou eie LAN",
          "30 daaglikse NEXUS AI-opdragte en toestelhandelinge",
          "Geskeduleerde plaaslike outomatiserings en pasgemaakte tonele",
          "Multi-toestel-rekeningsinkronisering (kamers, toestelle, tonele)",
          "100% privaat: geen opsporing, geen data-insameling nie",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "per maand",
        badge: "Gewildste",
        features: [
          "Alles in die Free-vlak, plus:",
          "2 000 NEXUS AI-antwoorde per maand in plaas van 30 per dag",
          "Vra NEXUS AI om tonele te stel en in gewone taal te antwoord",
          "Een rekening, geldig op elke NEXUS-toestel",
          "Gratis proeftydperk — 3 dae maandeliks, 7 dae jaarliks; kanselleer aan die einde van die tydperk",
        ],
        cta: {
          label: "Begin jou gratis proeftydperk",
          monthlyLabel: "Begin 3-dae gratis proeftydperk",
          yearlyLabel: "Begin 7-dae gratis proeftydperk",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Family",
        price: "Free",
        period: "vir die hele gesin",
        badge: "Hele huis",
        features: [
          "Huishoudelede met rolgebaseerde toegang — geen limiet op lede nie",
          "Eienaar-, lid- en gasrolle",
          "Beheer-, nooi- en instellingsregte per lid",
          "Tonele en outomatiserings sinkroniseer oor jou eie aangemelde toestelle",
          "Aktief oor die hele ekosisteem (rekenaar en foon)",
          "Heeltemal gratis saam met jou huis",
        ],
        cta: { label: "Begin met Family", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Kanselleer enige tyd onder Billing in die toepassing of vanaf jou rekening op hierdie webwerf. Kansellasie tree aan die einde van die huidige tydperk in werking.",
  },
  downloads: {
    heading: "Inheems op elke rekenaar. Tuis op jou foon.",
    lead: "Altyd gratis. Elke installeerder kom met 'n gepubliseerde SHA-256-kontrolesom sodat jy kan verifieer wat jy installeer.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian en Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · onderteken APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Weergawe",
    sizeLabel: "Grootte",
    webCard: {
      title: "Een rekening, oor jou hele ekosisteem",
      desc: "Windows- en Linux-rekenaarprogramme en die Android-toepassing. Wanneer jy aangemeld is, bly jou kamers, toestelle, tonele en outomatiserings naatloos gesinkroniseer oor jou skerms.",
      cta: { label: "Laai NEXUS af", href: "#downloads" },
    },
    smartScreenNote:
      "Op Windows is die maklikste roete die Microsoft Store: die pakket is deur Microsoft onderteken en opdaterings kom deur die Store. Die direkte .exe is nie onderteken nie, so Windows kan waarsku oor 'n “onbekende uitgewer” — sien kontrolesomme.",
  },
  faq: {
    heading: "Die belangrike vrae, beantwoord.",
    items: [
      [
        "Werk NEXUS heeltemal op my plaaslike netwerk?",
        "Ja. NEXUS is gebou op 'n streng plaaslik-eerste argitektuur. Jou toestelle, kamers, tonele en sensor-telemetrie word direk op jou eie tuishardeware verwerk. Selfs tydens internetonderbrekings bly alle plaaslike beheer, beligting en outomatiserings naatloos en sonder vertraging werk. Aanmelding sinkroniseer jou instellings veilig oor al jou skerms.",
      ],
      [
        "Moet ek NEXUS installeer, of loop dit in die blaaier?",
        "Installeer die rekenaarprogram (Windows of Linux) of die Android-toepassing. NEXUS word nie as 'n blaaier-toepassing aangebied nie. Toestelopdragte gaan oor jou eie plaaslike netwerk. Shelly, Philips Hue, ESPHome, Tasmota, WLED en Home Assistant gebruik plaaslike HTTP in die rekenaarprogram en op Android. TP-Link Kasa en Yeelight benodig rou TCP, so hulle loop in die rekenaarprogram. Hierdie webwerf is vir die rekening, aflaaie en fakturering.",
      ],
      [
        "Wat voeg die NEXUS+-plan by?",
        "Noodsaaklike slimhuisbeheer — onbeperkte toestelle, kamers, vanlyn-outomatiserings en plaaslike paneelborde — is gratis. NEXUS+ sluit alles in Free in, NEXUS AI vir tonele en vrae in gewone taal, 2 000 antwoorde per maand, gevorderde koppelings om Home Assistant-toestelle by te voeg, en een rekening op elke toestel, met 'n 3-dae maandelikse of 7-dae jaarlikse proeftydperk. Toestelopdragte loop steeds plaaslik. Huishoudelike rolle is sonder ekstra koste by jou huis ingesluit.",
      ],
      [
        "Aan watter rekening behoort my NEXUS+-intekening?",
        "Die e-posadres wat by afrekening gebruik is. Meld aan op hierdie webwerf of in die toepassing voordat jy betaal: afrekening maak dan oop met jou rekening se e-pos reeds ingevul, en die intekening verskyn op elke toestel waarop jy aanmeld. NEXUS+ kan nie sonder 'n rekening gekoop word nie. As jy met 'n ander e-pos betaal, word die intekening onder daardie e-pos gestoor en sal dit nie op jou rekening verskyn totdat jy daarmee aanmeld nie.",
      ],
      [
        "Hoe loop outomatiserings en geskeduleerde reëls?",
        "Die NEXUS-outomatiseringsenjin evalueer jou skedules en sensorreëls op die toestel wat jy aan die gang hou — die rekenaartoepassing bly in die stelselbalk en voer dag en nag uit, so beligting-, energie- en sekuriteitsroetines wag nooit op 'n wolk nie. Tonele en taimers wat vanaf jou foon geaktiveer word, geld onmiddellik oor jou LAN. Nuwe gebeure word versprei na die kennisgewingkanale wat jy op die Instant Notifications-bladsy aktiveer: die strook in die toepassing, stelselkennisgewings, ntfy, Telegram of jou eie HTTPS-webhook.",
      ],
      [
        "Watter toestelle en ekosisteme word ondersteun?",
        "NEXUS praat elke toestel se eie plaaslike protokol: Shelly (Gen1 en Gen2+), Tasmota, WLED, ESPHome, Philips Hue en Home Assistant oor plaaslike HTTP op elke platform, plus TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY-modus) en Wake-on-LAN oor die plaaslike netwerk in die rekenaartoepassing, sonder rekening of sleutel. Alles anders — Matter- of Zigbee-toerusting — sluit aan deur jou eie Home Assistant-bediener, wat NEXUS as 'n enkele plaaslike spilpunt beskou. Plaaslike IP-ontdekking koppel toestelle onmiddellik, sonder 'n verkoperwolk tussenin.",
      ],
      [
        "Hoe word sekuriteitskameras en sensors geïntegreer?",
        "NEXUS bring jou sekuriteitskameras, bewegingsmelders en toegangsensors saam in 'n gesentraliseerde sekuriteitspaneelbord. Jy kan privaatheidsmodusse outomatiseer, toesigroetines aktiveer wanneer jy die huis verlaat, en elke beweging- of kontakgebeurtenis in die toepassing sien — asook op die kennisgewingkanale wat jy aktiveer (stelselkennisgewings, ntfy, Telegram of jou eie webhook).",
      ],
      [
        "Kan ek NEXUS+ enige tyd kanselleer?",
        "Ja, heeltemal moeitevry en sonder verbintenisse. Jy kan met 'n enkele klik enige tyd kanselleer: vanaf die Account & Billing-instellings in die toepassing, deur ons webwerf, of direk vanaf die bestelskakel in jou faktureringsontvangs-e-pos. Jou premium-voordele bly aktief tot die einde van jou faktureringsiklus, sonder toekomstige heffings.",
      ],
      [
        "Kan ek my huis beheer wanneer ek weg is?",
        "Nie deur 'n NEXUS-wolk nie: NEXUS praat direk met jou toestelle op jou tuisnetwerk en het geen relay nie. Om dit van buite te bereik, plaas jou foon of skootrekenaar op die tuisnetwerk met 'n VPN soos Tailscale (subnet router) of WireGuard op jou router; NEXUS werk dan presies soos tuis. NEXUS het nog nie 'n spilpuntadres-instelling nie, so die VPN moet jou plaaslike adresreeks bereikbaar maak, en skandering vir nuwe toestelle werk net op die tuisnetwerk. Stel nooit 'n toestel met poortaanstuur aan die internet bloot nie. Die stap-vir-stap-gids is docs/REMOTE-ACCESS.md in die bewaarplek.",
      ],
      [
        "Is daar 'n iPhone-weergawe?",
        "Daar is geen App Store-toepassing nie, omdat NEXUS nie 'n betaalde Apple Developer-rekening gebruik nie. Met 'n Mac en 'n gratis Apple ID kan jy dit vir jou eie iPhone bou (gids: docs/IOS-BUILD.md), en 'n vrystelling kan ook 'n onderteken-loos IPA aanheg wat AltStore of Sideloadly vir jou kan onderteken; daardie roete is nog nie op 'n regte iPhone geverifieer nie. 'n Gratis Apple ID laat die toepassing na 7 dae verval, en kennisgewings terwyl die toepassing toe is, is nie op iOS beskikbaar nie. Die tuisspilpunt is steeds die rekenaartoepassing; die iPhone is 'n kliënt.",
      ],
      [
        "My toestel is nie op die lys nie. Wat kan ek doen?",
        "NEXUS ondersteun slegs toestelle met 'n gedokumenteerde plaaslike protokol; slegs-wolk-toestelle word nie ondersteun nie omdat NEXUS nooit met 'n verkoperwolk praat nie. Die versoenbaarheidslys (docs/COMPATIBILITY.md) sluit ook Sonoff in DIY-modus, WiZ, LIFX, Govee (LAN) en Wake-on-LAN in. Elkeen hiervan het outomatiese protokoltoetse, maar 'n model geld eers as geverifieer wanneer iemand rapporteer dat dit op 'n regte toestel gewerk het. Skryf aan ons deur die kontakvorm op hierdie webwerf (kies “New Device / Connector Request”) of per e-pos: die handelsmerk en model, wat jy verwag het en wat gebeur het. Om ons te sê dat 'n model op jou regte toestel gewerk het, is wat dit as geverifieer merk; sluit nooit wagwoorde, plaaslike sleutels of tekens in nie.",
      ],
      [
        "Het ek 'n rekening nodig? Wat gebeur as die bediener af is?",
        "Ja: jy meld een keer aan met 'n gratis e-posrekening om NEXUS oop te maak. Daarna gebeur toestelbeheer en die uitvoer van outomatiserings op jou eie netwerk en bly dit werk sonder internet. Die rekening voeg sinkronisering oor jou toestelle, Family en die KI-assistent by, wat gratis wolkdienste met perke gebruik. Wanneer een daarvan onbeskikbaar is, byvoorbeeld wanneer die gratis Supabase-projek na ongeveer 'n week sonder aktiwiteit gepouseer het, sê die wolkskerms dat die bediener onbereikbaar is in plaas daarvan om iets as gestoor te wys; toestelle, outomatiserings en die stelselbalk bly werk. As die KI-kwota of -diens uitgeput is, sê die assistent dat dit nie kon antwoord nie.",
      ],
      [
        "Kan ek my instellings rugsteun en na 'n ander toestel skuif?",
        "Ja. Instellings het 'n rugsteunafdeling waar jy jou instellings en outomatiserings na 'n JSON-lêer kan uitvoer en op 'n ander toestel of ná 'n herinstallasie kan invoer. Wagwoorde, tekens en plaaslike sleutels word uit die gekoppelde toestellys in die lêer verwyder, so voer hulle weer in nadat jy herstel het. Hou die rugsteunlêer privaat.",
      ],
      [
        "Kan ek my energiedata uitvoer?",
        "Ja. Die Energy-bladsy kan die nuutste regte kragmetings van jou toestelle as 'n CSV- of JSON-lêer uitvoer. NEXUS het slegs data vir toestelle wat werklik krag rapporteer; as geen gekoppel is nie, is daar niks om uit te voer nie.",
      ],
      [
        "Hoekom waarsku Windows my wanneer ek die installeerder laat loop?",
        "Installeer vanaf die Microsoft Store en jy sal nie hierdie waarskuwing sien nie: Microsoft onderteken daardie pakket tydens sertifisering en lewer opdaterings deur die Store. Die direkte .exe-aflaai is nog nie met 'n kommersiële sertifikaat onderteken nie, so SmartScreen kan “onbekende uitgewer” wys. Jy kan die lêer vergelyk met die kontrolesomme wat in die aflaai-afdeling gelys word voordat jy dit laat loop. Ons kodeondertekeningsbeleid is vanaf die webwerf se voetstuk gekoppel.",
      ],
    ],
  },
  about: {
    title: "Oor NEXUS",
    lead: "'n Onafhanklike, plaaslik-eerste slimhuisplatform ontwerp vir spoed, absolute privaatheid en ware hardeware-eienaarskap. Deur direk oor jou eie tuisnetwerk met jou toestelle te praat, skakel NEXUS wolk-afhanklikheid vir altyd uit.",
    manifesto: {
      heading: "Hoekom ons NEXUS gebou het",
      text: "Die moderne slimhuisbedryf het 'n verkeerde draai geneem. Eie ekosisteme het huiseienaars in verpligte intekeninge, wolkafhanklike vertraging en indringende telemetrie-opsporing gedwing. Wanneer jou internetverbinding afgaan, moet jou sitkamerskakelaar nie ophou werk nie. Ons het NEXUS gebou omdat ons glo jou huis is jou toevlugsoord: jou vloerplan, jou kamerastatusse en jou daaglikse gesinsroetines behoort streng op jou eie hardeware.",
    },
    pillars: [
      {
        title: "Plaaslik-eerste spoed",
        desc: "Elke outomatisering en opdrag word oor jou plaaslike LAN in millisekondes uitgevoer. Geen heen-en-weer na afgeleë wolkbedieners nie, geen vertraging nie.",
      },
      {
        title: "Kompromislose privaatheid",
        desc: "Geen analitiese telemetrie, geen gedragsprofilering en geen verkoop van jou private roetines nie. 'n Rekening is nodig; jou opstelling word in jou eie rynvlak-beskermde rekeningry gestoor. Toestelopdragte bly steeds op jou LAN.",
      },
      {
        title: "Geen verkoper-vassluiting nie",
        desc: "Oop plaaslike protokolle eerste: Shelly, Philips Hue, ESPHome, Tasmota en WLED antwoord NEXUS direk, en alles anders sluit aan deur jou eie Home Assistant-bediener in plaas van 'n verkoperwolk.",
      },
      {
        title: "Eerlike, volhoubare SaaS",
        desc: "Kern-slimhuisbestuur is heeltemal gratis en vir ewig onbeperk. NEXUS+ is die NEXUS AI-plan en help om daardie wolkgebruik te dek.",
      },
    ],
    architecture: {
      heading: "Ontwerp vir betroubaarheid",
      lead: "NEXUS hou 'n liggewig-rekenaarenjin in jou stelselbalk sodat skedules en sensorreëls bly evalueer terwyl jou rekenaar aan is, en die mobiele toepassing maak direk op dieselfde plaaslike netwerk oop.",
      items: [
        {
          icon: "layers",
          title: "Rekenaar",
          desc: "Die Windows-, macOS- en Linux-toepassings bly in die stelselbalk en hou plaaslike skedules en sensorreëls aan die gang terwyl die rekenaar aan is. Windows en Linux word as gereed installeerders gelewer; macOS word uit bronkode gebou (nie onderteken nie: regsklik → Open).",
        },
        {
          icon: "wifi",
          title: "Foon",
          desc: "Die Android- en iOS-toepassings maak op dieselfde plaaslike netwerk oop; toestelopdragte gaan steeds oor jou LAN. Android word as 'n onderteken APK gelewer; iOS word uit bronkode met Xcode en 'n gratis Apple ID gebou.",
        },
        {
          icon: "lock",
          title: "Rekening",
          desc: "'n Rekening is nodig sodat kamers, toestelle en tonele op elke skerm ooreenstem. Toestelopdragte verlaat nie jou tuisnetwerk nie.",
        },
      ],
    },
    linksTitle: "Praktiese skakels",
  },
  footer: {
    tagline:
      "Beheer jou hele slimhuis direk oor jou plaaslike netwerk — sonder verkoper-vassluiting en sonder wolkafhanklikheid. Selfs wanneer die internet afgaan, stop jou huis nooit.",
    product: "Produk",
    productLinks: [
      ["Kenmerke", "#features"],
      ["Pryse", "#pricing"],
      ["Laai af", "#downloads"],
      ["Gereelde vrae", "#faq"],
      ["Oor", "/about"],
    ],
    account: "Kliënte en ondersteuning",
    accountLinks: [
      ["Kontak en tegniese ondersteuning", "javascript:nxOpenContactModal('Technical Support')"],
      ["Vrystellingsnotas en gemeenskap", RELEASES_URL],
      ["Laai toepassings af", "#downloads"],
    ],
    legal: "Regsinligting",
    legalLinks: [
      ["Privaatheid", "/privacy"],
      ["Bepalings", "/terms"],
      ["Terugbetalings", "/refund"],
      ["Kodeondertekening", "/code-signing"],
      ["Dra by", "/contribute"],
    ],
    rights: "Alle regte voorbehou.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
