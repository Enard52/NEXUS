import { RELEASES_URL } from "./site-constants.mjs";

export const bs = {
  "title": "NEXUS — Vaš pametni dom, upravljan na vlastitoj mreži",
  "ogImageAlt": "NEXUS pametni kućni ekosistem na desktop i mobilnim uređajima",
  "description": "NEXUS je pametni kućni ekosistem koji prvo radi lokalno za Windows, macOS, Linux, Android i iOS. Direktna kontrola uređaja preko vaše lokalne mreže, responzivne automatizacije i podaci o potrošnji energije u realnom vremenu. Besplatno zauvijek; opcionalni NEXUS+ plan.",
  "nav": [
    [
      "#features",
      "Karakteristike"
    ],
    [
      "#how",
      "Kako funkcioniše"
    ],
    [
      "#integrations",
      "Integracije"
    ],
    [
      "#pricing",
      "Cijene"
    ],
    [
      "#downloads",
      "Preuzimanje"
    ],
    [
      "#faq",
      "ČPP"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Pametni dom koji prvo radi lokalno",
    "h1a": "Vaš dom.",
    "h1b": "Tiho pod vašom kontrolom.",
    "lead": "Jedinstveni ekosistem za vaša svjetla, klimu, pokrivače i senzore — koji direktno komunicira s uređajima na vašoj lokalnoj mreži. Reagirajuće automatizacije, mjerenje potrošnje u realnom vremenu, i kontrola koja funkcioniše čak i kada internet prestane raditi.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Najnovija verzija",
    "shotAlt": "NEXUS interfejs i kontrolni centar",
    "trust": [
      "Besplatni, neograničeni uređaji",
      "Za kontrolu nije potreban oblak",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Moćna infrastruktura. Laka kontrola.",
    "lead": "Svaka status uređaja, mjera potrošnje i automatizovana scena funkcioniše direktno preko vaše lokalne mreže bez zavisnosti od vanjskog oblaka.",
    "items": [
      [
        "zap",
        "Reagirajuće automatizacije",
        "Scenariji pokretani vremenom i zalaskom sunca izvršavaju se direktno na vašem lokalnom hardveru — pouzdano nastavljaju u pozadini na desktopu."
      ],
      [
        "gauge",
        "Uživo očitanje energije",
        "Čitajte real-time snagu i potrošnju električne energije direktno sa podržanih pametnih utičnica i prekidača na vašoj lokalnoj mreži."
      ],
      [
        "wifi",
        "Brzina lokalne mreže",
        "Direktna LAN komunikacija preko HTTP, TCP i UDP sa brendovima navedenim u Integracijama. Nema prelaska kroz cloud u putanji naredbi."
      ],
      [
        "lock",
        "Privatnost dizajnirana od početka",
        "Vaša konfiguracija doma i telemetrija uređaja ostaju na vašem lokalnom hardveru. Za korištenje NEXUS-a potreban je nalog; on čuva vaša podešavanja u vašem sopstvenom redu pod kontrolom pristupa na nivou reda. Komande za uređaje i dalje prolaze preko vaše LAN mreže."
      ],
      [
        "sparkles",
        "NEXUS AI Inteligencija",
        "Lokalne pametne kućne komande su instantne i besplatne zauvijek. Opcionalni AI pomoćnik u oblaku pruža inteligentne sugestije kad god vam je potrebna pomoć."
      ],
      [
        "layers",
        "Otvoreni lokalni protokoli",
        "Direktni konektori komuniciraju preko vaše LAN mreže. Matter i Zigbee se povezuju preko vašeg vlastitog Home Assistant servera — sekcija Integracije navodi šta je direktno, a šta preko mosta."
      ]
    ]
  },
  "how": {
    "heading": "Od preuzimanja do povezivanja u nekoliko minuta.",
    "steps": [
      [
        "1",
        "Instalirajte i otvorite",
        "Preuzmite izvorni instalater za vašu platformu (Windows, Linux ili Android). Zatim se prijavite — za korištenje NEXUS-a je potreban račun, koji također sinhronizuje postavke na svim vašim ekranima."
      ],
      [
        "2",
        "Dodajte svoje uređaje",
        "Odaberite svoj brend, skenirajte lokalnu mrežu ili unesite IP. Brendovi s direktnim konektorom koriste vlastiti protokol — bez cloud servisa proizvođača u tom putu."
      ],
      [
        "3",
        "Doživite svoj dom",
        "Scene, planirane automatizacije i stvarna očitanja energije — objedinjena kontrola na desktopu i mobilnom."
      ]
    ]
  },
  "integrations": {
    "heading": "Radi s onim što već imate.",
    "lead": "Besplatni, lokalni protokoli prvo. Sve što nema direktni konektor i dalje radi preko Home Assistant bridge-a.",
    "groups": [
      [
        "Lokalni HTTP — na svakoj platformi",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Philips Hue bridge",
          "Home Assistant"
        ]
      ],
      [
        "Lokalna mreža, bez naloga ili ključa — desktop aplikacija",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (DIY način)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "Nešto nedostaje? Zatražite konektor",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Besplatno za korištenje. NEXUS+ kad želite više",
    "lead": "",
    "currencyNote": "Cijene u USD",
    "plans": [
      {
        "name": "Besplatno",
        "price": "$0",
        "period": "forever",
        "features": [
          "Neograničen broj uređaja i soba za svaki podržani lokalni protokol",
          "Nema zavisnosti od oblaka: radi lokalno na vašoj LAN mreži",
          "30 dnevnih NEXUS AI komandi i akcija uređaja",
          "Planirane lokalne automatizacije i prilagođene scene",
          "Sinkronizacija naloga na više uređaja (prostorije, uređaji, scene)",
          "100% privatno: bez praćenja, bez skupljanja podataka"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "po mjesecu",
        "badge": "Najpopularnije",
        "features": [
          "Sve iz besplatnog nivoa, plus:",
          "2.000 NEXUS AI odgovora mjesečno umjesto 30 dnevno",
          "Zatražite od NEXUS AI da postavlja scene i odgovara običnim jezikom",
          "Jedan nalog, važi na svakom NEXUS uređaju",
          "Besplatna proba — 3 dana mjesečno, 7 dana godišnje; otkažite na kraju perioda"
        ],
        "cta": {
          "label": "Započnite besplatnu probu",
          "monthlyLabel": "Započnite 3-dnevnu besplatnu probu",
          "yearlyLabel": "Započnite 7-dnevnu besplatnu probu",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Porodični",
        "price": "Besplatno",
        "period": "za cijelu porodicu",
        "badge": "Cijeli dom",
        "features": [
          "Članovi domaćinstva s pristupom zasnovanim na ulogama — bez ograničenja broja članova",
          "Uloge vlasnika, člana i gosta",
          "Kontrola po članu, pozivi i dozvole za postavke",
          "Scene i automatizacije se sinkronizuju na svim vašim prijavljenim uređajima",
          "Aktivno u cijelom ekosistemu (desktop i mobilno)",
          "Potpuno besplatno uz vaš dom"
        ],
        "cta": {
          "label": "Počnite s porodicom",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Otkažite u bilo kojem trenutku putem naplate u aplikaciji ili putem vašeg naloga na ovoj stranici. Otkazivanje stupa na snagu na kraju tekućeg perioda."
  },
  "downloads": {
    "heading": "Nativno na svakom desktopu. Kod kuće na vašem telefonu.",
    "lead": "Uvijek besplatno. Svaki instalacioni paketi dolazi s objavljenim SHA-256 kontrolnim zbrojem tako da možete provjeriti što instalirate.",
    "cards": [
      [
        "windows",
        "monitor",
        "Windows",
        "Windows 10/11 · 64-bit",
        "NEXUS-Setup.exe",
        ".exe"
      ],
      [
        "linux",
        "terminal",
        "Linux",
        "Debian i Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · potpisani APK",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Verzija",
    "sizeLabel": "Veličina",
    "webCard": {
      "title": "Jedan račun, kroz cijeli vaš ekosistem",
      "desc": "Windows i Linux desktop programi i Android aplikacija. Prijavljeni, vaši prostori, uređaji, scene i automatizacije ostaju besprijekorno sinhronizovani između vaših ekrana.",
      "cta": {
        "label": "Preuzmite NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "Na Windowsu je najjednostavniji put Microsoft Store: paket je potpisan od strane Microsoft-a i ažuriranja dolaze kroz Store. Direktni .exe nije potpisan, tako da Windows može upozoriti na „nepoznatog izdavača“ — pogledajte kontrolne sume."
  },
  "faq": {
    "heading": "Važna pitanja, odgovorena.",
    "items": [
      [
        "Da li NEXUS radi potpuno na mojoj lokalnoj mreži?",
        "Da. NEXUS je izgrađen na strogoj lokalno-prvenstvenoj arhitekturi. Vaši uređaji, sobe, scene i telemetrija senzora obrađuju se direktno preko vaše vlastite kućne opreme. Čak i tokom prekida interneta, sve lokalne kontrole, rasvjeta i automatizacije nastavljaju da funkcionišu besprijekorno, bez ikakvih kašnjenja. Sigurno prijavljivanje sinhronizira vaša podešavanja na svim vašim ekranima."
      ],
      [
        "Da li trebam instalirati NEXUS ili on radi u pregledniku?",
        "Instalirajte desktop program (Windows ili Linux) ili Android aplikaciju. NEXUS nije dostupan kao aplikacija za preglednik. Uređaji se kontrolišu preko vaše lokalne mreže. Shelly, Philips Hue, ESPHome, Tasmota, WLED i Home Assistant koriste lokalni HTTP u desktop programu i na Androidu. TP-Link Kasa i Yeelight zahtijevaju raw TCP, pa rade u desktop programu. Ova stranica je za nalog, preuzimanja i naplatu. Šta dodaje NEXUS+ plan?"
      ],
      [
        "Šta NEXUS+ plan dodaje?",
        "Osnovna kontrola pametnog doma—neograničeni uređaji, sobe, offline automatizacije i lokalni kontrolni paneli—je besplatna. NEXUS+ uključuje sve što nudi besplatna verzija, NEXUS AI za scene i pitanja u običnom jeziku, 2.000 odgovora mjesečno, napredna povezivanja za dodavanje uređaja iz Home Assistanta i jedan račun na svakom uređaju, uz 3-dnevno mjesečno ili 7-dnevno godišnje probno razdoblje. Komande za uređaje i dalje se izvršavaju lokalno. Uloge u domaćinstvu su uključene s vašim domom bez dodatnih troškova."
      ],
      [
        "Koji račun pripada mojoj NEXUS+ pretplati?",
        "Email adresa korištena pri plaćanju. Prijavite se na ovom sajtu ili u aplikaciji prije nego što platite: tada se checkout otvara sa popunjenom email adresom vašeg naloga, a pretplata se prikazuje na svakom uređaju na kojem se prijavite. NEXUS+ se ne može kupiti bez naloga. Ako plaćate s drugom email adresom, pretplata se pohranjuje pod tom email adresom i neće se pojaviti na vašem nalogu dok se ne prijavite koristeći tu adresu."
      ],
      [
        "Kako automacije i zakazane naredbe funkcionišu?",
        "NEXUS automatizacijski motor procjenjuje vaše rasporede i pravila senzora na uređaju koji stalno koristite — desktop aplikacija ostaje u sistemskoj traci i izvršava zadatke 24/7, tako da rasvjeta, energetske i sigurnosne rutine nikada ne čekaju na oblak. Scene i tajmeri pokrenuti sa vašeg telefona primjenjuju se odmah preko vaše LAN mreže. Novi događaji se šire na kanale obavijesti koje omogućite na stranici Instant Notifications: u aplikaciji traka, sistemske obavijesti, ntfy, Telegram ili vaš vlastiti HTTPS webhook. Koji uređaji i ekosistemi su podržani?"
      ],
      [
        "Koji uređaji i ekosistemi su podržani?",
        "NEXUS koristi protokol svakog uređaja: Shelly (Gen1 i Gen2+), Tasmota, WLED, ESPHome, Philips Hue i Home Assistant putem lokalnog HTTP-a na svakoj platformi, plus TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY način) i Wake-on-LAN preko lokalne mreže u desktop aplikaciji, bez potrebe za korisničkim računom ili ključem. Sve ostalo — Matter ili Zigbee uređaji — se povezuje putem vašeg vlastitog Home Assistant servera, kojeg NEXUS tretira kao jedinstveni lokalni hub. Lokacijsko otkrivanje IP-a uparuje uređaje odmah, bez posredovanja vendor oblaka. Kako su integrisane sigurnosne kamere i senzori?"
      ],
      [
        "Kako se integrišu sigurnosne kamere i senzori?",
        "NEXUS konsoliduje vaše sigurnosne kamere, detektore pokreta i senzore za ulaz u centralizovani sigurnosni kontrolni panel. Možete automatizovati privatne režime, aktivirati nadzorne rutine kada napuštate dom i vidjeti svaki pokret ili događaj kontakta u aplikaciji — kao i na kanalima obavijesti koje omogućite (sistemske obavijesti, ntfy, Telegram ili vlastiti webhook)."
      ],
      [
        "Mogu li otkazati NEXUS+ u bilo kojem trenutku?",
        "Da, potpuno bez problema i bez ikakvih obaveza. Možete otkazati jednim klikom u bilo kojem trenutku: iz postavki Računa i Naplate u aplikaciji, putem naše web stranice ili direktno putem linka za narudžbu u vašem emailu s računom. Vaše premium pogodnosti ostaju aktivne do kraja vašeg obračunskog perioda bez dodatnih budućih naplata."
      ],
      [
        "Mogu li kontrolisati svoj dom kada nisam kod kuće?",
        "Ne preko NEXUS oblaka: NEXUS komunicira s vašim uređajima direktno na vašoj kućnoj mreži i nema posrednika. Da biste mu pristupili izvana, povežite svoj telefon ili laptop na kućnu mrežu koristeći VPN poput Tailscale (subnet router) ili WireGuard na svom ruteru; NEXUS tada funkcionira tačno kao kod kuće. NEXUS još nema postavku adrese čvorišta, pa VPN mora omogućiti da vaš lokalni raspon adresa bude dostupan, a skeniranje novih uređaja radi samo na kućnoj mreži. Nikada ne izlažite uređaj internetu korištenjem prosljeđivanja portova. Uputstvo korak po korak nalazi se u docs/REMOTE-ACCESS.md u repozitoriju."
      ],
      [
        "Postoji li verzija za iPhone?",
        "Ne postoji aplikacija u App Store-u, jer NEXUS ne koristi plaćeni Apple Developer nalog. Sa Mac-om i besplatnim Apple ID-jem možete je izgraditi za svoj iPhone (uputstvo: docs/IOS-BUILD.md), a u izdanju se također može priložiti ne-podpisani IPA koji AltStore ili Sideloadly može potpisati za vas; taj put još nije potvrđen na stvarnom iPhone-u. Besplatni Apple ID ističe aplikaciju nakon 7 dana, a obavijesti dok je aplikacija zatvorena nisu dostupne na iOS-u. Glavni hub je još uvijek desktop aplikacija; iPhone je klijent."
      ],
      [
        "Moj uređaj nije na listi. Šta mogu učiniti?",
        "NEXUS podržava samo uređaje sa dokumentovanim lokalnim protokolom; uređaji koji rade isključivo preko clouda nisu podržani jer NEXUS nikada ne komunicira sa cloudom proizvođača. Lista kompatibilnosti (docs/COMPATIBILITY.md) takođe uključuje Sonoff u DIY režimu, WiZ, LIFX, Govee (LAN) i Wake-on-LAN. Svaki od ovih uređaja ima automatizovane testove protokola, ali model se smatra provjerenim tek kada neko prijavi da je radio na stvarnom uređaju. Pišite nam preko kontakt forme na ovoj stranici (izaberite 'New Device / Connector Request') ili putem e-pošte: navedite brend i model, šta ste očekivali i šta se desilo. Obavještavanje nas da je model radio na vašem stvarnom uređaju je ono što ga označava kao provjeren; nikada ne uključujte lozinke, lokalne ključeve ili tokene."
      ],
      [
        "Da li mi je potreban račun? Šta se dešava ako server ne radi?",
        "Da: prijavite se jednom pomoću besplatnog email naloga da otvorite NEXUS. Nakon toga, kontrola uređaja i pokretanje automatizacija odvija se na vašoj mreži i nastavlja raditi bez interneta. Nalog dodaje sinhronizaciju preko vaših uređaja, Porodicu i AI asistenta, koji koriste besplatne cloud usluge sa ograničenjima. Kada jedna od tih usluga nije dostupna, na primjer kada besplatni Supabase projekat bude pauziran nakon otprilike sedmicu bez aktivnosti, cloud ekrani pokazuju da server nije dostupan umjesto da prikazuju nešto kao sačuvano; uređaji, automatizacije i tray nastavljaju raditi. Ako je AI kvota ili usluga iscrpljena, asistent kaže da nije mogao odgovoriti."
      ],
      [
        "Mogu li napraviti sigurnosnu kopiju svojih postavki i premjestiti ih na drugi uređaj?",
        "Da. Postavke imaju odjeljak za sigurnosnu kopiju gdje možete izvesti svoje postavke i automatizacije u JSON datoteku i uvesti ih na drugom uređaju ili nakon ponovne instalacije. Lozinke, tokeni i lokalni ključevi uklonjeni su s liste uparanih uređaja u datoteci, pa ih ponovo unesite nakon vraćanja. Držite datoteku sigurnosne kopije privatnom."
      ],
      [
        "Mogu li izvesti svoje podatke o potrošnji energije?",
        "Da. Stranica Energija može izvesti najnovija očitanja stvarne snage sa vaših uređaja u CSV ili JSON fajl. NEXUS ima podatke samo za uređaje koji zapravo izvještavaju o potrošnji; ako nijedan nije povezan, nema ničega za izvesti. Zašto me Windows upozorava kada pokrenem instalacioni program?"
      ],
      [
        "Zašto me Windows upozorava kada pokrenem instalater?",
        "Instalirajte iz Microsoft Store-a i nećete vidjeti ovo upozorenje: Microsoft potpisuje taj paket tokom certificiranja i dostavlja ažuriranja putem Store-a. Direktno preuzimanje .exe datoteke još nije potpisano komercijalnim certifikatom, pa SmartScreen može prikazati „nepoznatog izdavača“. Možete uporediti datoteku sa kontrolnim sumama navedenim u odjeljku za preuzimanja prije nego je pokrenete. Naša politika potpisivanja koda je povezana u podnožju sajta."
      ]
    ]
  },
  "about": {
    "title": "O NEXUS-u",
    "lead": "Nezavisna, lokalno prioritetna platforma za pametni dom dizajnirana za brzinu, apsolutnu privatnost i pravo vlasništvo nad hardverom. Time što direktno komunicira s vašim uređajima preko vaše kućne mreže, NEXUS trajno uklanja ograničenje na oblak.",
    "manifesto": {
      "heading": "Zašto smo izgradili NEXUS",
      "text": "Moderna industrija pametnih domova krenula je pogrešnim putem. Vlasnički ekosistemi prisiljavali su vlasnike kuća na obavezne pretplate, kašnjenje ovisno o oblaku i invazivno praćenje telemetrije. Kada vaša internet veza prestane raditi, sklopka u vašoj dnevnoj sobi ne bi trebala prestati raditi. NEXUS smo izgradili jer vjerujemo da je vaš dom vaše utočište: vaš tlocrt, stanja kamera i vaši svakodnevni porodični rutini pripadaju isključivo na vašem vlastitom hardveru."
    },
    "pillars": [
      {
        "title": "Brzina prvenstveno lokalno",
        "desc": "Svaka automatizacija i naredba izvršavaju se preko vaše lokalne LAN mreže u milisekundama. Nema povratnih putovanja do udaljenih cloud servera, nulta latencija."
      },
      {
        "title": "Nepokolebljiva privatnost",
        "desc": "Nema analitičke telemetrije, nema profilisanja ponašanja i nema prodaje vaših privatnih rutina. Nalog je obavezan; vaša postavka se čuva u vašem vlastitom redu naloga zaštićenom na nivou reda. Komande uređaja i dalje ostaju na vašoj LAN mreži."
      },
      {
        "title": "Bez zaključavanja kod dobavljača",
        "desc": "Prvo otvoreni lokalni protokoli: Shelly, Philips Hue, ESPHome, Tasmota i WLED odgovaraju direktno NEXUS-u, a sve ostalo se povezuje putem vlastitog Home Assistant servera umjesto putem cloud servisa dobavljača."
      },
      {
        "title": "Iskren, održiv SaaS",
        "desc": "Osnovno upravljanje pametnim domom je potpuno besplatno i neograničeno zauvijek. NEXUS+ je NEXUS AI plan i pomaže pokriti tu upotrebu oblaka."
      }
    ],
    "architecture": {
      "heading": "Projektovano za pouzdanost",
      "lead": "NEXUS održava lagani desktop motor u sistemskoj traci tako da rasporedi i pravila senzora nastave s evaluacijom dok je vaše računalo uključeno, a mobilna aplikacija se otvara direktno na istu lokalnu mrežu.",
      "items": [
        {
          "icon": "layers",
          "title": "Desktop",
          "desc": "Aplikacije za Windows, macOS i Linux ostaju u sistemskoj traci i održavaju lokalne rasporede i pravila senzora dok je računalo uključeno. Windows i Linux dolaze kao spremni instalateri; macOS se gradi iz izvornog koda (neosignirano: kliknite desnim tasterom → Otvori)."
        },
        {
          "icon": "wifi",
          "title": "Telefon",
          "desc": "Android i iOS aplikacije se otvaraju na istoj lokalnoj mreži; komande uređaja i dalje prolaze kroz vaš LAN. Android dolazi kao potpisani APK; iOS se gradi iz izvornog koda pomoću Xcode-a i besplatnog Apple ID-a."
        },
        {
          "icon": "lock",
          "title": "Račun",
          "desc": "Račun je potreban kako bi sobe, uređaji i scene bili usklađeni na svakom ekranu. Komande uređaja ne napuštaju vašu kućnu mrežu."
        }
      ]
    },
    "linksTitle": "Praktični linkovi"
  },
  "footer": {
    "tagline": "Kontrolišite cijeli svoj pametni dom direktno preko lokalne mreže — bez zaključavanja kod dobavljača i bez ovisnosti o oblaku. Čak i kada internet prestane raditi, vaš dom nikada ne staje.",
    "product": "Proizvod",
    "productLinks": [
      [
        "Karakteristike",
        "#features"
      ],
      [
        "Cijene",
        "#pricing"
      ],
      [
        "Preuzimanje",
        "#downloads"
      ],
      [
        "Često postavljana pitanja",
        "#faq"
      ],
      [
        "O nama",
        "/about"
      ]
    ],
    "account": "Korisnik i podrška",
    "accountLinks": [
      [
        "Kontakt i tehnička podrška",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Bilješke o izdanju i zajednica",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "Preuzmi aplikacije",
        "#downloads"
      ]
    ],
    "legal": "Pravno",
    "legalLinks": [
      [
        "Privatnost",
        "/privacy"
      ],
      [
        "Uslovi",
        "/terms"
      ],
      [
        "Povrati",
        "/refund"
      ],
      [
        "Potpisivanje koda",
        "/code-signing"
      ],
      [
        "Doprinesi",
        "/contribute"
      ]
    ],
    "rights": "Sva prava pridržana.",
    "langSwitchLabel": "Turski",
    "langSwitchHref": "/tr/"
  }
};
