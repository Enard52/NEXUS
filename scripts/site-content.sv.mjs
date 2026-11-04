import { RELEASES_URL } from "./site-constants.mjs";

export const sv = {
  title: "NEXUS — Ditt smarta hem, styrt på ditt eget nätverk",
  ogImageAlt: "NEXUS ekosystem för smarta hem på dator och mobil",
  description:
    "NEXUS är ett lokalt först-ekosystem för smarta hem till Windows, macOS, Linux, Android och iOS. Direkt styrning av enheter över ditt eget lokala nätverk, snabba automationer och energimätning i realtid. Gratis för alltid; valfritt NEXUS+-abonnemang.",
  nav: [
    ["#features", "Funktioner"],
    ["#how", "Så fungerar det"],
    ["#integrations", "Integrationer"],
    ["#pricing", "Priser"],
    ["#downloads", "Ladda ner"],
    ["#faq", "Vanliga frågor"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Smart hem, lokalt först",
    h1a: "Ditt hem.",
    h1b: "Tyst under din kontroll.",
    lead: "Ett enhetligt ekosystem för dina lampor, ditt klimat, dina rullgardiner och sensorer — som pratar direkt med enheterna på ditt eget lokala nätverk. Snabba automationer, strömmätning i realtid och styrning som fortsätter fungera när internet ligger nere.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Senaste version",
    shotAlt: "NEXUS gränssnitt och kontrollcenter",
    trust: [
      "Gratis, obegränsat antal enheter",
      "Ingen molntjänst krävs för styrning",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Kraftfull infrastruktur. Enkel styrning.",
    lead: "Varje enhetsstatus, strömmätning och automatiserad scen körs direkt över ditt lokala nätverk, utan beroende av externa molntjänster.",
    items: [
      [
        "zap",
        "Snabba automationer",
        "Scenarier som utlöses av tid eller solnedgång körs direkt på din lokala hårdvara — och fortsätter pålitligt i bakgrunden på datorn.",
      ],
      [
        "gauge",
        "Energiavläsning i realtid",
        "Läs av effekt och strömförbrukning i realtid direkt från smarta uttag och strömbrytare som stöds på ditt lokala nätverk.",
      ],
      [
        "wifi",
        "Lokal nätverkshastighet",
        "Direkt LAN-kommunikation över HTTP, TCP och UDP med de märken som listas under Integrationer. Ingen omväg via molnet i kommandovägen.",
      ],
      [
        "lock",
        "Integritet från grunden",
        "Din hemkonfiguration och enhetstelemetri stannar på din lokala hårdvara. Ett konto krävs för att använda NEXUS; det sparar din installation i din egen rad med åtkomstkontroll på radnivå. Enhetskommandon går fortfarande över ditt LAN.",
      ],
      [
        "sparkles",
        "NEXUS AI-intelligens",
        "Lokala kommandon för smarta hem är omedelbara och gratis för alltid. Den valfria AI-assistenten i molnet ger smarta förslag när du behöver vägledning.",
      ],
      [
        "layers",
        "Öppna lokala protokoll",
        "Direkta anslutningar pratar på ditt LAN. Matter och Zigbee ansluts via din egen Home Assistant-server — avsnittet Integrationer visar vad som är direkt respektive via brygga.",
      ],
    ],
  },
  how: {
    heading: "Från nedladdning till uppkopplad på några minuter.",
    steps: [
      [
        "1",
        "Installera och öppna",
        "Ladda ner det inbyggda installationsprogrammet för din plattform (Windows, Linux eller Android). Logga sedan in — ett konto krävs för att använda NEXUS, och det synkroniserar även din installation mellan dina skärmar.",
      ],
      [
        "2",
        "Lägg till dina enheter",
        "Välj märke, skanna det lokala nätverket eller ange en IP-adress. Märken med direkt anslutning talar sitt eget protokoll — ingen tillverkarmoln på den vägen.",
      ],
      [
        "3",
        "Lev i ditt hem",
        "Scener, schemalagda automationer och verkliga energiavläsningar — enhetlig styrning på dator och mobil.",
      ],
    ],
  },
  integrations: {
    heading: "Fungerar med det du redan har.",
    lead: "Gratis, lokala protokoll först. Allt som saknar direkt anslutning fungerar ändå via Home Assistant-bryggan.",
    groups: [
      [
        "Lokal HTTP — på alla plattformar",
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
        "Lokalt nätverk, inget konto eller nyckel — skrivbordsappen",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY-läge)", "Wake-on-LAN"],
      ],
    ],
    more: "Saknas något? Begär en anslutning",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Gratis att använda. NEXUS+ när du vill ha mer",
    lead: "",
    currencyNote: "Priser i USD",
    plans: [
      {
        name: "Gratis",
        price: "$0",
        period: "för alltid",
        features: [
          "Obegränsat antal enheter och rum över alla lokala protokoll som stöds",
          "Inget molnberoende: körs lokalt på ditt eget LAN",
          "30 dagliga NEXUS AI-kommandon och enhetsåtgärder",
          "Schemalagda lokala automationer och egna scener",
          "Kontosynkronisering mellan flera enheter (rum, enheter, scener)",
          "100 % privat: ingen spårning, ingen datainsamling",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "per månad",
        badge: "Mest populär",
        features: [
          "Allt i gratisnivån, plus:",
          "2 000 NEXUS AI-svar i månaden i stället för 30 om dagen",
          "Be NEXUS AI ställa in scener och svara på vanligt språk",
          "Ett konto, giltigt på alla NEXUS-enheter",
          "Gratis provperiod — 3 dagar månadsvis, 7 dagar årsvis; avsluta vid periodens slut",
        ],
        cta: {
          label: "Starta din gratis provperiod",
          monthlyLabel: "Starta 3 dagars gratis provperiod",
          yearlyLabel: "Starta 7 dagars gratis provperiod",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Familj",
        price: "Free",
        period: "för hela familjen",
        badge: "Hela hemmet",
        features: [
          "Hushållsmedlemmar med rollbaserad åtkomst — ingen gräns för antal medlemmar",
          "Roller som ägare, medlem och gäst",
          "Behörigheter per medlem för styrning, inbjudningar och inställningar",
          "Scener och automationer synkroniseras mellan dina egna inloggade enheter",
          "Aktivt i hela ekosystemet (dator och mobil)",
          "Helt gratis med ditt hem",
        ],
        cta: { label: "Börja med Familj", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Avsluta när som helst under Fakturering i appen eller från ditt konto på den här webbplatsen. Uppsägningen börjar gälla vid slutet av den pågående perioden.",
  },
  downloads: {
    heading: "Inbyggt på varje dator. Hemma på din telefon.",
    lead: "Alltid gratis. Varje installationsprogram levereras med en publicerad SHA-256-kontrollsumma så att du kan verifiera det du installerar.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian och Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · signerad APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Version",
    sizeLabel: "Storlek",
    webCard: {
      title: "Ett konto, i hela ditt ekosystem",
      desc: "Skrivbordsprogram för Windows och Linux samt Android-appen. När du är inloggad hålls dina rum, enheter, scener och automationer sömlöst synkroniserade mellan dina skärmar.",
      cta: { label: "Ladda ner NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "I Windows är Microsoft Store den enklaste vägen: paketet är signerat av Microsoft och uppdateringar kommer via Store. Den direkta .exe-filen är osignerad, så Windows kan varna för en ”okänd utgivare” — se kontrollsummorna.",
  },
  faq: {
    heading: "De viktiga frågorna, besvarade.",
    items: [
      [
        "Fungerar NEXUS helt på mitt lokala nätverk?",
        "Ja. NEXUS bygger på en strikt lokal-först-arkitektur. Dina enheter, rum, scener och sensortelemetri bearbetas direkt på din egen hemmahårdvara. Även vid internetavbrott fortsätter all lokal styrning, belysning och alla automationer att fungera sömlöst utan fördröjning. Inloggning synkroniserar säkert dina inställningar mellan alla dina skärmar.",
      ],
      [
        "Måste jag installera NEXUS, eller körs det i webbläsaren?",
        "Installera skrivbordsprogrammet (Windows eller Linux) eller Android-appen. NEXUS erbjuds inte som webbapp. Enhetskommandon går över ditt eget lokala nätverk. Shelly, Philips Hue, ESPHome, Tasmota, WLED och Home Assistant använder lokal HTTP i skrivbordsprogrammet och på Android. TP-Link Kasa och Yeelight kräver rå TCP, så de körs i skrivbordsprogrammet. Den här webbplatsen är till för konto, nedladdningar och fakturering.",
      ],
      [
        "Vad tillför NEXUS+-abonnemanget?",
        "Grundläggande styrning av smarta hem — obegränsat antal enheter, rum, offlineautomationer och lokala instrumentpaneler — är gratis. NEXUS+ innehåller allt i Gratis, NEXUS AI för scener och frågor på vanligt språk, 2 000 svar i månaden, avancerade anslutningar för att lägga till Home Assistant-enheter och ett konto på alla enheter, med en provperiod på 3 dagar månadsvis eller 7 dagar årsvis. Enhetskommandon körs fortfarande lokalt. Hushållsroller ingår i ditt hem utan extra kostnad.",
      ],
      [
        "Vilket konto tillhör mitt NEXUS+-abonnemang?",
        "E-postadressen som användes vid betalningen. Logga in på den här webbplatsen eller i appen innan du betalar: kassan öppnas då med ditt kontos e-postadress ifylld, och abonnemanget visas på varje enhet du loggar in på. NEXUS+ kan inte köpas utan konto. Om du betalar med en annan e-postadress sparas abonnemanget under den adressen och visas inte på ditt konto förrän du loggar in med den.",
      ],
      [
        "Hur körs automationer och schemalagda regler?",
        "NEXUS automationsmotor utvärderar dina scheman och sensorregler på den enhet du håller igång — skrivbordsappen ligger kvar i systemfältet och körs dygnet runt, så rutiner för belysning, energi och säkerhet aldrig behöver vänta på en molntjänst. Scener och timers som utlöses från din telefon tillämpas omedelbart över ditt LAN. Nya händelser skickas vidare till de aviseringskanaler du aktiverar på sidan Direktaviseringar: remsan i appen, systemaviseringar, ntfy, Telegram eller din egen HTTPS-webhook.",
      ],
      [
        "Vilka enheter och ekosystem stöds?",
        "NEXUS talar varje enhets eget lokala protokoll: Shelly (Gen1 och Gen2+), Tasmota, WLED, ESPHome, Philips Hue och Home Assistant över lokal HTTP på alla plattformar, plus TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY-läge) och Wake-on-LAN över det lokala nätverket i skrivbordsappen, utan konto eller nyckel. Allt annat — Matter- eller Zigbee-utrustning — ansluts via din egen Home Assistant-server, som NEXUS behandlar som en enda lokal hubb. Lokal IP-upptäckt parar enheter direkt, utan tillverkarmoln emellan.",
      ],
      [
        "Hur integreras säkerhetskameror och sensorer?",
        "NEXUS samlar dina säkerhetskameror, rörelsedetektorer och entrésensorer i en central säkerhetspanel. Du kan automatisera integritetslägen, aktivera övervakningsrutiner när du lämnar hemmet och se varje rörelse- eller kontakthändelse i appen — samt på de aviseringskanaler du aktiverar (systemaviseringar, ntfy, Telegram eller din egen webhook).",
      ],
      [
        "Kan jag avsluta NEXUS+ när som helst?",
        "Ja, helt smidigt och utan bindningstid. Du kan avsluta med ett enda klick när som helst: från inställningarna Konto och fakturering i appen, via vår webbplats eller direkt från orderlänken i kvittot i ditt faktureringsmejl. Dina premiumförmåner är aktiva till slutet av faktureringsperioden, utan fler debiteringar.",
      ],
      [
        "Kan jag styra mitt hem när jag är borta?",
        "Inte via ett NEXUS-moln: NEXUS pratar med dina enheter direkt på ditt hemmanätverk och har ingen relästation. För att nå det utifrån ansluter du telefonen eller laptopen till hemmanätverket med ett VPN som Tailscale (subnet router) eller WireGuard på din router; NEXUS fungerar då precis som hemma. NEXUS har ännu ingen inställning för hubbadress, så VPN:et måste göra ditt lokala adressintervall nåbart, och sökning efter nya enheter fungerar bara på hemmanätverket. Exponera aldrig en enhet mot internet med portvidarebefordran. Steg-för-steg-guiden finns i docs/REMOTE-ACCESS.md i repositoriet.",
      ],
      [
        "Finns det en iPhone-version?",
        "Det finns ingen App Store-app, eftersom NEXUS inte använder ett betalt Apple Developer-konto. Med en Mac och ett gratis Apple-ID kan du bygga den för din egen iPhone (guide: docs/IOS-BUILD.md), och en release kan också bifoga en osignerad IPA som AltStore eller Sideloadly kan signera åt dig; den vägen har ännu inte verifierats på en riktig iPhone. Ett gratis Apple-ID gör att appen löper ut efter 7 dagar, och aviseringar när appen är stängd är inte tillgängliga på iOS. Hemhubben är fortfarande skrivbordsappen; iPhone är en klient.",
      ],
      [
        "Min enhet finns inte i listan. Vad kan jag göra?",
        "NEXUS stöder bara enheter med ett dokumenterat lokalt protokoll; enheter som bara fungerar via molnet stöds inte eftersom NEXUS aldrig pratar med en tillverkares moln. Kompatibilitetslistan (docs/COMPATIBILITY.md) omfattar även Sonoff i DIY-läge, WiZ, LIFX, Govee (LAN) och Wake-on-LAN. Var och en av dessa har automatiserade protokolltester, men en modell räknas som verifierad först när någon rapporterar att den fungerade på en riktig enhet. Skriv till oss via kontaktformuläret på den här webbplatsen (välj ”New Device / Connector Request”) eller via e-post: märke och modell, vad du förväntade dig och vad som hände. Att du berättar att en modell fungerade på din riktiga enhet är det som markerar den som verifierad; skicka aldrig lösenord, lokala nycklar eller tokens.",
      ],
      [
        "Behöver jag ett konto? Vad händer om servern ligger nere?",
        "Ja: du loggar in en gång med ett gratis e-postkonto för att öppna NEXUS. Därefter sker styrning av enheter och körning av automationer på ditt eget nätverk och fortsätter fungera utan internet. Kontot lägger till synkronisering mellan dina enheter, Familj och AI-assistenten, som använder gratis molntjänster med begränsningar. När en av dem inte är tillgänglig, till exempel när det kostnadsfria Supabase-projektet har pausats efter ungefär en veckas inaktivitet, säger molnskärmarna att servern inte kan nås i stället för att visa något som sparat; enheter, automationer och systemfältet fortsätter fungera. Om AI-kvoten eller tjänsten är slut säger assistenten att den inte kunde svara.",
      ],
      [
        "Kan jag säkerhetskopiera mina inställningar och flytta dem till en annan enhet?",
        "Ja. Under Inställningar finns ett avsnitt för säkerhetskopiering där du kan exportera dina inställningar och automationer till en JSON-fil och importera den på en annan enhet eller efter en ominstallation. Lösenord, tokens och lokala nycklar tas bort från listan över parade enheter i filen, så ange dem på nytt efter återställningen. Håll säkerhetskopian privat.",
      ],
      [
        "Kan jag exportera mina energidata?",
        "Ja. På sidan Energi kan du exportera de senaste verkliga effektavläsningarna från dina enheter som en CSV- eller JSON-fil. NEXUS har bara data för enheter som faktiskt rapporterar effekt; om inga är parade finns det inget att exportera.",
      ],
      [
        "Varför varnar Windows mig när jag kör installationsprogrammet?",
        "Installera från Microsoft Store så ser du inte den här varningen: Microsoft signerar paketet under certifieringen och levererar uppdateringar via Store. Den direkta .exe-nedladdningen är ännu inte signerad med ett kommersiellt certifikat, så SmartScreen kan visa ”okänd utgivare”. Du kan jämföra filen med kontrollsummorna i nedladdningsavsnittet innan du kör den. Vår policy för kodsignering länkas i sidfoten.",
      ],
    ],
  },
  about: {
    title: "Om NEXUS",
    lead: "En oberoende smart hem-plattform med lokalt först-fokus, utformad för snabbhet, absolut integritet och verkligt hårdvaruägande. Genom att prata direkt med dina enheter över ditt eget hemmanätverk gör NEXUS slut på molnberoende för alltid.",
    manifesto: {
      heading: "Därför byggde vi NEXUS",
      text: "Branschen för smarta hem har tagit en felaktig väg. Slutna ekosystem tvingade hemägare in i obligatoriska prenumerationer, molnberoende fördröjning och påträngande telemetrispårning. När din internetanslutning går ner ska inte strömbrytaren i vardagsrummet sluta fungera. Vi byggde NEXUS eftersom vi tror att ditt hem är din fristad: din planlösning, dina kameras status och dina vardagliga familjerutiner hör uteslutande hemma på din egen hårdvara.",
    },
    pillars: [
      {
        title: "Lokal hastighet",
        desc: "Varje automation och kommando körs över ditt lokala LAN på millisekunder. Inga rundturer till fjärranslutna molnservrar, ingen fördröjning.",
      },
      {
        title: "Kompromisslös integritet",
        desc: "Ingen analystelemetri, ingen beteendeprofilering och ingen försäljning av dina privata rutiner. Ett konto krävs; din installation sparas i din egen kontorad som skyddas på radnivå. Enhetskommandon stannar fortfarande på ditt LAN.",
      },
      {
        title: "Ingen inlåsning hos tillverkare",
        desc: "Öppna lokala protokoll först: Shelly, Philips Hue, ESPHome, Tasmota och WLED svarar NEXUS direkt, och allt annat ansluts via din egen Home Assistant-server i stället för ett tillverkarmoln.",
      },
      {
        title: "Ärlig, hållbar SaaS",
        desc: "Grundläggande hantering av smarta hem är helt gratis och obegränsad för alltid. NEXUS+ är NEXUS AI-abonnemanget och hjälper till att täcka den molnanvändningen.",
      },
    ],
    architecture: {
      heading: "Byggt för tillförlitlighet",
      lead: "NEXUS håller en lätt skrivbordsmotor i ditt systemfält så att scheman och sensorregler fortsätter utvärderas medan datorn är på, och mobilappen öppnas direkt på samma lokala nätverk.",
      items: [
        {
          icon: "layers",
          title: "Dator",
          desc: "Apparna för Windows, macOS och Linux ligger kvar i systemfältet och håller lokala scheman och sensorregler igång medan datorn är på. Windows och Linux levereras som färdiga installationsprogram; macOS byggs från källkod (osignerat: högerklicka → Öppna).",
        },
        {
          icon: "wifi",
          title: "Telefon",
          desc: "Apparna för Android och iOS öppnas på samma lokala nätverk; enhetskommandon går fortfarande över ditt LAN. Android levereras som en signerad APK; iOS byggs från källkod med Xcode och ett gratis Apple-ID.",
        },
        {
          icon: "lock",
          title: "Konto",
          desc: "Ett konto krävs så att rum, enheter och scener stämmer överens på varje skärm. Enhetskommandon lämnar inte ditt hemmanätverk.",
        },
      ],
    },
    linksTitle: "Praktiska länkar",
  },
  footer: {
    tagline:
      "Styr hela ditt smarta hem direkt över ditt lokala nätverk — utan inlåsning hos tillverkare och utan molnberoende. Även när internet ligger nere står ditt hem aldrig still.",
    product: "Produkt",
    productLinks: [
      ["Funktioner", "#features"],
      ["Priser", "#pricing"],
      ["Ladda ner", "#downloads"],
      ["Vanliga frågor", "#faq"],
      ["Om oss", "/about"],
    ],
    account: "Kund och support",
    accountLinks: [
      ["Kontakt och teknisk support", "javascript:nxOpenContactModal('Technical Support')"],
      ["Versionsinformation och community", RELEASES_URL],
      ["Ladda ner apparna", "#downloads"],
    ],
    legal: "Juridik",
    legalLinks: [
      ["Integritet", "/privacy"],
      ["Villkor", "/terms"],
      ["Återbetalningar", "/refund"],
      ["Kodsignering", "/code-signing"],
      ["Bidra", "/contribute"],
    ],
    rights: "Alla rättigheter förbehållna.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
