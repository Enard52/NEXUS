import { RELEASES_URL } from "./site-constants.mjs";

export const nb = {
  title: "NEXUS — Det smarte hjemmet ditt, styrt på ditt eget nettverk",
  ogImageAlt: "NEXUS smarthjem-økosystem på datamaskin og mobil",
  description:
    "NEXUS er et lokalt først smarthjem-økosystem for Windows, macOS, Linux, Android og iOS. Direkte enhetsstyring over ditt eget lokale nettverk, responsive automatiseringer og strømmålinger i sanntid. Gratis for alltid; valgfritt NEXUS+-abonnement.",
  nav: [
    ["#features", "Funksjoner"],
    ["#how", "Slik fungerer det"],
    ["#integrations", "Integrasjoner"],
    ["#pricing", "Priser"],
    ["#downloads", "Last ned"],
    ["#faq", "Vanlige spørsmål"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Smarthjem med lokal kontroll først",
    h1a: "Hjemmet ditt.",
    h1b: "Stille under din kontroll.",
    lead: "Ett samlet økosystem for lys, klima, solskjerming og sensorer — som snakker direkte med enhetene på ditt eget lokale nettverk. Responsive automatiseringer, strømmåling i sanntid og styring som fortsetter å virke når internett faller ut.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Siste versjon",
    shotAlt: "NEXUS-grensesnitt og kontrollsenter",
    trust: [
      "Gratis, ubegrenset antall enheter",
      "Ingen sky nødvendig for styring",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Kraftig infrastruktur. Enkel styring.",
    lead: "Hver enhetstilstand, strømmåling og automatisk scene kjører direkte over ditt lokale nettverk, uten avhengighet av eksterne skytjenester.",
    items: [
      [
        "zap",
        "Responsive automatiseringer",
        "Scenarioer utløst av klokkeslett og solnedgang kjøres direkte på din lokale maskinvare — og fortsetter pålitelig i bakgrunnen på skrivebordet.",
      ],
      [
        "gauge",
        "Energimålinger i sanntid",
        "Les av effekt og strømforbruk i sanntid direkte fra støttede smartkontakter og brytere på ditt lokale nettverk.",
      ],
      [
        "wifi",
        "Hastighet på lokalnettet",
        "Direkte LAN-kommunikasjon over HTTP, TCP og UDP med merkene som er oppført under Integrasjoner. Ingen omvei via skyen i kommandoveien.",
      ],
      [
        "lock",
        "Personvern fra grunnen av",
        "Hjemmeoppsettet og enhetstelemetrien din blir på din lokale maskinvare. Du trenger en konto for å bruke NEXUS; den lagrer oppsettet ditt i din egen rad under tilgangskontroll på radnivå. Enhetskommandoer går fortsatt over ditt LAN.",
      ],
      [
        "sparkles",
        "NEXUS AI-intelligens",
        "Lokale smarthjem-kommandoer er umiddelbare og gratis for alltid. Den valgfrie AI-assistenten i skyen gir smarte forslag når du trenger veiledning.",
      ],
      [
        "layers",
        "Åpne lokale protokoller",
        "Direkte koblinger snakker på ditt LAN. Matter og Zigbee kobles til via din egen Home Assistant-server — Integrasjoner-seksjonen viser hva som er direkte og hva som går via bro.",
      ],
    ],
  },
  how: {
    heading: "Fra nedlasting til tilkoblet på få minutter.",
    steps: [
      [
        "1",
        "Installer og åpne",
        "Last ned det innebygde installasjonsprogrammet for plattformen din (Windows, Linux eller Android). Logg deretter inn — du trenger en konto for å bruke NEXUS, og den synkroniserer også oppsettet på tvers av skjermene dine.",
      ],
      [
        "2",
        "Legg til enhetene dine",
        "Velg merke, skann det lokale nettverket eller skriv inn en IP-adresse. Merker med direkte kobling snakker sin egen protokoll — ingen produsentsky på den veien.",
      ],
      [
        "3",
        "Lev hjemmet ditt",
        "Scener, tidsstyrte automatiseringer og ekte energimålinger — samlet styring på tvers av skrivebord og mobil.",
      ],
    ],
  },
  integrations: {
    heading: "Fungerer med det du allerede har.",
    lead: "Gratis, lokale protokoller først. Alt som mangler en direkte kobling fungerer likevel via Home Assistant-broen.",
    groups: [
      [
        "Lokal HTTP — på alle plattformer",
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
        "Lokalt nettverk, uten konto eller nøkkel — skrivebordsappen",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY-modus)", "Wake-on-LAN"],
      ],
    ],
    more: "Mangler det noe? Be om en kobling",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Gratis å bruke. NEXUS+ når du vil ha mer",
    lead: "",
    currencyNote: "Priser i USD",
    plans: [
      {
        name: "Gratis",
        price: "$0",
        period: "for alltid",
        features: [
          "Ubegrenset antall enheter og rom på tvers av alle støttede lokale protokoller",
          "Null skyavhengighet: kjører lokalt på ditt eget LAN",
          "30 daglige NEXUS AI-kommandoer og enhetshandlinger",
          "Tidsstyrte lokale automatiseringer og egendefinerte scener",
          "Kontosynkronisering mellom flere enheter (rom, enheter, scener)",
          "100 % privat: ingen sporing, ingen datainnhøsting",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "per måned",
        badge: "Mest populær",
        features: [
          "Alt i Gratis-planen, pluss:",
          "2 000 NEXUS AI-svar i måneden i stedet for 30 om dagen",
          "Be NEXUS AI om å sette scener og svare på vanlig språk",
          "Én konto, gyldig på alle NEXUS-enheter",
          "Gratis prøveperiode — 3 dager månedlig, 7 dager årlig; si opp ved periodens slutt",
        ],
        cta: {
          label: "Start gratis prøveperiode",
          monthlyLabel: "Start 3 dagers gratis prøveperiode",
          yearlyLabel: "Start 7 dagers gratis prøveperiode",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Familie",
        price: "Gratis",
        period: "for hele familien",
        badge: "Hele hjemmet",
        features: [
          "Husstandsmedlemmer med rollebasert tilgang — ingen grense for antall medlemmer",
          "Roller som eier, medlem og gjest",
          "Rettigheter for styring, invitasjon og innstillinger per medlem",
          "Scener og automatiseringer synkroniseres mellom dine egne innloggede enheter",
          "Aktiv i hele økosystemet (skrivebord og mobil)",
          "Helt gratis sammen med hjemmet ditt",
        ],
        cta: { label: "Kom i gang med Familie", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Si opp når som helst fra Fakturering i appen eller fra kontoen din på dette nettstedet. Oppsigelsen trer i kraft ved slutten av inneværende periode.",
  },
  downloads: {
    heading: "Innebygd på alle datamaskiner. Hjemme på mobilen.",
    lead: "Alltid gratis. Hvert installasjonsprogram leveres med en publisert SHA-256-sjekksum, slik at du kan verifisere det du installerer.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian og Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · signert APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Versjon",
    sizeLabel: "Størrelse",
    webCard: {
      title: "Én konto, i hele økosystemet ditt",
      desc: "Skrivebordsprogrammer for Windows og Linux og Android-appen. Når du er logget inn, holdes rom, enheter, scener og automatiseringer sømløst synkronisert på tvers av skjermene dine.",
      cta: { label: "Last ned NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "På Windows er den enkleste veien Microsoft Store: pakken er signert av Microsoft, og oppdateringer kommer via Store. Den direkte .exe-filen er usignert, så Windows kan advare om «ukjent utgiver» — se sjekksummer.",
  },
  faq: {
    heading: "De viktige spørsmålene, besvart.",
    items: [
      [
        "Fungerer NEXUS helt på mitt lokale nettverk?",
        "Ja. NEXUS er bygget på en streng arkitektur med lokal kontroll først. Enhetene, rommene, scenene og sensortelemetrien dine behandles direkte på din egen maskinvare hjemme. Selv når internett er nede, fortsetter all lokal styring, belysning og alle automatiseringer å fungere sømløst uten forsinkelse. Innlogging synkroniserer innstillingene dine trygt på tvers av alle skjermene dine.",
      ],
      [
        "Må jeg installere NEXUS, eller kjører det i nettleseren?",
        "Installer skrivebordsprogrammet (Windows eller Linux) eller Android-appen. NEXUS tilbys ikke som nettleserapp. Enhetskommandoer går over ditt eget lokale nettverk. Shelly, Philips Hue, ESPHome, Tasmota, WLED og Home Assistant bruker lokal HTTP i skrivebordsprogrammet og på Android. TP-Link Kasa og Yeelight trenger rå TCP, så de kjører i skrivebordsprogrammet. Dette nettstedet er for konto, nedlastinger og fakturering.",
      ],
      [
        "Hva tilfører NEXUS+-abonnementet?",
        "Grunnleggende smarthjem-styring — ubegrenset antall enheter, rom, frakoblede automatiseringer og lokale dashbord — er gratis. NEXUS+ inneholder alt i Gratis, NEXUS AI for scener og spørsmål på vanlig språk, 2 000 svar i måneden, avanserte tilkoblinger for å legge til Home Assistant-enheter og én konto på alle enheter, med 3 dagers månedlig eller 7 dagers årlig prøveperiode. Enhetskommandoer kjører fortsatt lokalt. Husstandsroller er inkludert i hjemmet ditt uten ekstra kostnad.",
      ],
      [
        "Hvilken konto tilhører NEXUS+-abonnementet mitt?",
        "E-postadressen som ble brukt ved betaling. Logg inn på dette nettstedet eller i appen før du betaler: betalingssiden åpnes da med kontoens e-postadresse utfylt, og abonnementet vises på alle enheter du logger inn på. NEXUS+ kan ikke kjøpes uten konto. Hvis du betaler med en annen e-postadresse, lagres abonnementet under den adressen og vises ikke på kontoen din før du logger inn med den.",
      ],
      [
        "Hvordan kjører automatiseringer og tidsstyrte regler?",
        "NEXUS-automatiseringsmotoren vurderer tidsplanene og sensorreglene dine på enheten du holder i gang — skrivebordsappen blir værende i systemstatusfeltet og kjører døgnet rundt, slik at belysning, energi og sikkerhetsrutiner aldri venter på en sky. Scener og tidsur som utløses fra mobilappene dine, gjelder umiddelbart over ditt LAN. Nye hendelser sendes videre til varslingskanalene du aktiverer på siden Umiddelbare varsler: stripen i appen, systemvarsler, ntfy, Telegram eller din egen HTTPS-webhook.",
      ],
      [
        "Hvilke enheter og økosystemer støttes?",
        "NEXUS snakker hver enhets egen lokale protokoll: Shelly (Gen1 og Gen2+), Tasmota, WLED, ESPHome, Philips Hue og Home Assistant over lokal HTTP på alle plattformer, pluss TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY-modus) og Wake-on-LAN over det lokale nettverket i skrivebordsappen, uten konto eller nøkkel. Alt annet — Matter- eller Zigbee-utstyr — kobles til via din egen Home Assistant-server, som NEXUS behandler som én enkelt lokal hub. Lokal IP-oppdagelse parer enheter umiddelbart, uten produsentsky imellom.",
      ],
      [
        "Hvordan integreres overvåkingskameraer og sensorer?",
        "NEXUS samler overvåkingskameraer, bevegelsesdetektorer og inngangssensorer i ett sentralt sikkerhetsdashbord. Du kan automatisere personvernmodus, aktivere overvåkingsrutiner når du forlater hjemmet og se hver bevegelse eller kontakthendelse i appen — samt på varslingskanalene du aktiverer (systemvarsler, ntfy, Telegram eller din egen webhook).",
      ],
      [
        "Kan jeg si opp NEXUS+ når som helst?",
        "Ja, helt problemfritt og uten bindinger. Du kan si opp med ett klikk når som helst: fra Konto og fakturering i appen, via nettstedet vårt eller direkte fra ordrelenken i faktureringskvitteringen på e-post. Premium-fordelene dine forblir aktive til slutten av faktureringsperioden, uten flere belastninger.",
      ],
      [
        "Kan jeg styre hjemmet mitt når jeg er borte?",
        "Ikke gjennom en NEXUS-sky: NEXUS snakker direkte med enhetene dine på hjemmenettverket og har ingen relé. For å nå det utenfra kan du koble telefonen eller den bærbare til hjemmenettverket med en VPN som Tailscale (subnet router) eller WireGuard på ruteren din; NEXUS fungerer da akkurat som hjemme. NEXUS har ennå ingen innstilling for hub-adresse, så VPN-en må gjøre ditt lokale adresseområde tilgjengelig, og skanning etter nye enheter fungerer bare på hjemmenettverket. Eksponer aldri en enhet mot internett med portvideresending. Trinn-for-trinn-veiledningen er docs/REMOTE-ACCESS.md i repositoriet.",
      ],
      [
        "Finnes det en iPhone-versjon?",
        "Det finnes ingen App Store-app, fordi NEXUS ikke bruker en betalt Apple Developer-konto. Med en Mac og en gratis Apple-ID kan du bygge den for din egen iPhone (veiledning: docs/IOS-BUILD.md), og en utgivelse kan også legge ved en usignert IPA som AltStore eller Sideloadly kan signere for deg; den veien er ikke verifisert på en ekte iPhone ennå. En gratis Apple-ID lar appen utløpe etter 7 dager, og varsler mens appen er lukket er ikke tilgjengelige på iOS. Hjemmehuben er fortsatt skrivebordsappen; iPhone er en klient.",
      ],
      [
        "Enheten min står ikke på listen. Hva kan jeg gjøre?",
        "NEXUS støtter bare enheter med en dokumentert lokal protokoll; enheter som kun bruker sky støttes ikke, fordi NEXUS aldri snakker med en produsentsky. Kompatibilitetslisten (docs/COMPATIBILITY.md) omfatter også Sonoff i DIY-modus, WiZ, LIFX, Govee (LAN) og Wake-on-LAN. Hver av disse har automatiserte protokolltester, men en modell regnes som verifisert først når noen melder at den fungerte på en ekte enhet. Skriv til oss via kontaktskjemaet på dette nettstedet (velg «New Device / Connector Request») eller på e-post: merke og modell, hva du forventet og hva som skjedde. At du forteller at en modell fungerte på din ekte enhet er det som markerer den som verifisert; ta aldri med passord, lokale nøkler eller tokens.",
      ],
      [
        "Trenger jeg en konto? Hva skjer hvis serveren er nede?",
        "Ja: du logger inn én gang med en gratis e-postkonto for å åpne NEXUS. Etter det skjer styring av enheter og kjøring av automatiseringer på ditt eget nettverk og fortsetter å fungere uten internett. Kontoen gir synkronisering mellom enhetene dine, Familie og AI-assistenten, som bruker gratis skytjenester med begrensninger. Når en av dem ikke er tilgjengelig, for eksempel når det gratis Supabase-prosjektet er satt på pause etter omtrent en uke uten aktivitet, sier skjermene som bruker skyen at serveren ikke kan nås i stedet for å vise noe som lagret; enheter, automatiseringer og systemstatusfeltet fortsetter å fungere. Hvis AI-kvoten eller -tjenesten er oppbrukt, sier assistenten at den ikke kunne svare.",
      ],
      [
        "Kan jeg sikkerhetskopiere innstillingene mine og flytte dem til en annen enhet?",
        "Ja. Innstillinger har en seksjon for sikkerhetskopi der du kan eksportere innstillinger og automatiseringer til en JSON-fil og importere den på en annen enhet eller etter en ominstallering. Passord, tokens og lokale nøkler fjernes fra listen over parede enheter i filen, så skriv dem inn på nytt etter gjenoppretting. Hold sikkerhetskopifilen privat.",
      ],
      [
        "Kan jeg eksportere energidataene mine?",
        "Ja. Energi-siden kan eksportere de nyeste faktiske effektmålingene fra enhetene dine som en CSV- eller JSON-fil. NEXUS har bare data for enheter som faktisk rapporterer effekt; uten noen parede enheter er det ingenting å eksportere.",
      ],
      [
        "Hvorfor advarer Windows meg når jeg kjører installasjonsprogrammet?",
        "Installer fra Microsoft Store, så slipper du denne advarselen: Microsoft signerer den pakken under sertifiseringen og leverer oppdateringer via Store. Den direkte .exe-nedlastingen er ennå ikke signert med et kommersielt sertifikat, så SmartScreen kan vise «ukjent utgiver». Du kan sammenligne filen med sjekksummene som står i nedlastingsseksjonen før du kjører den. Retningslinjene våre for kodesignering er lenket fra bunnteksten på nettstedet.",
      ],
    ],
  },
  about: {
    title: "Om NEXUS",
    lead: "En uavhengig smarthjem-plattform med lokal kontroll først, laget for hastighet, absolutt personvern og ekte eierskap til maskinvaren. Ved å snakke direkte med enhetene dine over ditt eget hjemmenettverk fjerner NEXUS skybinding for godt.",
    manifesto: {
      heading: "Hvorfor vi bygde NEXUS",
      text: "Den moderne smarthjem-bransjen tok en feil avgjørelse. Proprietære økosystemer tvang huseiere inn i obligatoriske abonnementer, forsinkelser på grunn av skyavhengighet og invaderende telemetrisporing. Når internettforbindelsen faller ut, skal ikke bryteren i stuen slutte å virke. Vi bygde NEXUS fordi vi mener hjemmet ditt er din fristed: planløsningen din, kameratilstandene dine og familiens daglige rutiner hører utelukkende hjemme på din egen maskinvare.",
    },
    pillars: [
      {
        title: "Hastighet med lokal kontroll først",
        desc: "Hver automatisering og kommando utføres over ditt lokale LAN på millisekunder. Ingen rundturer til eksterne skyservere, null forsinkelse.",
      },
      {
        title: "Kompromissløst personvern",
        desc: "Ingen analysetelemetri, ingen atferdsprofilering og ingen salg av dine private rutiner. Du trenger en konto; oppsettet ditt lagres i din egen kontorad som er beskyttet på radnivå. Enhetskommandoer blir fortsatt på ditt LAN.",
      },
      {
        title: "Ingen leverandørbinding",
        desc: "Åpne lokale protokoller først: Shelly, Philips Hue, ESPHome, Tasmota og WLED svarer NEXUS direkte, og alt annet kobles til via din egen Home Assistant-server i stedet for en produsentsky.",
      },
      {
        title: "Ærlig, bærekraftig SaaS",
        desc: "Grunnleggende smarthjem-styring er helt gratis og ubegrenset for alltid. NEXUS+ er NEXUS AI-abonnementet og bidrar til å dekke den skybruken.",
      },
    ],
    architecture: {
      heading: "Utviklet for pålitelighet",
      lead: "NEXUS holder en lettvekts skrivebordsmotor i systemstatusfeltet slik at tidsplaner og sensorregler fortsetter å bli vurdert så lenge datamaskinen er på, og mobilappen åpner rett mot det samme lokale nettverket.",
      items: [
        {
          icon: "layers",
          title: "Skrivebord",
          desc: "Appene for Windows, macOS og Linux blir i systemstatusfeltet og holder lokale tidsplaner og sensorregler i gang så lenge datamaskinen er på. Windows og Linux leveres som ferdige installasjonsprogrammer; macOS bygges fra kildekode (usignert: høyreklikk → Åpne).",
        },
        {
          icon: "wifi",
          title: "Telefon",
          desc: "Android- og iOS-appene åpner mot det samme lokale nettverket; enhetskommandoer går fortsatt over ditt LAN. Android leveres som en signert APK; iOS bygges fra kildekode med Xcode og en gratis Apple-ID.",
        },
        {
          icon: "lock",
          title: "Konto",
          desc: "En konto kreves slik at rom, enheter og scener er like på hver skjerm. Enhetskommandoer forlater ikke hjemmenettverket ditt.",
        },
      ],
    },
    linksTitle: "Nyttige lenker",
  },
  footer: {
    tagline:
      "Styr hele smarthjemmet ditt direkte over det lokale nettverket — uten leverandørbinding og uten skyavhengighet. Selv når internett faller ut, stopper aldri hjemmet ditt.",
    product: "Produkt",
    productLinks: [
      ["Funksjoner", "#features"],
      ["Priser", "#pricing"],
      ["Last ned", "#downloads"],
      ["Vanlige spørsmål", "#faq"],
      ["Om oss", "/about"],
    ],
    account: "Kunde og støtte",
    accountLinks: [
      ["Kontakt og teknisk støtte", "javascript:nxOpenContactModal('Technical Support')"],
      ["Utgivelsesnotater og fellesskap", RELEASES_URL],
      ["Last ned apper", "#downloads"],
    ],
    legal: "Juridisk",
    legalLinks: [
      ["Personvern", "/privacy"],
      ["Vilkår", "/terms"],
      ["Refusjoner", "/refund"],
      ["Kodesignering", "/code-signing"],
      ["Bidra", "/contribute"],
    ],
    rights: "Alle rettigheter forbeholdt.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
