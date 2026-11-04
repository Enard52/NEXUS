import { RELEASES_URL } from "./site-constants.mjs";

export const da = {
  title: "NEXUS — Dit smarte hjem, styret på dit eget netværk",
  ogImageAlt: "NEXUS-økosystemet til det smarte hjem på computer og mobil",
  description:
    "NEXUS er et lokalt-først økosystem til det smarte hjem til Windows, macOS, Linux, Android og iOS. Direkte styring af enheder over dit eget lokale netværk, hurtige automatiseringer og energimålinger i realtid. Gratis for altid; valgfri NEXUS+-plan.",
  nav: [
    ["#features", "Funktioner"],
    ["#how", "Sådan virker det"],
    ["#integrations", "Integrationer"],
    ["#pricing", "Priser"],
    ["#downloads", "Download"],
    ["#faq", "Ofte stillede spørgsmål"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Smart hjem, lokalt først",
    h1a: "Dit hjem.",
    h1b: "Stille og roligt under din kontrol.",
    lead: "Ét samlet økosystem til dine lys, klimaanlæg, gardiner og sensorer — der taler direkte med enhederne på dit eget lokale netværk. Hurtige automatiseringer, strømmåling i realtid og styring, der bliver ved med at virke, når internettet går ned.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Seneste version",
    shotAlt: "NEXUS-brugerflade og kontrolcenter",
    trust: [
      "Gratis, ubegrænset antal enheder",
      "Ingen sky nødvendig til styring",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Kraftfuld infrastruktur. Nem styring.",
    lead: "Hver enhedstilstand, hver strømmåling og hver automatiseret scene kører direkte på dit lokale netværk uden afhængighed af en ekstern sky.",
    items: [
      [
        "zap",
        "Hurtige automatiseringer",
        "Scenarier udløst af tid eller solnedgang kører direkte på din lokale hardware — og fortsætter pålideligt i baggrunden på computeren.",
      ],
      [
        "gauge",
        "Energimålinger i realtid",
        "Aflæs det aktuelle watt-forbrug og strømforbrug direkte fra understøttede smarte stikkontakter og kontakter på dit lokale netværk.",
      ],
      [
        "wifi",
        "Hastighed som på et lokalt netværk",
        "Direkte LAN-kommunikation over HTTP, TCP og UDP med de mærker, der er nævnt under Integrationer. Ingen omvej via skyen i kommandoforløbet.",
      ],
      [
        "lock",
        "Privatliv fra start",
        "Din hjemmekonfiguration og enhedstelemetri bliver på din lokale hardware. Du skal bruge en konto for at bruge NEXUS; den gemmer din opsætning i din egen række med adgangskontrol på rækkeniveau. Enhedskommandoer går stadig over dit LAN.",
      ],
      [
        "sparkles",
        "NEXUS AI-intelligens",
        "Lokale kommandoer til det smarte hjem er øjeblikkelige og gratis for altid. Den valgfri AI-assistent i skyen giver kloge forslag, når du har brug for vejledning.",
      ],
      [
        "layers",
        "Åbne lokale protokoller",
        "Direkte konnektorer taler på dit LAN. Matter og Zigbee tilsluttes via din egen Home Assistant-server — afsnittet Integrationer viser, hvad der er direkte, og hvad der går via en bro.",
      ],
    ],
  },
  how: {
    heading: "Fra download til forbundet på få minutter.",
    steps: [
      [
        "1",
        "Installér og åbn",
        "Download det native installationsprogram til din platform (Windows, Linux eller Android). Log derefter ind — du skal have en konto for at bruge NEXUS, og den synkroniserer også din opsætning på tværs af dine skærme.",
      ],
      [
        "2",
        "Tilføj dine enheder",
        "Vælg dit mærke, scan det lokale netværk eller indtast en IP-adresse. Mærker med en direkte konnektor taler deres egen protokol — ingen producentsky på vejen.",
      ],
      [
        "3",
        "Lev dit hjem",
        "Scener, planlagte automatiseringer og ægte energimålinger — samlet styring på tværs af computer og mobil.",
      ],
    ],
  },
  integrations: {
    heading: "Virker med det, du allerede har.",
    lead: "Gratis, lokale protokoller først. Alt uden en direkte konnektor virker stadig via Home Assistant-broen.",
    groups: [
      [
        "Lokal HTTP — på alle platforme",
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
        "Lokalt netværk, uden konto eller nøgle — computerprogram",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY-tilstand)", "Wake-on-LAN"],
      ],
    ],
    more: "Mangler der noget? Anmod om en konnektor",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Gratis at bruge. NEXUS+, når du vil have mere",
    lead: "",
    currencyNote: "Priser i USD",
    plans: [
      {
        name: "Free",
        price: "$0",
        period: "for altid",
        features: [
          "Ubegrænset antal enheder og rum på tværs af alle understøttede lokale protokoller",
          "Ingen afhængighed af skyen: kører lokalt på dit eget LAN",
          "30 daglige NEXUS AI-kommandoer og enhedshandlinger",
          "Planlagte lokale automatiseringer og egne scener",
          "Kontosynkronisering på tværs af enheder (rum, enheder, scener)",
          "100 % privat: ingen sporing, ingen dataindsamling",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "pr. måned",
        badge: "Mest populær",
        features: [
          "Alt i Free-niveauet, plus:",
          "2.000 NEXUS AI-svar om måneden i stedet for 30 om dagen",
          "Bed NEXUS AI om at oprette scener og svare på almindeligt sprog",
          "Én konto, gyldig på alle NEXUS-enheder",
          "Gratis prøveperiode — 3 dage ved månedlig, 7 dage ved årlig betaling; opsig ved periodens udløb",
        ],
        cta: {
          label: "Start din gratis prøveperiode",
          monthlyLabel: "Start 3 dages gratis prøveperiode",
          yearlyLabel: "Start 7 dages gratis prøveperiode",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Family",
        price: "Free",
        period: "til hele familien",
        badge: "Hele hjemmet",
        features: [
          "Husstandsmedlemmer med rollebaseret adgang — ingen grænse for antal medlemmer",
          "Roller som ejer, medlem og gæst",
          "Rettigheder til styring, invitation og indstillinger for hvert medlem",
          "Scener og automatiseringer synkroniseres på tværs af dine egne indloggede enheder",
          "Aktiv på tværs af hele økosystemet (computer og mobil)",
          "Helt gratis sammen med dit hjem",
        ],
        cta: { label: "Kom i gang med Family", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Opsig når som helst under Fakturering i appen eller fra din konto på dette websted. Opsigelsen træder i kraft ved udgangen af den igangværende periode.",
  },
  downloads: {
    heading: "Native på alle computere. Hjemme på din telefon.",
    lead: "Altid gratis. Hvert installationsprogram har en offentliggjort SHA-256-kontrolsum, så du kan kontrollere, hvad du installerer.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian og Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · signeret APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Version",
    sizeLabel: "Størrelse",
    webCard: {
      title: "Én konto på tværs af hele dit økosystem",
      desc: "Computerprogrammer til Windows og Linux samt Android-appen. Når du er logget ind, holdes dine rum, enheder, scener og automatiseringer problemfrit synkroniseret på tværs af dine skærme.",
      cta: { label: "Download NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "På Windows er den nemmeste vej Microsoft Store: pakken er signeret af Microsoft, og opdateringer kommer via Store. Den direkte .exe er ikke signeret, så Windows kan advare om en “ukendt udgiver” — se kontrolsummer.",
  },
  faq: {
    heading: "De vigtige spørgsmål, besvaret.",
    items: [
      [
        "Kører NEXUS udelukkende på mit lokale netværk?",
        "Ja. NEXUS er bygget på en streng lokalt-først-arkitektur. Dine enheder, rum, scener og sensortelemetri behandles direkte på hardwaren i dit eget hjem. Selv ved internetnedbrud fortsætter al lokal styring, belysning og alle automatiseringer med at fungere gnidningsfrit uden forsinkelse. Når du logger ind, synkroniseres dine indstillinger sikkert på tværs af alle dine skærme.",
      ],
      [
        "Skal jeg installere NEXUS, eller kører det i browseren?",
        "Installér computerprogrammet (Windows eller Linux) eller Android-appen. NEXUS tilbydes ikke som en browserapp. Enhedskommandoer går over dit eget lokale netværk. Shelly, Philips Hue, ESPHome, Tasmota, WLED og Home Assistant bruger lokal HTTP i computerprogrammet og på Android. TP-Link Kasa og Yeelight kræver rå TCP, så de kører i computerprogrammet. Dette websted er til konto, downloads og fakturering.",
      ],
      [
        "Hvad tilføjer NEXUS+-planen?",
        "Den grundlæggende styring af det smarte hjem — ubegrænset antal enheder og rum, offline-automatiseringer og lokale dashboards — er gratis. NEXUS+ indeholder alt i Free, NEXUS AI til scener og spørgsmål på almindeligt sprog, 2.000 svar om måneden, avancerede forbindelser til at tilføje Home Assistant-enheder og én konto på alle enheder, med en prøveperiode på 3 dage ved månedlig eller 7 dage ved årlig betaling. Enhedskommandoer kører stadig lokalt. Husstandsroller er inkluderet i dit hjem uden ekstra omkostninger.",
      ],
      [
        "Hvilken konto hører mit NEXUS+-abonnement til?",
        "Den e-mailadresse, der blev brugt ved betalingen. Log ind på dette websted eller i appen, før du betaler: betalingen åbner så med din kontos e-mail udfyldt, og abonnementet vises på alle enheder, du logger ind på. NEXUS+ kan ikke købes uden en konto. Hvis du betaler med en anden e-mail, gemmes abonnementet under den e-mail og vises ikke på din konto, før du logger ind med den.",
      ],
      [
        "Hvordan kører automatiseringer og planlagte regler?",
        "NEXUS' automatiseringsmotor evaluerer dine tidsplaner og sensorregler på den enhed, du lader køre — computerprogrammet bliver i systembakken og kører døgnet rundt, så rutiner for belysning, energi og sikkerhed aldrig venter på en sky. Scener og timere, der udløses fra din telefon, træder i kraft øjeblikkeligt over dit LAN. Nye hændelser sendes videre til de notifikationskanaler, du aktiverer på siden Øjeblikkelige notifikationer: bjælken i appen, systemnotifikationer, ntfy, Telegram eller din egen HTTPS-webhook.",
      ],
      [
        "Hvilke enheder og økosystemer understøttes?",
        "NEXUS taler hver enheds eget lokale protokol: Shelly (Gen1 og Gen2+), Tasmota, WLED, ESPHome, Philips Hue og Home Assistant over lokal HTTP på alle platforme, plus TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY-tilstand) og Wake-on-LAN over det lokale netværk i computerprogrammet, uden konto eller nøgle. Alt andet — Matter- eller Zigbee-udstyr — tilsluttes via din egen Home Assistant-server, som NEXUS behandler som én lokal hub. Lokal IP-registrering parrer enheder med det samme, uden en producentsky imellem.",
      ],
      [
        "Hvordan integreres overvågningskameraer og sensorer?",
        "NEXUS samler dine overvågningskameraer, bevægelsesdetektorer og indgangssensorer i et centralt sikkerhedsdashboard. Du kan automatisere privatlivstilstande, aktivere overvågningsrutiner, når du forlader hjemmet, og se hver bevægelses- eller kontakthændelse i appen — samt på de notifikationskanaler, du aktiverer (systemnotifikationer, ntfy, Telegram eller din egen webhook).",
      ],
      [
        "Kan jeg opsige NEXUS+ når som helst?",
        "Ja, helt problemfrit og uden binding. Du kan opsige med ét klik når som helst: fra indstillingerne Konto og fakturering i appen, via vores websted eller direkte fra ordrelinket i din faktureringskvittering på e-mail. Dine premiumfordele forbliver aktive til udgangen af din faktureringsperiode uden fremtidige betalinger.",
      ],
      [
        "Kan jeg styre mit hjem, når jeg er væk?",
        "Ikke gennem en NEXUS-sky: NEXUS taler direkte med dine enheder på dit hjemmenetværk og har ingen relæ. For at nå det udefra skal du sætte din telefon eller bærbare på hjemmenetværket med en VPN som Tailscale (subnet router) eller WireGuard på din router; NEXUS fungerer så præcis som hjemme. NEXUS har endnu ingen indstilling for hub-adresse, så VPN'en skal gøre dit lokale adresseområde tilgængeligt, og scanning efter nye enheder virker kun på hjemmenetværket. Udsæt aldrig en enhed for internettet med portvideresendelse. Trin-for-trin-vejledningen er docs/REMOTE-ACCESS.md i repositoriet.",
      ],
      [
        "Findes der en iPhone-version?",
        "Der er ingen App Store-app, fordi NEXUS ikke bruger en betalt Apple Developer-konto. Med en Mac og et gratis Apple-ID kan du bygge den til din egen iPhone (vejledning: docs/IOS-BUILD.md), og en udgivelse kan også vedhæfte en usigneret IPA, som AltStore eller Sideloadly kan signere for dig; den vej er endnu ikke verificeret på en rigtig iPhone. Med et gratis Apple-ID udløber appen efter 7 dage, og notifikationer, mens appen er lukket, er ikke tilgængelige på iOS. Hjemmets hub er stadig computerprogrammet; iPhone er en klient.",
      ],
      [
        "Min enhed står ikke på listen. Hvad kan jeg gøre?",
        "NEXUS understøtter kun enheder med en dokumenteret lokal protokol; enheder, der kun virker via skyen, understøttes ikke, fordi NEXUS aldrig taler med en producents sky. Kompatibilitetslisten (docs/COMPATIBILITY.md) omfatter også Sonoff i DIY-tilstand, WiZ, LIFX, Govee (LAN) og Wake-on-LAN. Hver af dem har automatiske protokoltests, men en model tæller kun som verificeret, når nogen melder, at den virkede på en rigtig enhed. Skriv til os via kontaktformularen på dette websted (vælg “New Device / Connector Request”) eller på e-mail: mærke og model, hvad du forventede, og hvad der skete. Din besked om, at en model virkede på din rigtige enhed, er det, der markerer den som verificeret; angiv aldrig adgangskoder, lokale nøgler eller tokens.",
      ],
      [
        "Har jeg brug for en konto? Hvad sker der, hvis serveren er nede?",
        "Ja: du logger ind én gang med en gratis e-mailkonto for at åbne NEXUS. Derefter foregår styring af enheder og kørsel af automatiseringer på dit eget netværk og fortsætter uden internet. Kontoen tilføjer synkronisering på tværs af dine enheder, Family og AI-assistenten, som bruger gratis skytjenester med begrænsninger. Når en af dem ikke er tilgængelig, for eksempel når det gratis Supabase-projekt er sat på pause efter omkring en uges inaktivitet, siger skyskærmene, at serveren ikke kan nås, i stedet for at vise noget som gemt; enheder, automatiseringer og systembakken fortsætter med at fungere. Hvis AI-kvoten eller -tjenesten er opbrugt, siger assistenten, at den ikke kunne svare.",
      ],
      [
        "Kan jeg tage backup af mine indstillinger og flytte dem til en anden enhed?",
        "Ja. Indstillinger har en backupsektion, hvor du kan eksportere dine indstillinger og automatiseringer til en JSON-fil og importere den på en anden enhed eller efter en ominstallation. Adgangskoder, tokens og lokale nøgler fjernes fra listen over parrede enheder i filen, så indtast dem igen efter gendannelsen. Hold backupfilen privat.",
      ],
      [
        "Kan jeg eksportere mine energidata?",
        "Ja. Siden Energi kan eksportere de seneste rigtige strømmålinger fra dine enheder som en CSV- eller JSON-fil. NEXUS har kun data fra enheder, der faktisk rapporterer strøm; hvis der ikke er nogen parret, er der intet at eksportere.",
      ],
      [
        "Hvorfor advarer Windows mig, når jeg kører installationsprogrammet?",
        "Installér fra Microsoft Store, så ser du ikke denne advarsel: Microsoft signerer pakken under certificeringen og leverer opdateringer via Store. Den direkte .exe-download er endnu ikke signeret med et kommercielt certifikat, så SmartScreen kan vise “ukendt udgiver”. Du kan sammenligne filen med de kontrolsummer, der er angivet i downloadsektionen, før du kører den. Vores politik for kodesignering er linket i sidefoden.",
      ],
    ],
  },
  about: {
    title: "Om NEXUS",
    lead: "En uafhængig, lokalt-først platform til det smarte hjem, designet til hastighed, absolut privatliv og ægte ejerskab over hardwaren. Ved at tale direkte med dine enheder over dit eget hjemmenetværk gør NEXUS en gang for alle op med afhængighed af en sky.",
    manifesto: {
      heading: "Hvorfor vi byggede NEXUS",
      text: "Branchen for det moderne smarte hjem tog en forkert afstikker. Lukkede økosystemer tvang boligejere ind i obligatoriske abonnementer, forsinkelser på grund af skyen og påtrængende sporing af telemetri. Når din internetforbindelse går ned, skal kontakten i din stue ikke holde op med at virke. Vi byggede NEXUS, fordi vi mener, at dit hjem er din fristed: din plantegning, dine kameraers tilstande og din families daglige rutiner hører udelukkende hjemme på din egen hardware.",
    },
    pillars: [
      {
        title: "Lokal hastighed",
        desc: "Hver automatisering og hver kommando udføres over dit lokale LAN på millisekunder. Ingen rundture til fjerne skyservere, ingen forsinkelse.",
      },
      {
        title: "Privatliv uden kompromis",
        desc: "Ingen analysetelemetri, ingen adfærdsprofilering og intet salg af dine private rutiner. Der kræves en konto; din opsætning gemmes i din egen kontorække, beskyttet på rækkeniveau. Enhedskommandoer bliver stadig på dit LAN.",
      },
      {
        title: "Ingen leverandørbinding",
        desc: "Åbne lokale protokoller først: Shelly, Philips Hue, ESPHome, Tasmota og WLED svarer direkte til NEXUS, og alt andet tilsluttes via din egen Home Assistant-server i stedet for en producentsky.",
      },
      {
        title: "Ærlig, bæredygtig SaaS",
        desc: "Den grundlæggende styring af det smarte hjem er helt gratis og ubegrænset for altid. NEXUS+ er NEXUS AI-planen og er med til at dække det skyforbrug.",
      },
    ],
    architecture: {
      heading: "Bygget til pålidelighed",
      lead: "NEXUS holder en let computermotor i din systembakke, så tidsplaner og sensorregler bliver ved med at blive evalueret, mens din computer er tændt, og mobilappen åbner direkte på det samme lokale netværk.",
      items: [
        {
          icon: "layers",
          title: "Computer",
          desc: "Programmerne til Windows, macOS og Linux bliver i systembakken og holder lokale tidsplaner og sensorregler kørende, mens computeren er tændt. Windows og Linux leveres som færdige installationsprogrammer; macOS bygges fra kildekoden (usigneret: højreklik → Åbn).",
        },
        {
          icon: "wifi",
          title: "Telefon",
          desc: "Android- og iOS-apperne åbner på det samme lokale netværk; enhedskommandoer går stadig over dit LAN. Android leveres som en signeret APK; iOS bygges fra kildekoden med Xcode og et gratis Apple-ID.",
        },
        {
          icon: "lock",
          title: "Konto",
          desc: "Der kræves en konto, så rum, enheder og scener stemmer overens på alle skærme. Enhedskommandoer forlader ikke dit hjemmenetværk.",
        },
      ],
    },
    linksTitle: "Praktiske links",
  },
  footer: {
    tagline:
      "Styr hele dit smarte hjem direkte over dit lokale netværk — uden leverandørbinding og uden afhængighed af en sky. Selv når internettet går ned, standser dit hjem aldrig.",
    product: "Produkt",
    productLinks: [
      ["Funktioner", "#features"],
      ["Priser", "#pricing"],
      ["Download", "#downloads"],
      ["Ofte stillede spørgsmål", "#faq"],
      ["Om os", "/about"],
    ],
    account: "Kunder og support",
    accountLinks: [
      ["Kontakt og teknisk support", "javascript:nxOpenContactModal('Technical Support')"],
      ["Udgivelsesnoter og fællesskab", RELEASES_URL],
      ["Download apps", "#downloads"],
    ],
    legal: "Juridisk",
    legalLinks: [
      ["Privatliv", "/privacy"],
      ["Vilkår", "/terms"],
      ["Refusioner", "/refund"],
      ["Kodesignering", "/code-signing"],
      ["Bidrag", "/contribute"],
    ],
    rights: "Alle rettigheder forbeholdes.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
