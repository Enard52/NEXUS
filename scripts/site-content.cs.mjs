import { RELEASES_URL } from "./site-constants.mjs";

export const cs = {
  title: "NEXUS — Váš chytrý domov, spravovaný ve vaší vlastní síti",
  ogImageAlt: "Ekosystém chytré domácnosti NEXUS na počítači a v mobilu",
  description:
    "NEXUS je ekosystém chytré domácnosti s principem „nejdřív lokálně“ pro Windows, macOS, Linux, Android a iOS. Přímé ovládání zařízení přes vaši vlastní místní síť, pohotové automatizace a měření spotřeby energie v reálném čase. Navždy zdarma; volitelný plán NEXUS+.",
  nav: [
    ["#features", "Funkce"],
    ["#how", "Jak to funguje"],
    ["#integrations", "Integrace"],
    ["#pricing", "Ceník"],
    ["#downloads", "Stažení"],
    ["#faq", "Časté dotazy"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Chytrá domácnost nejdřív lokálně",
    h1a: "Váš domov.",
    h1b: "Nenápadně pod vaší kontrolou.",
    lead: "Jeden jednotný ekosystém pro světla, klimatizaci, rolety a senzory, který komunikuje přímo se zařízeními ve vaší místní síti. Pohotové automatizace, měření spotřeby v reálném čase a ovládání, které funguje i při výpadku internetu.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Nejnovější verze",
    shotAlt: "Rozhraní a ovládací centrum NEXUS",
    trust: [
      "Zdarma, neomezený počet zařízení",
      "Ovládání nevyžaduje cloud",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Výkonná infrastruktura. Snadné ovládání.",
    lead: "Každý stav zařízení, údaj o spotřebě i automatizovaná scéna běží přímo ve vaší místní síti, bez závislosti na externím cloudu.",
    items: [
      [
        "zap",
        "Pohotové automatizace",
        "Scénáře spouštěné časem nebo západem slunce se provádějí přímo na vašem lokálním hardwaru a na počítači spolehlivě běží na pozadí.",
      ],
      [
        "gauge",
        "Údaje o energii živě",
        "Čtěte okamžitý příkon a spotřebu přímo z podporovaných chytrých zásuvek a spínačů ve své místní síti.",
      ],
      [
        "wifi",
        "Rychlost místní sítě",
        "Přímá komunikace po LAN přes HTTP, TCP a UDP se značkami uvedenými v části Integrace. Žádný skok přes cloud na cestě příkazů.",
      ],
      [
        "lock",
        "Soukromí už od návrhu",
        "Konfigurace vašeho domova a telemetrie zařízení zůstávají na vašem lokálním hardwaru. K používání NEXUS je potřeba účet; vaše nastavení v něm ukládá do vašeho vlastního řádku pod řízením přístupu na úrovni řádků. Příkazy zařízením stále putují po vaší LAN.",
      ],
      [
        "sparkles",
        "Inteligence NEXUS AI",
        "Lokální příkazy chytré domácnosti jsou okamžité a navždy zdarma. Volitelný cloudový asistent s umělou inteligencí nabízí chytré návrhy, kdykoli potřebujete poradit.",
      ],
      [
        "layers",
        "Otevřené lokální protokoly",
        "Přímé konektory komunikují po vaší LAN. Matter a Zigbee se připojují přes váš vlastní server Home Assistant — část Integrace uvádí, co je přímé a co jde přes most.",
      ],
    ],
  },
  how: {
    heading: "Od stažení k připojení za pár minut.",
    steps: [
      [
        "1",
        "Nainstalujte a otevřete",
        "Stáhněte si nativní instalátor pro svou platformu (Windows, Linux nebo Android). Poté se přihlaste — k používání NEXUS je potřeba účet, který zároveň synchronizuje nastavení mezi vašimi obrazovkami.",
      ],
      [
        "2",
        "Přidejte svá zařízení",
        "Vyberte značku, prohledejte místní síť nebo zadejte IP adresu. Značky s přímým konektorem mluví svým vlastním protokolem — bez cloudu výrobce na této cestě.",
      ],
      [
        "3",
        "Žijte svůj domov",
        "Scény, plánované automatizace a skutečné údaje o spotřebě energie — jednotné ovládání na počítači i v mobilu.",
      ],
    ],
  },
  integrations: {
    heading: "Funguje s tím, co už máte.",
    lead: "Nejdřív bezplatné lokální protokoly. Cokoli bez přímého konektoru stále funguje přes most Home Assistant.",
    groups: [
      [
        "Místní HTTP — na každé platformě",
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
        "Místní síť, bez účtu a klíče — desktopová aplikace",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (režim DIY)", "Wake-on-LAN"],
      ],
    ],
    more: "Něco chybí? Požádejte o konektor",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Zdarma k použití. NEXUS+, když chcete víc",
    lead: "",
    currencyNote: "Ceny v USD",
    plans: [
      {
        name: "Free",
        price: "$0",
        period: "navždy",
        features: [
          "Neomezený počet zařízení a místností napříč všemi podporovanými lokálními protokoly",
          "Žádná závislost na cloudu: běží lokálně ve vaší vlastní LAN",
          "30 denních příkazů a akcí zařízení s NEXUS AI",
          "Plánované lokální automatizace a vlastní scény",
          "Synchronizace účtu mezi zařízeními (místnosti, zařízení, scény)",
          "100% soukromí: žádné sledování ani sbírání dat",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "měsíčně",
        badge: "Nejoblíbenější",
        features: [
          "Vše z úrovně Free a navíc:",
          "2 000 odpovědí NEXUS AI měsíčně místo 30 denně",
          "Požádejte NEXUS AI o nastavení scén a odpovědi běžným jazykem",
          "Jeden účet platný na každém zařízení NEXUS",
          "Zkušební doba zdarma — 3 dny u měsíčního, 7 dní u ročního plánu; zrušení ke konci období",
        ],
        cta: {
          label: "Začněte zkušební dobu zdarma",
          monthlyLabel: "Začít 3denní zkušební dobu zdarma",
          yearlyLabel: "Začít 7denní zkušební dobu zdarma",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Family",
        price: "Free",
        period: "pro celou rodinu",
        badge: "Celý domov",
        features: [
          "Členové domácnosti s přístupem podle rolí — bez omezení počtu členů",
          "Role vlastníka, člena a hosta",
          "Oprávnění k ovládání, pozvánkám a nastavení pro každého člena",
          "Scény a automatizace se synchronizují mezi vašimi vlastními přihlášenými zařízeními",
          "Aktivní v celém ekosystému (počítač i mobil)",
          "Zcela zdarma k vašemu domovu",
        ],
        cta: { label: "Začněte s Family", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Zrušit můžete kdykoli v části Fakturace v aplikaci nebo ve svém účtu na tomto webu. Zrušení nabývá účinnosti na konci aktuálního období.",
  },
  downloads: {
    heading: "Nativně na každém počítači. Jako doma v mobilu.",
    lead: "Vždy zdarma. Každý instalátor má zveřejněný kontrolní součet SHA-256, takže si můžete ověřit, co instalujete.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64bitový", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian a Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · podepsané APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Verze",
    sizeLabel: "Velikost",
    webCard: {
      title: "Jeden účet pro celý váš ekosystém",
      desc: "Desktopové programy pro Windows a Linux a aplikace pro Android. Po přihlášení zůstávají vaše místnosti, zařízení, scény a automatizace plynule synchronizované mezi vašimi obrazovkami.",
      cta: { label: "Stáhnout NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "Ve Windows je nejsnazší cesta přes Microsoft Store: balíček je podepsán společností Microsoft a aktualizace chodí přes Store. Přímé .exe není podepsané, proto může Windows varovat před „neznámým vydavatelem“ — viz kontrolní součty.",
  },
  faq: {
    heading: "Důležité otázky, jasné odpovědi.",
    items: [
      [
        "Funguje NEXUS celý v mé místní síti?",
        "Ano. NEXUS je postaven na přísné architektuře „nejdřív lokálně“. Vaše zařízení, místnosti, scény a telemetrie senzorů se zpracovávají přímo na hardwaru ve vaší domácnosti. I při výpadku internetu všechna lokální ovládání, osvětlení a automatizace dál fungují bez problémů a s nulovou latencí. Přihlášení bezpečně synchronizuje vaše nastavení mezi všemi vašimi obrazovkami.",
      ],
      [
        "Musím NEXUS instalovat, nebo běží v prohlížeči?",
        "Nainstalujte desktopový program (Windows nebo Linux) nebo aplikaci pro Android. NEXUS se nenabízí jako aplikace v prohlížeči. Příkazy zařízením putují vaší vlastní místní sítí. Shelly, Philips Hue, ESPHome, Tasmota, WLED a Home Assistant používají místní HTTP v desktopovém programu i v Androidu. TP-Link Kasa a Yeelight potřebují čisté TCP, proto běží v desktopovém programu. Tento web slouží pro účet, stahování a fakturaci.",
      ],
      [
        "Co přináší plán NEXUS+?",
        "Základní ovládání chytré domácnosti — neomezený počet zařízení, místností, offline automatizace a lokální přehledy — je zdarma. NEXUS+ zahrnuje vše z Free, NEXUS AI pro scény a otázky běžným jazykem, 2 000 odpovědí měsíčně, pokročilá připojení pro přidávání zařízení z Home Assistant a jeden účet na každém zařízení, se zkušební dobou 3 dny u měsíčního nebo 7 dní u ročního plánu. Příkazy zařízením se stále provádějí lokálně. Role v domácnosti jsou součástí vašeho domova bez příplatku.",
      ],
      [
        "Ke kterému účtu patří moje předplatné NEXUS+?",
        "K e-mailové adrese použité při platbě. Před platbou se přihlaste na tomto webu nebo v aplikaci: platba se pak otevře s předvyplněným e-mailem vašeho účtu a předplatné se zobrazí na každém zařízení, na kterém se přihlásíte. NEXUS+ nelze koupit bez účtu. Pokud zaplatíte jiným e-mailem, předplatné se uloží pod tímto e-mailem a ve vašem účtu se neobjeví, dokud se pod ním nepřihlásíte.",
      ],
      [
        "Jak běží automatizace a plánovaná pravidla?",
        "Automatizační modul NEXUS vyhodnocuje vaše plány a pravidla senzorů na zařízení, které necháte běžet — desktopová aplikace zůstává v oznamovací oblasti a běží nepřetržitě, takže rutiny osvětlení, energie a zabezpečení nikdy nečekají na cloud. Scény a časovače spuštěné z telefonu se uplatní okamžitě přes vaši LAN. Nové události se rozesílají do oznamovacích kanálů, které zapnete na stránce Okamžitá oznámení: lišta v aplikaci, systémová oznámení, ntfy, Telegram nebo váš vlastní webhook HTTPS.",
      ],
      [
        "Která zařízení a ekosystémy jsou podporovány?",
        "NEXUS mluví vlastním lokálním protokolem každého zařízení: Shelly (Gen1 a Gen2+), Tasmota, WLED, ESPHome, Philips Hue a Home Assistant přes místní HTTP na každé platformě, dále TP-Link Kasa, Yeelight, WiZ, Sonoff (režim DIY) a Wake-on-LAN přes místní síť v desktopové aplikaci, bez účtu a klíče. Vše ostatní — zařízení Matter nebo Zigbee — se připojuje přes váš vlastní server Home Assistant, který NEXUS bere jako jediné lokální centrum. Objevování přes místní IP spáruje zařízení okamžitě, bez cloudu výrobce uprostřed.",
      ],
      [
        "Jak se integrují bezpečnostní kamery a senzory?",
        "NEXUS shromažďuje vaše bezpečnostní kamery, detektory pohybu a vstupní senzory do centrálního bezpečnostního panelu. Můžete automatizovat režimy soukromí, aktivovat dohledové rutiny při odchodu z domova a vidět každý pohyb či kontaktní událost v aplikaci — a také v oznamovacích kanálech, které zapnete (systémová oznámení, ntfy, Telegram nebo váš vlastní webhook).",
      ],
      [
        "Mohu NEXUS+ kdykoli zrušit?",
        "Ano, zcela bez potíží a bez závazků. Zrušit můžete jedním kliknutím kdykoli: v nastavení Účet a fakturace v aplikaci, přes náš web nebo přímo z odkazu na objednávku v e-mailové účtence. Prémiové výhody zůstávají aktivní do konce fakturačního cyklu a žádné další platby už se nestrhávají.",
      ],
      [
        "Mohu ovládat domov, když jsem pryč?",
        "Ne přes cloud NEXUS: NEXUS komunikuje se zařízeními přímo ve vaší domácí síti a nemá žádný přenosový server. Chcete-li se k němu dostat zvenčí, připojte telefon nebo notebook do domácí sítě přes VPN, například Tailscale (subnet router) nebo WireGuard na routeru; NEXUS pak funguje přesně jako doma. NEXUS zatím nemá nastavení adresy centra, takže VPN musí zpřístupnit váš místní rozsah adres, a vyhledávání nových zařízení funguje jen v domácí síti. Nikdy nevystavujte zařízení do internetu přesměrováním portů. Podrobný návod je docs/REMOTE-ACCESS.md v repozitáři.",
      ],
      [
        "Existuje verze pro iPhone?",
        "Aplikace v App Store neexistuje, protože NEXUS nepoužívá placený účet Apple Developer. S Macem a bezplatným Apple ID si ji můžete sestavit pro vlastní iPhone (návod: docs/IOS-BUILD.md) a vydání může obsahovat i nepodepsaný IPA, který za vás podepíše AltStore nebo Sideloadly; tato cesta zatím nebyla ověřena na skutečném iPhonu. Aplikace s bezplatným Apple ID vyprší po 7 dnech a oznámení při zavřené aplikaci na iOS nejsou k dispozici. Domácím centrem zůstává desktopová aplikace; iPhone je klient.",
      ],
      [
        "Moje zařízení není na seznamu. Co mohu dělat?",
        "NEXUS podporuje jen zařízení s zdokumentovaným lokálním protokolem; zařízení pouze s cloudem podporována nejsou, protože NEXUS nikdy nekomunikuje s cloudem výrobce. Seznam kompatibility (docs/COMPATIBILITY.md) zahrnuje také Sonoff v režimu DIY, WiZ, LIFX, Govee (LAN) a Wake-on-LAN. Každý z nich má automatizované testy protokolu, ale model se považuje za ověřený, jen když někdo nahlásí, že fungoval na skutečném zařízení. Napište nám přes kontaktní formulář na tomto webu (vyberte „New Device / Connector Request“) nebo e-mailem: značku a model, co jste očekávali a co se stalo. Právě vaše zpráva, že model fungoval na vašem skutečném zařízení, jej označí za ověřený; nikdy neuvádějte hesla, lokální klíče ani tokeny.",
      ],
      [
        "Potřebuji účet? Co když server nefunguje?",
        "Ano: k otevření NEXUS se jednou přihlásíte bezplatným e-mailovým účtem. Poté se ovládání zařízení a běh automatizací odehrávají ve vaší vlastní síti a fungují i bez internetu. Účet přidává synchronizaci mezi zařízeními, Family a asistenta s umělou inteligencí, které využívají bezplatné cloudové služby s limity. Když je některá z nich nedostupná, například když se bezplatný projekt Supabase po zhruba týdnu bez aktivity pozastaví, cloudové obrazovky řeknou, že server je nedostupný, místo aby cokoli ukázaly jako uložené; zařízení, automatizace a oznamovací oblast dál fungují. Pokud je vyčerpán limit nebo služba AI, asistent oznámí, že nemohl odpovědět.",
      ],
      [
        "Mohu zálohovat nastavení a přenést je na jiné zařízení?",
        "Ano. Nastavení obsahuje část pro zálohování, kde můžete exportovat nastavení a automatizace do souboru JSON a naimportovat je na jiném zařízení nebo po přeinstalaci. Hesla, tokeny a lokální klíče se ze seznamu spárovaných zařízení v souboru odstraní, takže je po obnovení zadejte znovu. Soubor zálohy uchovávejte v soukromí.",
      ],
      [
        "Mohu exportovat data o energii?",
        "Ano. Stránka Energie umí exportovat nejnovější skutečné údaje o příkonu z vašich zařízení do souboru CSV nebo JSON. NEXUS má data jen o zařízeních, která příkon skutečně hlásí; pokud nemáte spárované žádné, není co exportovat.",
      ],
      [
        "Proč mě Windows při spuštění instalátoru varuje?",
        "Nainstalujte z Microsoft Store a toto varování neuvidíte: Microsoft tento balíček podepisuje při certifikaci a aktualizace doručuje přes Store. Přímé stažení .exe zatím není podepsáno komerčním certifikátem, takže SmartScreen může zobrazit „neznámý vydavatel“. Před spuštěním můžete soubor porovnat s kontrolními součty uvedenými v části Stažení. Naše zásady podepisování kódu jsou odkazovány v patičce webu.",
      ],
    ],
  },
  about: {
    title: "O NEXUS",
    lead: "Nezávislá chytrá domácnost s principem „nejdřív lokálně“, navržená pro rychlost, absolutní soukromí a skutečné vlastnictví hardwaru. Tím, že mluví přímo s vašimi zařízeními přes vaši domácí síť, NEXUS navždy odstraňuje závislost na cloudu.",
    manifesto: {
      heading: "Proč jsme vytvořili NEXUS",
      text: "Moderní odvětví chytrých domácností zvolilo špatnou cestu. Uzavřené ekosystémy nutily majitele domů k povinným předplatným, zpožděním závislým na cloudu a invazivnímu sledování telemetrie. Když vám vypadne internet, vypínač v obýváku by neměl přestat fungovat. NEXUS jsme vytvořili, protože věříme, že váš domov je vaše útočiště: půdorys vašeho bytu, stavy vašich kamer i každodenní rutiny vaší rodiny patří výhradně na váš vlastní hardware.",
    },
    pillars: [
      {
        title: "Rychlost nejdřív lokálně",
        desc: "Každá automatizace a každý příkaz se provádí přes vaši místní LAN během milisekund. Žádné cesty na vzdálené cloudové servery, nulová latence.",
      },
      {
        title: "Soukromí bez kompromisů",
        desc: "Žádná analytická telemetrie, žádné profilování chování a žádný prodej vašich soukromých rutin. Účet je vyžadován; vaše nastavení je uloženo ve vašem vlastním řádku účtu chráněném na úrovni řádků. Příkazy zařízením stále zůstávají ve vaší LAN.",
      },
      {
        title: "Bez závislosti na výrobci",
        desc: "Nejdřív otevřené lokální protokoly: Shelly, Philips Hue, ESPHome, Tasmota a WLED odpovídají NEXUS přímo a vše ostatní se připojuje přes váš vlastní server Home Assistant místo cloudu výrobce.",
      },
      {
        title: "Poctivý a udržitelný SaaS",
        desc: "Základní správa chytré domácnosti je navždy zcela zdarma a bez omezení. NEXUS+ je plán NEXUS AI a pomáhá pokrýt toto využití cloudu.",
      },
    ],
    architecture: {
      heading: "Navrženo pro spolehlivost",
      lead: "NEXUS drží lehký desktopový modul v oznamovací oblasti, aby se plány a pravidla senzorů vyhodnocovaly, dokud je počítač zapnutý, a mobilní aplikace se otevírá přímo nad stejnou místní sítí.",
      items: [
        {
          icon: "layers",
          title: "Počítač",
          desc: "Aplikace pro Windows, macOS a Linux zůstávají v oznamovací oblasti a udržují lokální plány a pravidla senzorů v chodu, dokud je počítač zapnutý. Windows a Linux se dodávají jako hotové instalátory; macOS se sestavuje ze zdrojového kódu (nepodepsané: pravé tlačítko → Otevřít).",
        },
        {
          icon: "wifi",
          title: "Telefon",
          desc: "Aplikace pro Android a iOS se otevírají nad stejnou místní sítí; příkazy zařízením stále putují přes vaši LAN. Android se dodává jako podepsané APK; iOS se sestavuje ze zdrojového kódu pomocí Xcode a bezplatného Apple ID.",
        },
        {
          icon: "lock",
          title: "Účet",
          desc: "Účet je potřeba, aby místnosti, zařízení a scény odpovídaly na každé obrazovce. Příkazy zařízením neopouštějí vaši domácí síť.",
        },
      ],
    },
    linksTitle: "Užitečné odkazy",
  },
  footer: {
    tagline:
      "Ovládejte celou chytrou domácnost přímo přes místní síť — bez závislosti na výrobci a bez cloudu. I když vypadne internet, váš domov se nezastaví.",
    product: "Produkt",
    productLinks: [
      ["Funkce", "#features"],
      ["Ceník", "#pricing"],
      ["Stažení", "#downloads"],
      ["Časté dotazy", "#faq"],
      ["O nás", "/about"],
    ],
    account: "Zákazníci a podpora",
    accountLinks: [
      ["Kontakt a technická podpora", "javascript:nxOpenContactModal('Technical Support')"],
      ["Poznámky k vydání a komunita", RELEASES_URL],
      ["Stáhnout aplikace", "#downloads"],
    ],
    legal: "Právní informace",
    legalLinks: [
      ["Soukromí", "/privacy"],
      ["Podmínky", "/terms"],
      ["Vrácení peněz", "/refund"],
      ["Podepisování kódu", "/code-signing"],
      ["Přispějte", "/contribute"],
    ],
    rights: "Všechna práva vyhrazena.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
