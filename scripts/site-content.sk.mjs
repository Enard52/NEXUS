import { RELEASES_URL } from "./site-constants.mjs";

export const sk = {
  "title": "NEXUS — Váš inteligentný domov, spravovaný vo vašej vlastnej sieti",
  "ogImageAlt": "NEXUS ekosystém inteligentného domova na počítači a mobile",
  "description": "NEXUS je ekosystém inteligentného domova s prioritou lokality pre Windows, macOS, Linux, Android a iOS. Priame ovládanie zariadení vo vašej vlastnej lokálnej sieti, citlivé automatizácie a živé energetické metriky. Navždy zadarmo; voliteľný plán NEXUS+.",
  "nav": [
    [
      "#features",
      "Funkcie"
    ],
    [
      "#how",
      "Ako to funguje"
    ],
    [
      "#integrations",
      "Integrácie"
    ],
    [
      "#pricing",
      "Cenník"
    ],
    [
      "#downloads",
      "Stiahnuť"
    ],
    [
      "#faq",
      "Často kladené otázky"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Inteligentný domov s prioritou lokality",
    "h1a": "Váš domov.",
    "h1b": "Ticho pod vašou kontrolou.",
    "lead": "Jeden jednotný ekosystém pre vaše svetlá, klimatizáciu, tienenie a senzory — komunikuje priamo s zariadeniami vo vašej vlastnej lokálnej sieti. Reagujúce automatizácie, meranie výkonu v reálnom čase a ovládanie, ktoré funguje aj pri výpadku internetu.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Najnovšia verzia",
    "shotAlt": "Rozhranie a riadiace centrum NEXUS",
    "trust": [
      "Bezplatné, neobmedzené zariadenia",
      "Na ovládanie nie je potrebný žiadny cloud",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Výkonná infraštruktúra. Jednoduché ovládanie.",
    "lead": "Každý stav zariadenia, meranie výkonu a automatizovaná scéna beží priamo vo vašej lokálnej sieti bez závislosti na externom cloude.",
    "items": [
      [
        "zap",
        "Reagujúce automatizácie",
        "Scenáre spustené časom a západom slnka sa vykonávajú priamo na vašom lokálnom hardvéri — pokračujú spoľahlivo na pozadí na počítači."
      ],
      [
        "gauge",
        "Živé údaje o energie",
        "Čítajte aktuálnu spotrebu vo wattoch a energií priamo zo podporovaných inteligentných zásuviek a vypínačov vo vašej lokálnej sieti."
      ],
      [
        "wifi",
        "Rýchlosť lokálnej siete",
        "Priama komunikácia LAN cez HTTP, TCP a UDP s značkami uvedenými v Integráciách. Žiadne preposielanie cez cloud v ceste príkazu."
      ],
      [
        "lock",
        "Súkromie navrhnuté dizajnom",
        "Konfigurácia vášho domova a telemetria zariadení zostávajú na vašom lokálnom hardvéri. Na používanie NEXUSu je potrebný účet; ukladá vaše nastavenia v riadku, ktorému máte prístup na úrovni riadkov. Príkazy zariadení stále prechádzajú cez vašu LAN sieť."
      ],
      [
        "sparkles",
        "NEXUS AI Inteligencia",
        "Lokálne príkazy pre inteligentnú domácnosť sú okamžité a navždy zadarmo. Voliteľný cloudový AI asistent poskytuje inteligentné odporúčania vždy, keď potrebujete vedenie."
      ],
      [
        "layers",
        "Otvorte lokálne protokoly",
        "Priame konektory komunikujú cez vašu LAN. Matter a Zigbee sa pripájajú cez váš vlastný server Home Assistant — sekcia Integrácie uvádza, čo je priame a čo cez most."
      ]
    ]
  },
  "how": {
    "heading": "Od stiahnutia po pripojenie za niekoľko minút.",
    "steps": [
      [
        "1",
        "Nainštalujte a otvorte",
        "Stiahnite si natívny inštalátor pre vašu platformu (Windows, Linux alebo Android). Potom sa prihláste — na používanie NEXUS je potrebný účet, ktorý tiež synchronizuje nastavenia naprieč vašimi obrazovkami."
      ],
      [
        "2",
        "Pridajte svoje zariadenia",
        "Vyberte svoju značku, prehľadajte lokálnu sieť alebo zadajte IP adresu. Značky s priamym konektorom používajú svoj vlastný protokol — žiadna cloudová služba dodávateľa v tomto procese."
      ],
      [
        "3",
        "Zažite svoj domov",
        "Scény, plánované automatizácie a skutočné energetické údaje — jednotná kontrola naprieč desktopom a mobilom."
      ]
    ]
  },
  "integrations": {
    "heading": "Funguje so zariadeniami, ktoré už máte.",
    "lead": "Najprv bezplatné lokálne protokoly. Čokoľvek bez priameho konektora stále funguje cez Home Assistant most.",
    "groups": [
      [
        "Lokálne HTTP — na každej platforme",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Philips Hue most",
          "Home Assistant"
        ]
      ],
      [
        "Lokálna sieť, žiadny účet alebo kľúč — desktopová aplikácia",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (DIY režim)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "Niečo chýba? Požiadajte o konektor",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Bezplatné používanie. NEXUS+ keď chcete viac",
    "lead": "",
    "currencyNote": "Ceny v USD",
    "plans": [
      {
        "name": "Bezplatné",
        "price": "$0",
        "period": "forever",
        "features": [
          "Neobmedzené zariadenia a miestnosti cez každý podporovaný lokálny protokol",
          "Žiadna závislosť od cloudu: funguje lokálne vo vašej vlastnej LAN",
          "30 denných príkazov NEXUS AI a akcií zariadení",
          "Plánované lokálne automatizácie a vlastné scény",
          "Synchronizácia účtov na viacerých zariadeniach (miestnosti, zariadenia, scény)",
          "100 % súkromné: bez sledovania, bez zhromažďovania údajov"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "mesačne",
        "badge": "Najobľúbenejšie",
        "features": [
          "Všetko vo Free tarife, plus:",
          "2 000 odpovedí NEXUS AI mesačne namiesto 30 denne",
          "Požiadajte NEXUS AI, aby nastavil scény a odpovedal jednoduchým jazykom",
          "Jeden účet, platný na každom zariadení NEXUS",
          "Bezplatná skúšobná verzia — 3 dni mesačne, 7 dní ročne; zrušiť na konci obdobia"
        ],
        "cta": {
          "label": "Začnite svoju bezplatnú skúšobnú verziu",
          "monthlyLabel": "Začnite 3-dňovú bezplatnú skúšobnú verziu",
          "yearlyLabel": "Začnite 7-dňovú bezplatnú skúšobnú verziu",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Rodina",
        "price": "Zdarma",
        "period": "pre celú rodinu",
        "badge": "Celý dom",
        "features": [
          "Členovia domácnosti s prístupom založeným na rolách — bez obmedzenia počtu členov",
          "Role vlastníka, člena a hosťa",
          "Ovládanie, pozývanie a nastavenia povolení pre jednotlivých členov",
          "Scény a automatizácie sa synchronizujú naprieč vašimi vlastnými prihlásenými zariadeniami",
          "Aktívne v celom ekosystéme (desktop a mobil)",
          "Úplne zadarmo so vašou domácnosťou"
        ],
        "cta": {
          "label": "Začnite s rodinou",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Zrušenie kedykoľvek z fakturácie v aplikácii alebo zo svojho účtu na tejto stránke. Zrušenie nadobudne účinnosť na konci aktuálneho obdobia."
  },
  "downloads": {
    "heading": "Nativne na každom desktope. Doma na vašom telefóne.",
    "lead": "Vždy zadarmo. Každá inštalácia obsahuje publikovaný SHA-256 kontrolný súčet, aby ste mohli overiť, čo inštalujete.",
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
        "Debian a Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · podpísané APK",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Verzia",
    "sizeLabel": "Veľkosť",
    "webCard": {
      "title": "Jeden účet, v celom vašom ekosystéme",
      "desc": "Programy pre stolné počítače Windows a Linux a aplikácia pre Android. Po prihlásení sa vaše miestnosti, zariadenia, scény a automatizácie plynulo synchronizujú na všetkých obrazovkách.",
      "cta": {
        "label": "Stiahnuť NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "Na Windows je najjednoduchšia cesta Microsoft Store: balík je podpísaný spoločnosťou Microsoft a aktualizácie prichádzajú cez Store. Priamy .exe súbor nie je podpísaný, takže Windows môže upozorniť na „neznámeho vydavateľa“ — pozrite si kontrolné súčty. Dôležité otázky, odpovedané. Funguje NEXUS úplne v mojej lokálnej sieti?"
  },
  "faq": {
    "heading": "Dôležité otázky, zodpovedané.",
    "items": [
      [
        "Funguje NEXUS výhradne v mojej lokálnej sieti?",
        "Áno. NEXUS je postavený na prísnej lokálnej architektúre typu „local-first“. Vaše zariadenia, miestnosti, scény a telemetria senzorov sa spracovávajú priamo na vašom domácom hardvéri. Dokonca aj počas výpadkov internetu všetka lokálna kontrola, osvetlenie a automatizácie pokračujú bez problémov s nulovou latenciou. Prihlásenie sa bezpečne synchronizuje s vašimi nastaveniami na všetkých obrazovkách."
      ],
      [
        "Musím nainštalovať NEXUS, alebo funguje v prehliadači?",
        "Nainštalujte desktopový program (Windows alebo Linux) alebo aplikáciu pre Android. NEXUS nie je ponúkaný ako prehliadačová aplikácia. Príkazy zariadení sa posielajú cez vašu lokálnu sieť. Shelly, Philips Hue, ESPHome, Tasmota, WLED a Home Assistant používajú lokálne HTTP v desktopovom programe a na Androide. TP-Link Kasa a Yeelight potrebujú surové TCP, takže fungujú v desktopovom programe. Táto stránka slúži na účet, stiahnutia a fakturáciu."
      ],
      [
        "Čo pridáva plán NEXUS+?",
        "Základné ovládanie inteligentnej domácnosti—neobmedzené zariadenia, miestnosti, offline automatizácie a lokálne nástenky—je zadarmo. NEXUS+ zahŕňa všetko, čo je vo verzii Free, NEXUS AI pre scény a otázky v bežnom jazyku, 2 000 odpovedí mesačne, pokročilé pripojenia pre pridávanie zariadení Home Assistant a jeden účet na všetkých zariadeniach, s 3-dňovou mesačnou alebo 7-dňovou ročnou skúšobnou verziou. Príkazy zariadení sa stále vykonávajú lokálne. Úlohy v domácnosti sú zahrnuté vo vašej domácnosti bez ďalších nákladov."
      ],
      [
        "Ktorému účtu patrí moje predplatné NEXUS+?",
        "E-mailová adresa použitá pri pokladni. Pred zaplatením sa prihláste na tejto stránke alebo v aplikácii: pokladňa sa potom otvorí s vyplneným e-mailom vášho účtu a predplatné sa zobrazí na každom zariadení, na ktorom sa prihlásite. NEXUS+ sa nedá kúpiť bez účtu. Ak zaplatíte s iným e-mailom, predplatné sa uloží pod týmto e-mailom a na vašom účte sa nezobrazí, kým sa s ním neprihlásite."
      ],
      [
        "Ako fungujú automatizácie a naplánované pravidlá?",
        "Automatizačný engine NEXUS vyhodnocuje vaše harmonogramy a pravidlá senzorov na zariadení, ktoré máte neustále spustené — desktopová aplikácia zostáva v systémovej lište a funguje nonstop, takže osvetlenie, energetické a bezpečnostné rutiny nikdy nečakajú na cloud. Scény a časovače spustené z vášho telefónu sa prejavia okamžite cez vašu LAN. Nové udalosti sa rozšíria do notifikačných kanálov, ktoré povolíte na stránke Okamžité upozornenia: pruh v aplikácii, systémové upozornenia, ntfy, Telegram alebo váš vlastný HTTPS webhook."
      ],
      [
        "Aké zariadenia a ekosystémy sú podporované?",
        "NEXUS komunikuje s každým zariadením prostredníctvom jeho vlastného lokálneho protokolu: Shelly (Gen1 a Gen2+), Tasmota, WLED, ESPHome, Philips Hue a Home Assistant cez lokálny HTTP na každej platforme, plus TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY režim) a Wake-on-LAN cez lokálnu sieť v desktopovej aplikácii, bez potreby účtu alebo kľúča. Všetko ostatné — zariadenia Matter alebo Zigbee — sa pripája cez váš vlastný server Home Assistant, ktorý NEXUS považuje za jeden lokálny hub. Lokálne zisťovanie IP páruje zariadenia okamžite, bez medzičlánku v podobe vendor cloud-u."
      ],
      [
        "Ako sú integrované bezpečnostné kamery a senzory?",
        "NEXUS zjednocuje vaše bezpečnostné kamery, pohybové senzory a senzory vstupu do centralizovaného bezpečnostného panela. Môžete automatizovať režimy súkromia, aktivovať dohľadové rutiny pri odchode z domu a vidieť každý pohyb alebo udalosť kontaktu v aplikácii — plus v notifikačných kanáloch, ktoré povolíte (systémové upozornenia, ntfy, Telegram alebo vlastný webhook)."
      ],
      [
        "Môžem kedykoľvek zrušiť NEXUS+?",
        "Áno, úplne bez problémov a bez akýchkoľvek záväzkov. Môžete zrušiť jediným kliknutím kedykoľvek: z nastavení Účet a Fakturácia v aplikácii, cez našu webovú stránku alebo priamo z odkazu na objednávku v e-maile s účtovným dokladom. Vaše prémiové výhody zostanú aktívne až do konca vášho fakturačného obdobia bez ďalších poplatkov."
      ],
      [
        "Môžem ovládať svoj domov, keď som preč?",
        "Nie cez NEXUS cloud: NEXUS komunikuje s vašimi zariadeniami priamo v domácej sieti a nemá žiadny relé. Ak sa chcete pripojiť zvonku, pripojte svoj telefón alebo laptop do domácej siete cez VPN, ako je Tailscale (subnet router) alebo WireGuard na vašom routeri; NEXUS potom funguje presne tak, ako doma. NEXUS zatiaľ nemá nastavenie adresy hubu, takže VPN musí umožniť prístup k vášmu lokálnemu rozsahu adries a skenovanie nových zariadení funguje iba v domácej sieti. Nikdy neexponujte zariadenie na internet pomocou presmerovania portov. Krok za krokom návod je v docs/REMOTE-ACCESS.md v repozitári."
      ],
      [
        "Existuje verzia pre iPhone?",
        "Neexistuje žiadna aplikácia v App Store, pretože NEXUS nepoužíva platený účet Apple Developer. S Macom a bezplatným Apple ID si ju môžete vytvoriť pre svoj vlastný iPhone (návod: docs/IOS-BUILD.md) a vydanie môže tiež priložiť nepodpísaný súbor IPA, ktorý môže AltStore alebo Sideloadly podpísať za vás; táto cesta ešte nebola overená na skutočnom iPhone. Bezplatné Apple ID vyprší po 7 dňoch a notifikácie, keď je aplikácia zatvorená, na iOS nie sú k dispozícii. Hlavný hub je stále desktopová aplikácia; iPhone je klient."
      ],
      [
        "Môje zariadenie nie je na zozname. Čo môžem robiť?",
        "NEXUS podporuje len zariadenia s dokumentovaným lokálnym protokolom; zariadenia, ktoré fungujú výlučne cez cloud, nie sú podporované, pretože NEXUS nikdy nekomunikuje s cloudom výrobcu. Zoznam kompatibility (docs/COMPATIBILITY.md) zahŕňa aj Sonoff v DIY režime, WiZ, LIFX, Govee (LAN) a Wake-on-LAN. Každé z týchto zariadení má automatizované testy protokolu, ale model sa považuje za overený iba vtedy, keď niekto nahlási, že fungoval na skutočnom zariadení. Napíšte nám prostredníctvom kontaktného formulára na tejto stránke (vyberte „Žiadosť o nové zariadenie / konektor“) alebo e-mailom: uveďte značku a model, čo ste očakávali a čo sa stalo. Informovanie nás, že model fungoval na vašom skutočnom zariadení, je to, čo ho označuje za overený; nikdy nezahrňujte heslá, lokálne kľúče alebo tokeny."
      ],
      [
        "Potrebujem účet? Čo sa stane, ak je server mimo prevádzky?",
        "Áno: prihlásite sa raz pomocou bezplatného e-mailového účtu na otvorenie NEXUSu. Potom ovládanie zariadení a spúšťanie automatizácií prebieha vo vašej vlastnej sieti a pokračuje aj bez internetu. Účet pridáva synchronizáciu medzi vašimi zariadeniami, Rodinou a AI asistentom, ktorí používajú bezplatné cloudové služby s obmedzeniami. Keď niektorá z týchto služieb nie je dostupná, napríklad keď bol bezplatný projekt Supabase pozastavený po približne týždni nečinnosti, cloudové obrazovky zobrazia, že server je nedostupný, namiesto toho, aby ukázali niečo ako uložené; zariadenia, automatizácie a panel dávok pokračujú vo fungovaní. Ak je kvóta alebo služba AI vyčerpaná, asistent povie, že nemohol odpovedať."
      ],
      [
        "Môžem zálohovať svoje nastavenia a preniesť ich na iné zariadenie?",
        "Áno. Nastavenia majú sekciu zálohovania, kde môžete exportovať svoje nastavenia a automatizácie do súboru JSON a importovať ich na inom zariadení alebo po preinštalovaní. Heslá, tokeny a miestne kľúče sú zoznamom spárovaných zariadení v súbore odstránené, takže ich po obnovení znovu zadajte. Zachovajte záložný súbor v súkromí."
      ],
      [
        "Môžem exportovať svoje energetické údaje?",
        "Áno. Stránka Energia môže exportovať najnovšie merania skutočného výkonu z vašich zariadení ako súbor CSV alebo JSON. NEXUS má údaje iba pre zariadenia, ktoré skutočne hlásia výkon; ak nie sú spárované žiadne, nie je čo exportovať."
      ],
      [
        "Prečo ma Windows upozorní, keď spustím inštalátor?",
        "Inštalujte z Microsoft Store a neuvidíte toto varovanie: Microsoft certifikuje tento balík počas overovania a poskytuje aktualizácie cez Store. Priame sťahovanie .exe ešte nie je podpísané obchodným certifikátom, takže SmartScreen môže zobraziť „neznámy vydavateľ“. Súbor si môžete pred jeho spustením porovnať s kontrolnými súčtami uvedenými v sekcii na stiahnutie. Naša politika podpisovania kódu je uvedená v pätičke stránky."
      ]
    ]
  },
  "about": {
    "title": "O NEXUS",
    "lead": "Nezávislá, lokálne orientovaná platforma inteligentnej domácnosti navrhnutá pre rýchlosť, absolútnu ochranu súkromia a skutočné vlastníctvo hardvéru. Tým, že komunikuje priamo s vašimi zariadeniami cez vašu domácu sieť, NEXUS navždy odstraňuje väzbu na cloud.",
    "manifesto": {
      "heading": "Prečo sme vytvorili NEXUS",
      "text": "Moderný priemysel inteligentných domácností sa vybral zlou cestou. Vlastné ekosystémy nútili majiteľov domov k povinným predplatným, zavislej meškania v cloude a invazívnemu sledovaniu telemetrie. Keď internetové pripojenie vypadne, váš vypínač v obývačke by nemal prestať fungovať. NEXUS sme vytvorili preto, že veríme, že váš domov je vaše útočisko: pôdorys, stavy kamier a vaše každodenné rodinné rutiny patria výlučne na váš vlastný hardvér."
    },
    "pillars": [
      {
        "title": "Rýchlosť na lokálnej úrovni",
        "desc": "Každá automatizácia a príkaz sa vykonáva cez vašu lokálnu sieť LAN v milisekundách. Žiadne obchádzky cez vzdialené cloud servery, nulová latencia."
      },
      {
        "title": "Bez kompromisov v oblasti súkromia",
        "desc": "Žiadna analytická telemetria, žiadne profilovanie správania a žiadny predaj vašich súkromných rutín. Účet je povinný; vaše nastavenia sú uložené vo vašom vlastnom zázname účtu s ochranou na úrovni riadku. Príkazy zariadení zostávajú na vašej LAN."
      },
      {
        "title": "Žiadne viazanie na dodávateľa",
        "desc": "Otvorené lokálne protokoly najprv: Shelly, Philips Hue, ESPHome, Tasmota a WLED odpovedajú priamo NEXUS-u, a všetko ostatné sa pripája cez váš vlastný Home Assistant server namiesto cloudového riešenia dodávateľa."
      },
      {
        "title": "Úprimný, udržateľný SaaS",
        "desc": "Základné riadenie inteligentnej domácnosti je úplne zadarmo a neobmedzené navždy. NEXUS+ je plán NEXUS AI a pomáha pokryť používanie cloudu."
      }
    ],
    "architecture": {
      "heading": "Navrhnuté pre spoľahlivosť",
      "lead": "NEXUS udržuje ľahký desktopový engine v systémovej lište, takže plány a pravidlá senzora sa vyhodnocujú, kým je počítač zapnutý, a mobilná aplikácia sa otvorí priamo na rovnakej lokálnej sieti.",
      "items": [
        {
          "icon": "layers",
          "title": "Desktop",
          "desc": "Aplikácie pre Windows, macOS a Linux zostávajú v systémovej lište a udržiavajú lokálne plány a pravidlá senzora spustené, kým je počítač zapnutý. Windows a Linux sa dodávajú ako pripravené inštalátory; macOS sa zostavuje zo zdroja (nepodpisované: kliknite pravým tlačidlom → Otvoriť)."
        },
        {
          "icon": "wifi",
          "title": "Telefón",
          "desc": "Aplikácie pre Android a iOS sa otvárajú na rovnakej lokálnej sieti; príkazy zariadení stále prechádzajú cez vašu LAN sieť. Android sa dodáva ako podpísaný APK; iOS sa zostavuje zo zdroja pomocou Xcode a bezplatného Apple ID."
        },
        {
          "icon": "lock",
          "title": "Účet",
          "desc": "Účet je povinný, aby sa izby, zariadenia a scény zhodovali na každej obrazovke. Príkazy zariadení neopúšťajú vašu domácu sieť."
        }
      ]
    },
    "linksTitle": "Praktické odkazy"
  },
  "footer": {
    "tagline": "Ovládajte celý svoj inteligentný dom priamo cez lokálnu sieť — bez závislosti na predajcovi a bez potreby cloudu. Aj keď internet prestane fungovať, váš dom nikdy neprestane pracovať.",
    "product": "Produkt",
    "productLinks": [
      [
        "Funkcie",
        "#features"
      ],
      [
        "Cenník",
        "#pricing"
      ],
      [
        "Stiahnuť",
        "#downloads"
      ],
      [
        "FAQ",
        "#faq"
      ],
      [
        "O nás",
        "/about"
      ]
    ],
    "account": "Zákaznícka podpora",
    "accountLinks": [
      [
        "Kontakt & Technická podpora",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Poznámky k vydaniu & Komunita",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "Stiahnuť aplikácie",
        "#downloads"
      ]
    ],
    "legal": "Právne",
    "legalLinks": [
      [
        "Súkromie",
        "/privacy"
      ],
      [
        "Podmienky",
        "/terms"
      ],
      [
        "Vrátenie peňazí",
        "/refund"
      ],
      [
        "Podpisovanie kódu",
        "/code-signing"
      ],
      [
        "Prispieť",
        "/contribute"
      ]
    ],
    "rights": "Všetky práva vyhradené.",
    "langSwitchLabel": "Türkçe",
    "langSwitchHref": "/tr/"
  }
};
