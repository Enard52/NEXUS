import { RELEASES_URL } from "./site-constants.mjs";

export const nl = {
  title: "NEXUS — Je slimme huis, beheerd op je eigen netwerk",
  ogImageAlt: "NEXUS smarthome-ecosysteem op desktop en mobiel",
  description:
    "NEXUS is een lokaal-eerst smarthome-ecosysteem voor Windows, macOS, Linux, Android en iOS. Directe apparaatbediening via je eigen lokale netwerk, responsieve automatiseringen en live energiegegevens. Voor altijd gratis; optioneel NEXUS+-abonnement.",
  nav: [
    ["#features", "Functies"],
    ["#how", "Zo werkt het"],
    ["#integrations", "Integraties"],
    ["#pricing", "Prijzen"],
    ["#downloads", "Downloaden"],
    ["#faq", "Veelgestelde vragen"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Lokaal-eerst smarthome",
    h1a: "Jouw huis.",
    h1b: "Rustig onder jouw controle.",
    lead: "Eén samenhangend ecosysteem voor je verlichting, klimaat, zonwering en sensoren — dat rechtstreeks praat met de apparaten op je eigen lokale netwerk. Responsieve automatiseringen, live stroommeting en bediening die blijft werken als het internet uitvalt.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Nieuwste versie",
    shotAlt: "NEXUS-interface en bedieningscentrum",
    trust: [
      "Gratis, onbeperkt aantal apparaten",
      "Geen cloud nodig voor bediening",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Krachtige infrastructuur. Moeiteloze bediening.",
    lead: "Elke apparaatstatus, elke stroomwaarde en elke geautomatiseerde scène draait rechtstreeks over je lokale netwerk, zonder afhankelijkheid van externe clouds.",
    items: [
      [
        "zap",
        "Responsieve automatiseringen",
        "Scenario's die op tijd of bij zonsondergang starten, worden direct op je lokale hardware uitgevoerd — en draaien op de desktop betrouwbaar door op de achtergrond.",
      ],
      [
        "gauge",
        "Live energiemetingen",
        "Lees het actuele vermogen en het stroomverbruik in realtime rechtstreeks af van ondersteunde slimme stekkers en schakelaars op je lokale netwerk.",
      ],
      [
        "wifi",
        "Snelheid van het lokale netwerk",
        "Directe LAN-communicatie via HTTP, TCP en UDP met de merken die onder Integraties staan. Geen omweg via de cloud in het opdrachtpad.",
      ],
      [
        "lock",
        "Privacy door ontwerp",
        "Je thuisconfiguratie en apparaattelemetrie blijven op je lokale hardware. Voor NEXUS is een account nodig; dat slaat je configuratie op in je eigen rij met toegangsbeheer op rijniveau. Apparaatopdrachten gaan nog steeds via je LAN.",
      ],
      [
        "sparkles",
        "NEXUS AI-intelligentie",
        "Lokale smarthome-opdrachten zijn direct en voor altijd gratis. De optionele cloud-AI-assistent geeft slimme suggesties wanneer je hulp kunt gebruiken.",
      ],
      [
        "layers",
        "Open lokale protocollen",
        "Directe connectoren praten op je LAN. Matter en Zigbee sluiten aan via je eigen Home Assistant-server — het onderdeel Integraties laat zien wat direct is en wat via een brug loopt.",
      ],
    ],
  },
  how: {
    heading: "Van download tot verbonden in enkele minuten.",
    steps: [
      [
        "1",
        "Installeren en openen",
        "Download het native installatieprogramma voor jouw platform (Windows, Linux of Android). Log daarna in — voor NEXUS is een account nodig, en daarmee synchroniseer je ook je configuratie tussen je schermen.",
      ],
      [
        "2",
        "Voeg je apparaten toe",
        "Kies je merk, scan het lokale netwerk of voer een IP-adres in. Merken met een directe connector spreken hun eigen protocol — geen cloud van de fabrikant op dat pad.",
      ],
      [
        "3",
        "Beleef je huis",
        "Scènes, geplande automatiseringen en echte energiemetingen — geïntegreerde bediening op desktop en mobiel.",
      ],
    ],
  },
  integrations: {
    heading: "Werkt met wat je al hebt.",
    lead: "Gratis, lokale protocollen eerst. Alles zonder directe connector werkt nog steeds via de Home Assistant-brug.",
    groups: [
      [
        "Lokale HTTP — op elk platform",
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
        "Lokaal netwerk, zonder account of sleutel — desktop-app",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY-modus)", "Wake-on-LAN"],
      ],
    ],
    more: "Mis je iets? Vraag een connector aan",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Gratis te gebruiken. NEXUS+ als je meer wilt",
    lead: "",
    currencyNote: "Prijzen in USD",
    plans: [
      {
        name: "Gratis",
        price: "$0",
        period: "voor altijd",
        features: [
          "Onbeperkt aantal apparaten en kamers via elk ondersteund lokaal protocol",
          "Geen enkele cloudafhankelijkheid: draait lokaal op je eigen LAN",
          "30 NEXUS AI-opdrachten en apparaatacties per dag",
          "Geplande lokale automatiseringen en eigen scènes",
          "Accountsynchronisatie tussen meerdere apparaten (kamers, apparaten, scènes)",
          "100% privé: geen tracking, geen dataverzameling",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "per maand",
        badge: "Meest gekozen",
        features: [
          "Alles uit het gratis niveau, plus:",
          "2.000 NEXUS AI-antwoorden per maand in plaats van 30 per dag",
          "Laat NEXUS AI scènes instellen en in gewone taal antwoorden",
          "Eén account, geldig op elk NEXUS-apparaat",
          "Gratis proefperiode — 3 dagen bij maandelijks, 7 dagen bij jaarlijks; opzeggen aan het einde van de periode",
        ],
        cta: {
          label: "Start je gratis proefperiode",
          monthlyLabel: "Start gratis proefperiode van 3 dagen",
          yearlyLabel: "Start gratis proefperiode van 7 dagen",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Gezin",
        price: "Free",
        period: "voor het hele gezin",
        badge: "Het hele huis",
        features: [
          "Huishoudleden met rolgebaseerde toegang — geen limiet op het aantal leden",
          "Rollen voor eigenaar, lid en gast",
          "Rechten per lid voor bediening, uitnodigingen en instellingen",
          "Scènes en automatiseringen synchroniseren tussen je eigen ingelogde apparaten",
          "Actief in het hele ecosysteem (desktop en mobiel)",
          "Helemaal gratis bij je huis",
        ],
        cta: { label: "Begin met Gezin", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Zeg op elk moment op via Facturering in de app of via je account op deze site. De opzegging gaat in aan het einde van de lopende periode.",
  },
  downloads: {
    heading: "Native op elke desktop. Thuis op je telefoon.",
    lead: "Altijd gratis. Elk installatieprogramma wordt geleverd met een gepubliceerde SHA-256-checksum, zodat je kunt controleren wat je installeert.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian en Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · ondertekende APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Versie",
    sizeLabel: "Grootte",
    webCard: {
      title: "Eén account, voor je hele ecosysteem",
      desc: "Desktopprogramma's voor Windows en Linux en de Android-app. Als je bent ingelogd, blijven je kamers, apparaten, scènes en automatiseringen naadloos gesynchroniseerd tussen je schermen.",
      cta: { label: "NEXUS downloaden", href: "#downloads" },
    },
    smartScreenNote:
      "Op Windows is de Microsoft Store de makkelijkste route: het pakket is ondertekend door Microsoft en updates komen via de Store. De directe .exe is niet ondertekend, dus Windows kan waarschuwen voor een “onbekende uitgever” — zie de checksums.",
  },
  faq: {
    heading: "De belangrijke vragen, beantwoord.",
    items: [
      [
        "Werkt NEXUS volledig op mijn lokale netwerk?",
        "Ja. NEXUS is gebouwd op een strikte lokaal-eerst-architectuur. Je apparaten, kamers, scènes en sensortelemetrie worden rechtstreeks verwerkt op je eigen hardware thuis. Zelfs bij een internetstoring blijven alle lokale bediening, verlichting en automatiseringen naadloos werken, zonder vertraging. Door in te loggen worden je instellingen veilig gesynchroniseerd tussen al je schermen.",
      ],
      [
        "Moet ik NEXUS installeren, of draait het in de browser?",
        "Installeer het desktopprogramma (Windows of Linux) of de Android-app. NEXUS wordt niet aangeboden als browser-app. Apparaatopdrachten gaan via je eigen lokale netwerk. Shelly, Philips Hue, ESPHome, Tasmota, WLED en Home Assistant gebruiken lokale HTTP in het desktopprogramma en op Android. TP-Link Kasa en Yeelight hebben ruwe TCP nodig, dus die draaien in het desktopprogramma. Deze site is bedoeld voor het account, downloads en facturering.",
      ],
      [
        "Wat voegt het NEXUS+-abonnement toe?",
        "Essentiële smarthome-bediening — onbeperkt aantal apparaten, kamers, offline automatiseringen en lokale dashboards — is gratis. NEXUS+ omvat alles uit Gratis, NEXUS AI voor scènes en vragen in gewone taal, 2.000 antwoorden per maand, geavanceerde verbindingen om Home Assistant-apparaten toe te voegen en één account op elk apparaat, met een proefperiode van 3 dagen bij maandelijks of 7 dagen bij jaarlijks. Apparaatopdrachten draaien nog steeds lokaal. Huishoudrollen zijn zonder extra kosten bij je huis inbegrepen.",
      ],
      [
        "Bij welk account hoort mijn NEXUS+-abonnement?",
        "Bij het e-mailadres dat bij het afrekenen is gebruikt. Log in op deze site of in de app voordat je betaalt: de checkout opent dan met het e-mailadres van je account al ingevuld, en het abonnement verschijnt op elk apparaat waarop je inlogt. NEXUS+ kan niet zonder account worden gekocht. Als je met een ander e-mailadres betaalt, wordt het abonnement onder dat adres opgeslagen en verschijnt het pas op je account als je met dat adres inlogt.",
      ],
      [
        "Hoe worden automatiseringen en geplande regels uitgevoerd?",
        "De NEXUS-automatiseringsengine beoordeelt je schema's en sensorregels op het apparaat dat je aan laat staan — de desktop-app blijft in het systeemvak en draait de klok rond, zodat verlichting-, energie- en beveiligingsroutines nooit op een cloud wachten. Scènes en timers die je vanaf je telefoon start, worden direct via je LAN toegepast. Nieuwe gebeurtenissen worden doorgestuurd naar de meldingskanalen die je inschakelt op de pagina Directe meldingen: de strook in de app, systeemmeldingen, ntfy, Telegram of je eigen HTTPS-webhook.",
      ],
      [
        "Welke apparaten en ecosystemen worden ondersteund?",
        "NEXUS spreekt het eigen lokale protocol van elk apparaat: Shelly (Gen1 en Gen2+), Tasmota, WLED, ESPHome, Philips Hue en Home Assistant via lokale HTTP op elk platform, plus TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY-modus) en Wake-on-LAN via het lokale netwerk in de desktop-app, zonder account of sleutel. Al het andere — Matter- of Zigbee-apparatuur — sluit aan via je eigen Home Assistant-server, die NEXUS als één lokale hub behandelt. Lokale IP-detectie koppelt apparaten direct, zonder cloud van de fabrikant ertussen.",
      ],
      [
        "Hoe worden beveiligingscamera's en sensoren geïntegreerd?",
        "NEXUS brengt je beveiligingscamera's, bewegingsmelders en toegangssensoren samen in één centraal beveiligingsdashboard. Je kunt privacymodi automatiseren, bewakingsroutines activeren als je het huis verlaat en elke beweging of contactgebeurtenis zien in de app — en op de meldingskanalen die je inschakelt (systeemmeldingen, ntfy, Telegram of je eigen webhook).",
      ],
      [
        "Kan ik NEXUS+ op elk moment opzeggen?",
        "Ja, volkomen zonder gedoe en zonder verplichtingen. Je kunt op elk moment met één klik opzeggen: via de instellingen voor Account en facturering in de app, via onze website of rechtstreeks via de orderlink in je factureringsmail. Je premium-voordelen blijven actief tot het einde van je factureringsperiode en er volgen geen nieuwe afschrijvingen.",
      ],
      [
        "Kan ik mijn huis bedienen als ik weg ben?",
        "Niet via een NEXUS-cloud: NEXUS praat rechtstreeks met je apparaten op je thuisnetwerk en heeft geen relay. Om er van buitenaf bij te komen, zet je je telefoon of laptop op het thuisnetwerk met een VPN zoals Tailscale (subnet router) of WireGuard op je router; NEXUS werkt dan precies zoals thuis. NEXUS heeft nog geen instelling voor een hubadres, dus de VPN moet je lokale adresbereik bereikbaar maken, en scannen naar nieuwe apparaten werkt alleen op het thuisnetwerk. Stel een apparaat nooit bloot aan het internet met port forwarding. De stapsgewijze handleiding is docs/REMOTE-ACCESS.md in de repository.",
      ],
      [
        "Is er een iPhone-versie?",
        "Er is geen App Store-app, omdat NEXUS geen betaald Apple Developer-account gebruikt. Met een Mac en een gratis Apple ID kun je de app voor je eigen iPhone bouwen (handleiding: docs/IOS-BUILD.md), en een release kan ook een niet-ondertekende IPA bijvoegen die AltStore of Sideloadly voor je kan ondertekenen; die route is nog niet geverifieerd op een echte iPhone. Met een gratis Apple ID verloopt de app na 7 dagen, en meldingen terwijl de app gesloten is, zijn op iOS niet beschikbaar. De thuishub blijft de desktop-app; de iPhone is een client.",
      ],
      [
        "Mijn apparaat staat niet op de lijst. Wat kan ik doen?",
        "NEXUS ondersteunt alleen apparaten met een gedocumenteerd lokaal protocol; apparaten die alleen via de cloud werken, worden niet ondersteund omdat NEXUS nooit met een cloud van een fabrikant praat. De compatibiliteitslijst (docs/COMPATIBILITY.md) bevat ook Sonoff in DIY-modus, WiZ, LIFX, Govee (LAN) en Wake-on-LAN. Elk daarvan heeft geautomatiseerde protocoltests, maar een model geldt pas als geverifieerd wanneer iemand meldt dat het op een echt apparaat werkte. Schrijf ons via het contactformulier op deze site (kies “New Device / Connector Request”) of per e-mail: het merk en model, wat je verwachtte en wat er gebeurde. Als je ons laat weten dat een model op jouw echte apparaat werkte, wordt het als geverifieerd gemarkeerd; stuur nooit wachtwoorden, lokale sleutels of tokens mee.",
      ],
      [
        "Heb ik een account nodig? Wat gebeurt er als de server onbereikbaar is?",
        "Ja: je logt eenmalig in met een gratis e-mailaccount om NEXUS te openen. Daarna gebeurt het bedienen van apparaten en het uitvoeren van automatiseringen op je eigen netwerk en dat blijft werken zonder internet. Het account voegt synchronisatie tussen je apparaten, Gezin en de AI-assistent toe, die gebruikmaken van gratis clouddiensten met limieten. Als een daarvan niet beschikbaar is, bijvoorbeeld wanneer het gratis Supabase-project na ongeveer een week zonder activiteit is gepauzeerd, melden de cloudschermen dat de server onbereikbaar is in plaats van iets als opgeslagen te tonen; apparaten, automatiseringen en het systeemvak blijven werken. Als het AI-quotum of de AI-dienst is uitgeput, zegt de assistent dat hij niet kon antwoorden.",
      ],
      [
        "Kan ik een back-up van mijn instellingen maken en die naar een ander apparaat verplaatsen?",
        "Ja. Bij Instellingen vind je een back-upgedeelte waar je je instellingen en automatiseringen kunt exporteren naar een JSON-bestand en dat op een ander apparaat of na een herinstallatie kunt importeren. Wachtwoorden, tokens en lokale sleutels worden uit de lijst met gekoppelde apparaten in het bestand verwijderd, dus voer ze na het herstellen opnieuw in. Houd het back-upbestand privé.",
      ],
      [
        "Kan ik mijn energiegegevens exporteren?",
        "Ja. De pagina Energie kan de nieuwste echte vermogensmetingen van je apparaten exporteren als CSV- of JSON-bestand. NEXUS heeft alleen gegevens van apparaten die daadwerkelijk vermogen rapporteren; als er geen enkel apparaat is gekoppeld, valt er niets te exporteren.",
      ],
      [
        "Waarom waarschuwt Windows me als ik het installatieprogramma uitvoer?",
        "Installeer vanuit de Microsoft Store en je ziet deze waarschuwing niet: Microsoft ondertekent dat pakket tijdens de certificering en levert updates via de Store. De directe .exe-download is nog niet ondertekend met een commercieel certificaat, dus SmartScreen kan “onbekende uitgever” tonen. Je kunt het bestand vergelijken met de checksums in het downloadgedeelte voordat je het uitvoert. Ons beleid voor codeondertekening staat via een link in de footer van de site.",
      ],
    ],
  },
  about: {
    title: "Over NEXUS",
    lead: "Een onafhankelijk, lokaal-eerst smarthome-platform, ontworpen voor snelheid, absolute privacy en echt eigendom van je hardware. Door rechtstreeks met je apparaten te praten via je eigen thuisnetwerk, maakt NEXUS voorgoed een einde aan cloud-lock-in.",
    manifesto: {
      heading: "Waarom we NEXUS hebben gebouwd",
      text: "De moderne smarthome-industrie nam een verkeerde afslag. Gesloten ecosystemen dwongen huiseigenaren tot verplichte abonnementen, van de cloud afhankelijke vertraging en opdringerige telemetrietracking. Als je internetverbinding uitvalt, hoort de schakelaar in je woonkamer niet op te houden met werken. We bouwden NEXUS omdat we geloven dat je huis je toevluchtsoord is: je plattegrond, de status van je camera's en de dagelijkse routines van je gezin horen uitsluitend op je eigen hardware thuis.",
    },
    pillars: [
      {
        title: "Lokaal-eerst snelheid",
        desc: "Elke automatisering en opdracht wordt in milliseconden uitgevoerd via je lokale LAN. Geen heen-en-weer naar externe cloudservers, nul vertraging.",
      },
      {
        title: "Compromisloze privacy",
        desc: "Geen analysetelemetrie, geen gedragsprofilering en geen verkoop van je privéroutines. Een account is vereist; je configuratie wordt opgeslagen in je eigen accountrij die op rijniveau is beveiligd. Apparaatopdrachten blijven op je LAN.",
      },
      {
        title: "Geen vendor lock-in",
        desc: "Open lokale protocollen eerst: Shelly, Philips Hue, ESPHome, Tasmota en WLED antwoorden NEXUS rechtstreeks, en al het andere sluit aan via je eigen Home Assistant-server in plaats van via een cloud van de fabrikant.",
      },
      {
        title: "Eerlijke, duurzame SaaS",
        desc: "Het kernbeheer van je smarthome is voor altijd volledig gratis en onbeperkt. NEXUS+ is het NEXUS AI-abonnement en helpt dat cloudgebruik te dekken.",
      },
    ],
    architecture: {
      heading: "Ontworpen voor betrouwbaarheid",
      lead: "NEXUS houdt een lichtgewicht desktopengine in je systeemvak, zodat schema's en sensorregels blijven worden beoordeeld zolang je computer aanstaat, en de mobiele app opent direct op hetzelfde lokale netwerk.",
      items: [
        {
          icon: "layers",
          title: "Desktop",
          desc: "De apps voor Windows, macOS en Linux blijven in het systeemvak en houden lokale schema's en sensorregels draaiende zolang de computer aanstaat. Windows en Linux worden geleverd als kant-en-klare installatieprogramma's; macOS wordt vanuit de broncode gebouwd (niet ondertekend: rechtsklik → Openen).",
        },
        {
          icon: "wifi",
          title: "Telefoon",
          desc: "De Android- en iOS-apps openen op hetzelfde lokale netwerk; apparaatopdrachten gaan nog steeds via je LAN. Android wordt geleverd als ondertekende APK; iOS wordt vanuit de broncode gebouwd met Xcode en een gratis Apple ID.",
        },
        {
          icon: "lock",
          title: "Account",
          desc: "Een account is vereist zodat kamers, apparaten en scènes op elk scherm overeenkomen. Apparaatopdrachten verlaten je thuisnetwerk niet.",
        },
      ],
    },
    linksTitle: "Handige links",
  },
  footer: {
    tagline:
      "Bedien je hele smarthome rechtstreeks via je lokale netwerk — zonder vendor lock-in en zonder cloudafhankelijkheid. Zelfs als het internet uitvalt, stopt je huis nooit.",
    product: "Product",
    productLinks: [
      ["Functies", "#features"],
      ["Prijzen", "#pricing"],
      ["Downloaden", "#downloads"],
      ["Veelgestelde vragen", "#faq"],
      ["Over ons", "/about"],
    ],
    account: "Klant en ondersteuning",
    accountLinks: [
      ["Contact en technische ondersteuning", "javascript:nxOpenContactModal('Technical Support')"],
      ["Release-notities en community", RELEASES_URL],
      ["Apps downloaden", "#downloads"],
    ],
    legal: "Juridisch",
    legalLinks: [
      ["Privacy", "/privacy"],
      ["Voorwaarden", "/terms"],
      ["Terugbetalingen", "/refund"],
      ["Codeondertekening", "/code-signing"],
      ["Bijdragen", "/contribute"],
    ],
    rights: "Alle rechten voorbehouden.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
