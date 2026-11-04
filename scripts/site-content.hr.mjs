import { RELEASES_URL } from "./site-constants.mjs";

export const hr = {
  title: "NEXUS — Vaš pametni dom, upravljan na vašoj vlastitoj mreži",
  ogImageAlt: "NEXUS ekosustav pametnog doma na računalu i mobitelu",
  description:
    "NEXUS je ekosustav pametnog doma koji prije svega radi lokalno, za Windows, macOS, Linux, Android i iOS. Izravno upravljanje uređajima preko vaše lokalne mreže, brze automatizacije i mjerenje potrošnje energije uživo. Zauvijek besplatan; uz izbornu NEXUS+ pretplatu.",
  nav: [
    ["#features", "Značajke"],
    ["#how", "Kako radi"],
    ["#integrations", "Integracije"],
    ["#pricing", "Cijene"],
    ["#downloads", "Preuzimanje"],
    ["#faq", "Česta pitanja"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Pametni dom, prvo lokalno",
    h1a: "Vaš dom.",
    h1b: "Tiho pod vašom kontrolom.",
    lead: "Jedan objedinjeni ekosustav za vaša svjetla, klimu, rolete i senzore — razgovara izravno s uređajima na vašoj lokalnoj mreži. Brze automatizacije, mjerenje potrošnje uživo i upravljanje koje radi i kad nestane interneta.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Najnovija verzija",
    shotAlt: "NEXUS sučelje i kontrolni centar",
    trust: [
      "Besplatno, neograničen broj uređaja",
      "Za upravljanje nije potreban oblak",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Snažna infrastruktura. Jednostavno upravljanje.",
    lead: "Svako stanje uređaja, mjerenje potrošnje i automatizirana scena rade izravno preko vaše lokalne mreže, bez ovisnosti o vanjskom oblaku.",
    items: [
      [
        "zap",
        "Brze automatizacije",
        "Scenariji pokrenuti vremenom ili zalaskom sunca izvršavaju se izravno na vašem lokalnom hardveru — i pouzdano nastavljaju raditi u pozadini na računalu.",
      ],
      [
        "gauge",
        "Očitanja energije uživo",
        "Čitajte snagu u vatima i potrošnju u stvarnom vremenu izravno s podržanih pametnih utičnica i prekidača na vašoj lokalnoj mreži.",
      ],
      [
        "wifi",
        "Brzina lokalne mreže",
        "Izravna LAN komunikacija preko HTTP-a, TCP-a i UDP-a s markama navedenima u odjeljku Integracije. Bez zaobilaženja oblaka na putu naredbe.",
      ],
      [
        "lock",
        "Privatnost u temeljima",
        "Konfiguracija vašeg doma i telemetrija uređaja ostaju na vašem lokalnom hardveru. Za korištenje NEXUS-a potreban je račun; on sprema vaše postavke u vaš vlastiti redak uz kontrolu pristupa na razini retka. Naredbe uređajima i dalje idu preko vašeg LAN-a.",
      ],
      [
        "sparkles",
        "NEXUS AI inteligencija",
        "Lokalne naredbe pametnog doma su trenutne i zauvijek besplatne. Izborni AI asistent u oblaku nudi pametne prijedloge kad god vam zatreba pomoć.",
      ],
      [
        "layers",
        "Otvoreni lokalni protokoli",
        "Izravni konektori komuniciraju na vašem LAN-u. Matter i Zigbee uključuju se preko vašeg vlastitog Home Assistant poslužitelja — odjeljak Integracije navodi što je izravno, a što preko mosta.",
      ],
    ],
  },
  how: {
    heading: "Od preuzimanja do povezanosti za nekoliko minuta.",
    steps: [
      [
        "1",
        "Instalirajte i otvorite",
        "Preuzmite izvorni instalacijski program za svoju platformu (Windows, Linux ili Android). Zatim se prijavite — za korištenje NEXUS-a potreban je račun, a on i usklađuje postavke na svim vašim zaslonima.",
      ],
      [
        "2",
        "Dodajte svoje uređaje",
        "Odaberite marku, skenirajte lokalnu mrežu ili unesite IP adresu. Marke s izravnim konektorom koriste vlastiti protokol — bez oblaka proizvođača na tom putu.",
      ],
      [
        "3",
        "Živite svoj dom",
        "Scene, zakazane automatizacije i stvarna očitanja energije — objedinjeno upravljanje na računalu i mobitelu.",
      ],
    ],
  },
  integrations: {
    heading: "Radi s onim što već imate.",
    lead: "Prvo besplatni, lokalni protokoli. Sve bez izravnog konektora i dalje radi preko Home Assistant mosta.",
    groups: [
      [
        "Lokalni HTTP — na svakoj platformi",
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
        "Lokalna mreža, bez računa ili ključa — desktop aplikacija",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY način)", "Wake-on-LAN"],
      ],
    ],
    more: "Nešto nedostaje? Zatražite konektor",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Besplatno za korištenje. NEXUS+ kad želite više",
    lead: "",
    currencyNote: "Cijene u USD",
    plans: [
      {
        name: "Besplatno",
        price: "$0",
        period: "zauvijek",
        features: [
          "Neograničen broj uređaja i soba preko svakog podržanog lokalnog protokola",
          "Nula ovisnosti o oblaku: radi lokalno na vašem vlastitom LAN-u",
          "30 dnevnih NEXUS AI naredbi i radnji na uređajima",
          "Zakazane lokalne automatizacije i vlastite scene",
          "Sinkronizacija računa na više uređaja (sobe, uređaji, scene)",
          "100% privatno: bez praćenja, bez prikupljanja podataka",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "mjesečno",
        badge: "Najpopularnije",
        features: [
          "Sve iz besplatnog paketa, plus:",
          "2.000 NEXUS AI odgovora mjesečno umjesto 30 dnevno",
          "Zatražite od NEXUS AI-ja da postavi scene i odgovara običnim jezikom",
          "Jedan račun, vrijedi na svakom NEXUS uređaju",
          "Besplatno probno razdoblje — 3 dana mjesečno, 7 dana godišnje; otkazivanje na kraju razdoblja",
        ],
        cta: {
          label: "Započnite besplatno probno razdoblje",
          monthlyLabel: "Započnite 3-dnevno besplatno probno razdoblje",
          yearlyLabel: "Započnite 7-dnevno besplatno probno razdoblje",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Obitelj",
        price: "Besplatno",
        period: "za cijelu obitelj",
        badge: "Cijeli dom",
        features: [
          "Članovi kućanstva s pristupom prema ulogama — bez ograničenja broja članova",
          "Uloge vlasnika, člana i gosta",
          "Dopuštenja za upravljanje, pozivanje i postavke po članu",
          "Scene i automatizacije sinkroniziraju se između vaših prijavljenih uređaja",
          "Aktivno u cijelom ekosustavu (računalo i mobitel)",
          "Potpuno besplatno uz vaš dom",
        ],
        cta: { label: "Započnite s Family", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Otkažite bilo kada u odjeljku Naplata u aplikaciji ili s vašeg računa na ovoj stranici. Otkazivanje stupa na snagu na kraju tekućeg razdoblja.",
  },
  downloads: {
    heading: "Izvorno na svakom računalu. Kao kod kuće na mobitelu.",
    lead: "Uvijek besplatno. Svaki instalacijski program dolazi s objavljenim SHA-256 kontrolnim zbrojem kako biste mogli provjeriti što instalirate.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bitni", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian i Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · potpisani APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Verzija",
    sizeLabel: "Veličina",
    webCard: {
      title: "Jedan račun, u cijelom vašem ekosustavu",
      desc: "Desktop programi za Windows i Linux te Android aplikacija. Kad ste prijavljeni, vaše sobe, uređaji, scene i automatizacije ostaju besprijekorno usklađeni na svim zaslonima.",
      cta: { label: "Preuzmite NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "Na Windowsima je najlakši put Microsoft Store: paket je potpisan od strane Microsofta, a ažuriranja stižu preko Storea. Izravni .exe nije potpisan, pa Windows može upozoriti na „nepoznatog izdavača” — pogledajte kontrolne zbrojeve.",
  },
  faq: {
    heading: "Važna pitanja, s odgovorima.",
    items: [
      [
        "Radi li NEXUS u potpunosti na mojoj lokalnoj mreži?",
        "Da. NEXUS je izgrađen na strogoj arhitekturi koja prije svega radi lokalno. Vaši uređaji, sobe, scene i telemetrija senzora obrađuju se izravno na vašem kućnom hardveru. Čak i tijekom prekida interneta sva lokalna upravljanja, rasvjeta i automatizacije nastavljaju besprijekorno raditi bez kašnjenja. Prijava sigurno usklađuje vaše postavke na svim vašim zaslonima.",
      ],
      [
        "Moram li instalirati NEXUS ili radi u pregledniku?",
        "Instalirajte desktop program (Windows ili Linux) ili Android aplikaciju. NEXUS se ne nudi kao aplikacija u pregledniku. Naredbe uređajima idu preko vaše lokalne mreže. Shelly, Philips Hue, ESPHome, Tasmota, WLED i Home Assistant koriste lokalni HTTP u desktop programu i na Androidu. TP-Link Kasa i Yeelight trebaju sirovi TCP, pa rade u desktop programu. Ova stranica služi za račun, preuzimanja i naplatu.",
      ],
      [
        "Što NEXUS+ paket dodaje?",
        "Osnovno upravljanje pametnim domom — neograničen broj uređaja, soba, offline automatizacije i lokalne nadzorne ploče — besplatno je. NEXUS+ uključuje sve iz besplatnog paketa, NEXUS AI za scene i pitanja običnim jezikom, 2.000 odgovora mjesečno, napredne veze za dodavanje Home Assistant uređaja i jedan račun na svakom uređaju, uz 3-dnevno probno razdoblje za mjesečni ili 7-dnevno za godišnji paket. Naredbe uređajima i dalje se izvršavaju lokalno. Uloge u kućanstvu uključene su uz vaš dom bez dodatnog troška.",
      ],
      [
        "Kojem računu pripada moja NEXUS+ pretplata?",
        "E-mail adresi korištenoj pri plaćanju. Prijavite se na ovoj stranici ili u aplikaciji prije plaćanja: plaćanje će se tada otvoriti s već ispunjenom e-mail adresom vašeg računa, a pretplata će se prikazati na svakom uređaju na koji se prijavite. NEXUS+ ne može se kupiti bez računa. Ako platite drugom e-mail adresom, pretplata se pohranjuje pod tom adresom i neće se pojaviti na vašem računu dok se ne prijavite njome.",
      ],
      [
        "Kako rade automatizacije i zakazana pravila?",
        "NEXUS automatizacijski modul procjenjuje vaše rasporede i pravila senzora na uređaju koji ostavite uključen — desktop aplikacija ostaje u programskoj traci sustava i izvršava se danonoćno, pa rasvjeta, energija i sigurnosne rutine nikad ne čekaju oblak. Scene i tajmeri pokrenuti s vašeg mobitela primjenjuju se trenutno preko vašeg LAN-a. Novi događaji šalju se na kanale obavijesti koje uključite na stranici Trenutne obavijesti: traka u aplikaciji, sistemske obavijesti, ntfy, Telegram ili vaš vlastiti HTTPS webhook.",
      ],
      [
        "Koji su uređaji i ekosustavi podržani?",
        "NEXUS govori vlastitim lokalnim protokolom svakog uređaja: Shelly (Gen1 i Gen2+), Tasmota, WLED, ESPHome, Philips Hue i Home Assistant preko lokalnog HTTP-a na svakoj platformi, te TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY mode) i Wake-on-LAN preko lokalne mreže u desktop aplikaciji, bez računa ili ključa. Sve ostalo — Matter ili Zigbee oprema — uključuje se preko vašeg vlastitog Home Assistant poslužitelja, kojeg NEXUS tretira kao jedno lokalno čvorište. Lokalno otkrivanje IP adresa uparuje uređaje odmah, bez oblaka proizvođača između.",
      ],
      [
        "Kako su integrirane sigurnosne kamere i senzori?",
        "NEXUS objedinjuje vaše sigurnosne kamere, detektore pokreta i senzore ulaza u središnju sigurnosnu nadzornu ploču. Možete automatizirati načine privatnosti, uključiti nadzorne rutine pri odlasku od kuće i vidjeti svaki događaj pokreta ili kontakta u aplikaciji — te na kanalima obavijesti koje uključite (sistemske obavijesti, ntfy, Telegram ili vaš vlastiti webhook).",
      ],
      [
        "Mogu li otkazati NEXUS+ bilo kada?",
        "Da, potpuno bez muke i bez obveza. Možete otkazati jednim klikom bilo kada: u postavkama Račun i naplata u aplikaciji, preko naše web stranice ili izravno iz poveznice na narudžbu u potvrdi o naplati poslanoj e-poštom. Vaše premium pogodnosti ostaju aktivne do kraja obračunskog razdoblja, bez budućih naplata.",
      ],
      [
        "Mogu li upravljati domom kad sam odsutan?",
        "Ne preko NEXUS oblaka: NEXUS razgovara s vašim uređajima izravno na kućnoj mreži i nema posrednika. Da biste mu pristupili izvana, stavite mobitel ili prijenosno računalo na kućnu mrežu pomoću VPN-a poput Tailscalea (subnet router) ili WireGuarda na vašem usmjerivaču; NEXUS tada radi točno kao kod kuće. NEXUS još nema postavku adrese čvorišta, pa VPN mora učiniti dostupnim vaš raspon lokalnih adresa, a skeniranje novih uređaja radi samo na kućnoj mreži. Nikada ne izlažite uređaj internetu preusmjeravanjem portova. Vodič korak po korak je docs/REMOTE-ACCESS.md u repozitoriju.",
      ],
      [
        "Postoji li verzija za iPhone?",
        "Nema aplikacije u App Storeu, jer NEXUS ne koristi plaćeni Apple Developer račun. S Macom i besplatnim Apple ID-om možete ga izgraditi za vlastiti iPhone (vodič: docs/IOS-BUILD.md), a izdanje može priložiti i nepotpisani IPA koji AltStore ili Sideloadly mogu potpisati umjesto vas; taj put još nije provjeren na pravom iPhoneu. Besplatni Apple ID istječe aplikaciju nakon 7 dana, a obavijesti dok je aplikacija zatvorena nisu dostupne na iOS-u. Kućno čvorište i dalje je desktop aplikacija; iPhone je klijent.",
      ],
      [
        "Moj uređaj nije na popisu. Što mogu učiniti?",
        "NEXUS podržava samo uređaje s dokumentiranim lokalnim protokolom; uređaji samo za oblak nisu podržani jer NEXUS nikada ne razgovara s oblakom proizvođača. Popis kompatibilnosti (docs/COMPATIBILITY.md) uključuje i Sonoff u DIY načinu, WiZ, LIFX, Govee (LAN) i Wake-on-LAN. Svaki od njih ima automatizirane testove protokola, ali model se smatra provjerenim tek kad netko prijavi da je radio na pravom uređaju. Javite nam se preko kontaktnog obrasca na ovoj stranici (odaberite „New Device / Connector Request”) ili e-poštom: marka i model, što ste očekivali i što se dogodilo. Vaša poruka da je model radio na vašem pravom uređaju ono je što ga označava provjerenim; nikada ne šaljite lozinke, lokalne ključeve ili tokene.",
      ],
      [
        "Trebam li račun? Što ako poslužitelj ne radi?",
        "Da: prijavite se jednom besplatnim e-mail računom kako biste otvorili NEXUS. Nakon toga upravljanje uređajima i izvršavanje automatizacija odvija se na vašoj mreži i nastavlja raditi bez interneta. Račun dodaje sinkronizaciju među uređajima, Family i AI asistenta, koji koriste besplatne usluge u oblaku s ograničenjima. Kad je neka od njih nedostupna, na primjer kad se besplatni Supabase projekt pauzirao nakon otprilike tjedan dana bez aktivnosti, zasloni u oblaku kažu da je poslužitelj nedostupan umjesto da prikažu nešto kao spremljeno; uređaji, automatizacije i ikona u traci nastavljaju raditi. Ako je AI kvota ili usluga iscrpljena, asistent kaže da nije mogao odgovoriti.",
      ],
      [
        "Mogu li napraviti sigurnosnu kopiju postavki i prenijeti ih na drugi uređaj?",
        "Da. Postavke imaju odjeljak za sigurnosnu kopiju u kojem možete izvesti svoje postavke i automatizacije u JSON datoteku te ih uvesti na drugom uređaju ili nakon ponovne instalacije. Lozinke, tokeni i lokalni ključevi uklanjaju se s popisa uparenih uređaja u datoteci, pa ih ponovno unesite nakon vraćanja. Datoteku sigurnosne kopije držite privatnom.",
      ],
      [
        "Mogu li izvesti svoje podatke o energiji?",
        "Da. Stranica Energija može izvesti najnovija stvarna očitanja snage vaših uređaja kao CSV ili JSON datoteku. NEXUS ima podatke samo za uređaje koji doista prijavljuju snagu; ako nijedan nije uparen, nema što izvesti.",
      ],
      [
        "Zašto me Windows upozorava kad pokrenem instalacijski program?",
        "Instalirajte iz Microsoft Storea i nećete vidjeti ovo upozorenje: Microsoft potpisuje taj paket tijekom certifikacije i isporučuje ažuriranja preko Storea. Izravno preuzimanje .exe datoteke još nije potpisano komercijalnim certifikatom, pa SmartScreen može prikazati „nepoznati izdavač”. Prije pokretanja možete usporediti datoteku s kontrolnim zbrojevima navedenima u odjeljku preuzimanja. Naša politika potpisivanja koda povezana je u podnožju stranice.",
      ],
    ],
  },
  about: {
    title: "O NEXUS-u",
    lead: "Neovisna platforma pametnog doma koja prije svega radi lokalno, dizajnirana za brzinu, apsolutnu privatnost i istinsko vlasništvo nad hardverom. Razgovarajući izravno s vašim uređajima preko vaše kućne mreže, NEXUS zauvijek uklanja zaključavanje u oblak.",
    manifesto: {
      heading: "Zašto smo izgradili NEXUS",
      text: "Moderna industrija pametnih domova skrenula je pogrešnim putem. Zatvoreni ekosustavi natjerali su vlasnike domova na obvezne pretplate, kašnjenje zbog ovisnosti o oblaku i invazivno praćenje telemetrije. Kad vam internet padne, prekidač u dnevnoj sobi ne bi smio prestati raditi. Izgradili smo NEXUS jer vjerujemo da je vaš dom vaše utočište: vaš tlocrt, stanja vaših kamera i vaše dnevne obiteljske rutine pripadaju isključivo vašem vlastitom hardveru.",
    },
    pillars: [
      {
        title: "Lokalna brzina na prvom mjestu",
        desc: "Svaka automatizacija i naredba izvršava se preko vašeg lokalnog LAN-a u milisekundama. Bez putovanja do udaljenih poslužitelja u oblaku, bez kašnjenja.",
      },
      {
        title: "Beskompromisna privatnost",
        desc: "Bez analitičke telemetrije, bez profiliranja ponašanja i bez prodaje vaših privatnih rutina. Račun je potreban; vaše postavke pohranjene su u vašem vlastitom retku računa zaštićenom na razini retka. Naredbe uređajima i dalje ostaju na vašem LAN-u.",
      },
      {
        title: "Bez zaključavanja kod proizvođača",
        desc: "Prvo otvoreni lokalni protokoli: Shelly, Philips Hue, ESPHome, Tasmota i WLED odgovaraju NEXUS-u izravno, a sve ostalo uključuje se preko vašeg vlastitog Home Assistant poslužitelja umjesto oblaka proizvođača.",
      },
      {
        title: "Pošten, održiv SaaS",
        desc: "Osnovno upravljanje pametnim domom potpuno je besplatno i zauvijek neograničeno. NEXUS+ je NEXUS AI paket i pomaže pokriti troškove korištenja tog oblaka.",
      },
    ],
    architecture: {
      heading: "Izgrađen za pouzdanost",
      lead: "NEXUS drži laganu desktop jezgru u programskoj traci sustava kako bi se rasporedi i pravila senzora nastavili procjenjivati dok je vaše računalo uključeno, a mobilna aplikacija otvara se izravno na istoj lokalnoj mreži.",
      items: [
        {
          icon: "layers",
          title: "Računalo",
          desc: "Aplikacije za Windows, macOS i Linux ostaju u programskoj traci sustava i održavaju lokalne rasporede i pravila senzora dok je računalo uključeno. Windows i Linux isporučuju se kao gotovi instalacijski programi; macOS se gradi iz izvornog koda (nepotpisano: desni klik → Open).",
        },
        {
          icon: "wifi",
          title: "Mobitel",
          desc: "Aplikacije za Android i iOS otvaraju se na istoj lokalnoj mreži; naredbe uređajima i dalje idu preko vašeg LAN-a. Android se isporučuje kao potpisani APK; iOS se gradi iz izvornog koda pomoću Xcodea i besplatnog Apple ID-a.",
        },
        {
          icon: "lock",
          title: "Račun",
          desc: "Račun je potreban kako bi se sobe, uređaji i scene podudarali na svakom zaslonu. Naredbe uređajima ne napuštaju vašu kućnu mrežu.",
        },
      ],
    },
    linksTitle: "Korisne poveznice",
  },
  footer: {
    tagline:
      "Upravljajte cijelim pametnim domom izravno preko lokalne mreže — bez zaključavanja kod proizvođača i bez ovisnosti o oblaku. Čak i kad nestane interneta, vaš dom nikad ne staje.",
    product: "Proizvod",
    productLinks: [
      ["Značajke", "#features"],
      ["Cijene", "#pricing"],
      ["Preuzimanje", "#downloads"],
      ["Česta pitanja", "#faq"],
      ["O nama", "/about"],
    ],
    account: "Korisnici i podrška",
    accountLinks: [
      ["Kontakt i tehnička podrška", "javascript:nxOpenContactModal('Technical Support')"],
      ["Napomene o izdanju i zajednica", RELEASES_URL],
      ["Preuzmite aplikacije", "#downloads"],
    ],
    legal: "Pravne informacije",
    legalLinks: [
      ["Privatnost", "/privacy"],
      ["Uvjeti", "/terms"],
      ["Povrati", "/refund"],
      ["Potpisivanje koda", "/code-signing"],
      ["Doprinesite", "/contribute"],
    ],
    rights: "Sva prava pridržana.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
