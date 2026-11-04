import { RELEASES_URL } from "./site-constants.mjs";

export const et = {
  title: "NEXUS — Sinu nutikodu, mida juhid oma kodivõrgus",
  ogImageAlt: "NEXUS nutikodu ökosüsteem arvutis ja mobiilis",
  description:
    "NEXUS on kohalikku võrku eelistav nutikodu ökosüsteem Windowsile, macOS-ile, Linuxile, Androidile ja iOS-ile. Otsene seadmete juhtimine sinu enda kohtvõrgus, kiired automatiseeringud ja energiatarbimise andmed reaalajas. Alati tasuta; lisaks valikuline NEXUS+ plaan.",
  nav: [
    ["#features", "Funktsioonid"],
    ["#how", "Kuidas see töötab"],
    ["#integrations", "Integratsioonid"],
    ["#pricing", "Hinnad"],
    ["#downloads", "Laadi alla"],
    ["#faq", "KKK"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Kohalikku võrku eelistav nutikodu",
    h1a: "Sinu kodu.",
    h1b: "Vaikselt sinu kontrolli all.",
    lead: "Üks ühtne ökosüsteem sinu valgustusele, kliimale, katetele ja sensoritele — see suhtleb otse seadmetega sinu enda kohtvõrgus. Kiired automatiseeringud, elektritarbimise mõõtmine reaalajas ja juhtimine, mis toimib ka siis, kui internet katkeb.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Uusim versioon",
    shotAlt: "NEXUS-i liides ja juhtimiskeskus",
    trust: [
      "Tasuta, piiramatu arv seadmeid",
      "Juhtimiseks pole pilve vaja",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Võimas taristu. Vaevatu juhtimine.",
    lead: "Iga seadme olek, elektritarbimise näit ja automatiseeritud stseen töötab otse sinu kohtvõrgus, ilma väliste pilvesõltuvusteta.",
    items: [
      [
        "zap",
        "Kiired automatiseeringud",
        "Aja- ja päikeseloojangupõhised stsenaariumid käivituvad otse sinu kohalikus riistvaras — töölaual jätkavad need töötamist usaldusväärselt taustal.",
      ],
      [
        "gauge",
        "Energiatarbimise näidud reaalajas",
        "Loe reaalajas võimsust ja energiatarbimist otse sinu kohtvõrgus olevatest toetatud nutipistikutest ja lülititest.",
      ],
      [
        "wifi",
        "Kohtvõrgu kiirus",
        "Otseside kohtvõrgus HTTP, TCP ja UDP kaudu rubriigis Integratsioonid loetletud kaubamärkidega. Käsutee ei läbi pilve.",
      ],
      [
        "lock",
        "Privaatsus juba disainis",
        "Sinu kodu seadistus ja seadmete telemeetria jäävad sinu enda riistvarasse. NEXUS-i kasutamiseks on vaja kontot; see salvestab sinu seadistuse sinu enda reale reataseme juurdepääsukontrolli all. Seadmete käsud liiguvad endiselt üle sinu kohtvõrgu.",
      ],
      [
        "sparkles",
        "NEXUS AI intelligentsus",
        "Kohalikud nutikodu käsud on kiired ja alati tasuta. Valikuline pilvepõhine tehisintellekti assistent annab tarku soovitusi, kui vajad nõu.",
      ],
      [
        "layers",
        "Avatud kohalikud protokollid",
        "Otsesed liidesed suhtlevad sinu kohtvõrgus. Matter ja Zigbee liituvad sinu enda Home Assistant serveri kaudu — rubriik Integratsioonid näitab, mis on otse ja mis sillatud.",
      ],
    ],
  },
  how: {
    heading: "Allalaadimisest ühenduseni minutitega.",
    steps: [
      [
        "1",
        "Paigalda ja ava",
        "Laadi alla oma platvormi natiivne paigaldaja (Windows, Linux või Android). Seejärel logi sisse — NEXUS-i kasutamiseks on vaja kontot ja see sünkroonib seadistuse ka sinu ekraanide vahel.",
      ],
      [
        "2",
        "Lisa oma seadmed",
        "Vali kaubamärk, skanni kohtvõrku või sisesta IP-aadress. Otsese liidesega kaubamärgid kasutavad oma protokolli — selles teekonnas pole tootja pilve.",
      ],
      [
        "3",
        "Ela oma kodu",
        "Stseenid, ajastatud automatiseeringud ja päris energianäidud — ühtne juhtimine töölaual ja mobiilis.",
      ],
    ],
  },
  integrations: {
    heading: "Töötab sellega, mis sul juba on.",
    lead: "Tasuta kohalikud protokollid esikohal. Kõik, millel pole otsest liidest, töötab ikkagi Home Assistant silla kaudu.",
    groups: [
      [
        "Kohalik HTTP — igal platvormil",
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
        "Kohalik võrk, ilma konto või võtmeta — töölauarakendus",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY-režiim)", "Wake-on-LAN"],
      ],
    ],
    more: "Midagi puudu? Küsi uut liidest",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Tasuta kasutada. NEXUS+, kui tahad rohkem",
    lead: "",
    currencyNote: "Hinnad USA dollarites",
    plans: [
      {
        name: "Tasuta",
        price: "$0",
        period: "alati",
        features: [
          "Piiramatu arv seadmeid ja ruume kõigi toetatud kohalike protokollidega",
          "Null pilvesõltuvust: töötab kohapeal sinu enda kohtvõrgus",
          "30 NEXUS AI käsku ja seadmetoimingut päevas",
          "Ajastatud kohalikud automatiseeringud ja oma stseenid",
          "Mitme seadme kontosünkroonimine (ruumid, seadmed, stseenid)",
          "100% privaatne: ei mingit jälgimist ega andmekogumist",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "kuus",
        badge: "Kõige populaarsem",
        features: [
          "Kõik, mis on Free plaanis, ning lisaks:",
          "2000 NEXUS AI vastust kuus 30 vastuse asemel päevas",
          "Lase NEXUS AI-l stseene seadistada ja vastata lihtsas keeles",
          "Üks konto, mis kehtib igal NEXUS-i seadmel",
          "Tasuta prooviperiood — 3 päeva kuutellimusel, 7 päeva aastatellimusel; tühista perioodi lõpus",
        ],
        cta: {
          label: "Alusta tasuta prooviga",
          monthlyLabel: "Alusta 3-päevast tasuta prooviperioodi",
          yearlyLabel: "Alusta 7-päevast tasuta prooviperioodi",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Pere",
        price: "Tasuta",
        period: "kogu perele",
        badge: "Kogu kodu",
        features: [
          "Leibkonnaliikmed rollipõhise juurdepääsuga — liikmete arv pole piiratud",
          "Omaniku, liikme ja külalise rollid",
          "Liikmepõhised juhtimis-, kutsumis- ja seadete õigused",
          "Stseenid ja automatiseeringud sünkroonitakse sinu enda sisselogitud seadmete vahel",
          "Aktiivne kogu ökosüsteemis (töölaud ja mobiil)",
          "Täiesti tasuta koos sinu koduga",
        ],
        cta: { label: "Alusta Family plaaniga", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Tühista igal ajal rakenduse jaotises Arveldus või oma kontolt sellel saidil. Tühistamine jõustub käimasoleva perioodi lõpus.",
  },
  downloads: {
    heading: "Natiivne igal töölaual. Koduselt tunnete telefonis.",
    lead: "Alati tasuta. Iga paigaldaja tuleb avaldatud SHA-256 kontrollsummaga, et saaksid paigaldatavat kontrollida.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian ja Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · allkirjastatud APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Versioon",
    sizeLabel: "Suurus",
    webCard: {
      title: "Üks konto kogu sinu ökosüsteemis",
      desc: "Windowsi ja Linuxi töölauaprogrammid ning Androidi rakendus. Sisse logituna püsivad sinu ruumid, seadmed, stseenid ja automatiseeringud ekraanide vahel sujuvalt sünkroonis.",
      cta: { label: "Laadi alla NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "Windowsis on lihtsaim tee Microsoft Store: paketi allkirjastab Microsoft ja uuendused tulevad Store'i kaudu. Otse allalaaditav .exe on allkirjastamata, nii et Windows võib hoiatada „tundmatu avaldaja“ kohta — vaata kontrollsummasid.",
  },
  faq: {
    heading: "Olulised küsimused, vastatud.",
    items: [
      [
        "Kas NEXUS töötab täielikult minu kohtvõrgus?",
        "Jah. NEXUS on ehitatud range kohalikku võrku eelistava arhitektuuri peale. Sinu seadmeid, ruume, stseene ja sensorite telemeetriat töödeldakse otse sinu enda kodu riistvaras. Isegi interneti katkemise ajal toimivad kõik kohalikud juhtimisvõimalused, valgustus ja automatiseeringud sujuvalt ja ilma viivituseta. Sisselogimine sünkroonib turvaliselt sinu seaded kõigi sinu ekraanide vahel.",
      ],
      [
        "Kas pean NEXUS-i paigaldama või töötab see brauseris?",
        "Paigalda töölauaprogramm (Windows või Linux) või Androidi rakendus. NEXUS-i brauserirakendusena ei pakuta. Seadmete käsud liiguvad üle sinu enda kohtvõrgu. Shelly, Philips Hue, ESPHome, Tasmota, WLED ja Home Assistant kasutavad kohalikku HTTP-d nii töölauaprogrammis kui ka Androidis. TP-Link Kasa ja Yeelight vajavad toort TCP-d, seega töötavad need töölauaprogrammis. See sait on mõeldud konto, allalaadimiste ja arvelduse jaoks.",
      ],
      [
        "Mida NEXUS+ plaan lisab?",
        "Nutikodu põhijuhtimine — piiramatu arv seadmeid, ruume, võrguühenduseta automatiseeringud ja kohalikud juhtpaneelid — on tasuta. NEXUS+ sisaldab kõike Free plaani omast, NEXUS AI-d stseenide ja küsimuste jaoks lihtsas keeles, 2000 vastust kuus, täiustatud ühendusi Home Assistant seadmete lisamiseks ning ühte kontot igal seadmel, 3-päevase kuu- või 7-päevase aastatellimuse prooviperioodiga. Seadmete käsud töötavad endiselt kohapeal. Leibkonna rollid on sinu koduga kaasas lisatasuta.",
      ],
      [
        "Millisele kontole minu NEXUS+ tellimus kuulub?",
        "E-posti aadressile, mida kasutasid kassas. Logi enne maksmist sellel saidil või rakenduses sisse: siis avaneb kassa sinu konto e-posti aadressiga eeltäidetuna ja tellimus kuvatakse igal seadmel, kuhu sisse logid. NEXUS+ ei saa osta ilma kontota. Kui maksad mõne muu e-posti aadressiga, salvestatakse tellimus selle aadressi alla ega ilmu sinu kontole enne, kui logid sisse selle aadressiga.",
      ],
      [
        "Kuidas automatiseeringud ja ajastatud reeglid töötavad?",
        "NEXUS-i automatiseerimismootor hindab sinu ajakavasid ja sensorireegleid seadmes, mida hoiad töös — töölauarakendus jääb süsteemisalve ja töötab ööpäevaringselt, nii et valgustuse, energia ja turvalisuse rutiinid ei oota kunagi pilve. Telefonist käivitatud stseenid ja taimerid rakenduvad kohe üle sinu kohtvõrgu. Uued sündmused jõuavad teavituskanalitesse, mille lubad lehel Kohesed teavitused: rakendusesisene riba, süsteemiteavitused, ntfy, Telegram või sinu enda HTTPS-veebikonks.",
      ],
      [
        "Milliseid seadmeid ja ökosüsteeme toetatakse?",
        "NEXUS räägib iga seadme enda kohalikku protokolli: Shelly (Gen1 ja Gen2+), Tasmota, WLED, ESPHome, Philips Hue ja Home Assistant kohaliku HTTP kaudu igal platvormil, lisaks TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY mode) ja Wake-on-LAN kohalikus võrgus töölauarakenduses, ilma konto või võtmeta. Kõik muu — Matter- või Zigbee-seadmed — liitub sinu enda Home Assistant serveri kaudu, mida NEXUS käsitleb ühe kohaliku sõlmena. Kohalik IP-avastus seob seadmed kohe, ilma tootja pilveta vahel.",
      ],
      [
        "Kuidas turvakaamerad ja sensorid integreeritakse?",
        "NEXUS koondab sinu turvakaamerad, liikumisandurid ja sissepääsusensorid ühte keskset turvapaneeli. Saad automatiseerida privaatsusrežiime, aktiveerida valverutiine kodust lahkudes ning näha igat liikumis- või kontaktisündmust rakenduses — ja ka sinu lubatud teavituskanalites (süsteemiteavitused, ntfy, Telegram või sinu enda veebikonks).",
      ],
      [
        "Kas saan NEXUS+ igal ajal tühistada?",
        "Jah, täiesti vaevata ja ilma kohustusteta. Saad tühistada ühe klõpsuga igal ajal: rakenduse jaotises Konto ja arveldus, meie veebisaidil või otse arveldusmeili kviitungi tellimuse lingilt. Sinu premium-eelised jäävad aktiivseks arveldusperioodi lõpuni ja edasisi tasusid ei tule.",
      ],
      [
        "Kas saan oma kodu juhtida, kui olen eemal?",
        "Mitte NEXUS-i pilve kaudu: NEXUS suhtleb sinu seadmetega otse sinu kodu võrgus ja releed pole. Väljastpoolt ligipääsuks ühenda oma telefon või sülearvuti koduvõrku VPN-iga, näiteks Tailscale (alamvõrgu ruuter) või WireGuard sinu ruuteris; seejärel töötab NEXUS täpselt nagu kodus. NEXUS-il pole veel sõlme aadressi seadet, seega peab VPN muutma sinu kohaliku aadressivahemiku ligipääsetavaks ning uute seadmete skannimine töötab ainult koduvõrgus. Ära kunagi tee seadet portide edastamisega internetis kättesaadavaks. Samm-sammuline juhend on repositooriumis failis docs/REMOTE-ACCESS.md.",
      ],
      [
        "Kas on olemas iPhone'i versioon?",
        "App Store'i rakendust pole, sest NEXUS ei kasuta tasulist Apple Developeri kontot. Macis ja tasuta Apple ID-ga saad selle oma iPhone'ile ise ehitada (juhend: docs/IOS-BUILD.md) ning väljalaskega võib kaasas olla ka allkirjastamata IPA, mille AltStore või Sideloadly sulle allkirjastada saab; seda teed pole päris iPhone'il veel kontrollitud. Tasuta Apple ID korral aegub rakendus 7 päeva pärast ning iOS-is pole teavitused saadaval, kui rakendus on suletud. Kodu sõlm on endiselt töölauarakendus; iPhone on klient.",
      ],
      [
        "Minu seadet pole nimekirjas. Mida teha?",
        "NEXUS toetab ainult seadmeid dokumenteeritud kohaliku protokolliga; ainult pilvega seadmeid ei toetata, sest NEXUS ei suhtle kunagi tootja pilvega. Ühilduvusnimekiri (docs/COMPATIBILITY.md) sisaldab ka Sonoff DIY-režiimis, WiZ, LIFX, Govee (LAN) ja Wake-on-LAN. Igaühel neist on automatiseeritud protokollitestid, kuid mudel loetakse kontrollituks alles siis, kui keegi teatab, et see töötas päris seadmel. Kirjuta meile selle saidi kontaktivormi kaudu (vali „New Device / Connector Request“) või e-kirjaga: kaubamärk ja mudel, mida ootasid ja mis juhtus. Teade, et mudel töötas sinu päris seadmel, märgib selle kontrollituks; ära lisa kunagi paroole, kohalikke võtmeid ega tunnuseid.",
      ],
      [
        "Kas mul on kontot vaja? Mis juhtub, kui server on maas?",
        "Jah: NEXUS-i avamiseks logid korra sisse tasuta e-posti kontoga. Pärast seda toimub seadmete juhtimine ja automatiseeringute käitamine sinu enda võrgus ning töötab edasi ka ilma internetita. Konto lisab sünkroonimise seadmete vahel, Family plaani ja tehisintellekti assistendi, mis kasutavad piiranguga tasuta pilveteenuseid. Kui mõni neist pole saadaval, näiteks kui tasuta Supabase'i projekt on umbes nädala tegevusetuse järel peatatud, ütlevad pilveekraanid, et server pole kättesaadav, selle asemel et midagi salvestatuna näidata; seadmed, automatiseeringud ja süsteemisalv töötavad edasi. Kui AI kvoot või teenus on ammendatud, ütleb assistent, et ei saanud vastata.",
      ],
      [
        "Kas saan oma seaded varundada ja teise seadmesse tõsta?",
        "Jah. Seadetes on varunduse jaotis, kus saad oma seaded ja automatiseeringud JSON-faili eksportida ning teisel seadmel või uuesti paigaldamise järel importida. Paroolid, tunnused ja kohalikud võtmed eemaldatakse failis seotud seadmete loendist, seega sisesta need pärast taastamist uuesti. Hoia varundusfail privaatsena.",
      ],
      [
        "Kas saan oma energiaandmeid eksportida?",
        "Jah. Energialeht saab eksportida sinu seadmete viimased päris võimsusnäidud CSV- või JSON-failina. NEXUS-il on andmeid ainult seadmete kohta, mis tegelikult võimsust teatavad; kui ühtegi pole seotud, pole midagi eksportida.",
      ],
      [
        "Miks Windows paigaldaja käivitamisel hoiatab?",
        "Paigalda Microsoft Store'ist ja seda hoiatust sa ei näe: Microsoft allkirjastab selle paketi sertifitseerimisel ja toimetab uuendused Store'i kaudu. Otse allalaaditav .exe pole veel kommertssertifikaadiga allkirjastatud, seega võib SmartScreen näidata „tundmatu avaldaja“. Enne käivitamist saad faili võrrelda allalaadimiste jaotises loetletud kontrollsummadega. Meie koodiallkirjastamise poliitika link on saidi jaluses.",
      ],
    ],
  },
  about: {
    title: "NEXUS-ist",
    lead: "Sõltumatu, kohalikku võrku eelistav nutikodu platvorm, mis on loodud kiiruse, täieliku privaatsuse ja tõelise riistvaraomandi jaoks. Suheldes seadmetega otse sinu enda koduvõrgus, kaotab NEXUS pilvesõltuvuse igaveseks.",
    manifesto: {
      heading: "Miks me NEXUS-i ehitasime",
      text: "Tänapäeva nutikodutööstus keeras valele teele. Suletud ökosüsteemid sundisid koduomanikke kohustuslikesse tellimustesse, pilvest sõltuvasse viivitusse ja pealetükkivasse telemeetria jälgimisse. Kui sinu internetiühendus katkeb, ei tohiks sinu elutoa lüliti töötamist lõpetada. Ehitasime NEXUS-i, sest usume, et sinu kodu on sinu pelgupaik: sinu põrandaplaan, kaamerate olekud ja pere igapäevased rutiinid kuuluvad rangelt sinu enda riistvarasse.",
    },
    pillars: [
      {
        title: "Kohalik kiirus",
        desc: "Iga automatiseering ja käsk täidetakse sinu kohtvõrgus millisekundites. Ei mingeid ringkäike kaugete pilveserveriteni, null viivitust.",
      },
      {
        title: "Kompromissitu privaatsus",
        desc: "Ei mingit analüütilist telemeetriat, käitumisprofiilide koostamist ega sinu privaatsete rutiinide müüki. Konto on nõutav; sinu seadistus salvestatakse sinu enda reataseme kaitsega konto reale. Seadmete käsud jäävad endiselt sinu kohtvõrku.",
      },
      {
        title: "Ei mingit tootjasõltuvust",
        desc: "Avatud kohalikud protokollid esikohal: Shelly, Philips Hue, ESPHome, Tasmota ja WLED vastavad NEXUS-ile otse ning kõik muu liitub sinu enda Home Assistant serveri kaudu tootja pilve asemel.",
      },
      {
        title: "Aus ja jätkusuutlik SaaS",
        desc: "Nutikodu põhihaldus on täiesti tasuta ja piiramatu igavesti. NEXUS+ on NEXUS AI plaan ja aitab katta selle pilvekasutuse.",
      },
    ],
    architecture: {
      heading: "Loodud töökindluseks",
      lead: "NEXUS hoiab sinu süsteemisalves kerget töölauamootorit, et ajakavasid ja sensorireegleid hinnataks seni, kuni arvuti on sisse lülitatud, ning mobiilirakendus avaneb otse samas kohtvõrgus.",
      items: [
        {
          icon: "layers",
          title: "Töölaud",
          desc: "Windowsi, macOS-i ja Linuxi rakendused jäävad süsteemisalve ning hoiavad kohalikke ajakavasid ja sensorireegleid töös, kuni arvuti on sisse lülitatud. Windows ja Linux tulevad valmis paigaldajatena; macOS ehitatakse lähtekoodist (allkirjastamata: paremklõps → Open).",
        },
        {
          icon: "wifi",
          title: "Telefon",
          desc: "Androidi ja iOS-i rakendused avanevad samas kohtvõrgus; seadmete käsud liiguvad endiselt üle sinu kohtvõrgu. Android tuleb allkirjastatud APK-na; iOS ehitatakse lähtekoodist Xcode'i ja tasuta Apple ID-ga.",
        },
        {
          icon: "lock",
          title: "Konto",
          desc: "Konto on vajalik, et ruumid, seadmed ja stseenid ühtiksid igal ekraanil. Seadmete käsud ei lahku sinu koduvõrgust.",
        },
      ],
    },
    linksTitle: "Kasulikud lingid",
  },
  footer: {
    tagline:
      "Juhi kogu oma nutikodu otse oma kohtvõrgus — ilma tootjasõltuvuseta ja pilveta. Isegi kui internet katkeb, ei lõpeta su kodu töötamist.",
    product: "Toode",
    productLinks: [
      ["Funktsioonid", "#features"],
      ["Hinnad", "#pricing"],
      ["Laadi alla", "#downloads"],
      ["KKK", "#faq"],
      ["Teave", "/about"],
    ],
    account: "Kliendid ja tugi",
    accountLinks: [
      ["Kontakt ja tehniline tugi", "javascript:nxOpenContactModal('Technical Support')"],
      ["Väljalaskemärkmed ja kogukond", RELEASES_URL],
      ["Laadi rakendused alla", "#downloads"],
    ],
    legal: "Õiguslik teave",
    legalLinks: [
      ["Privaatsus", "/privacy"],
      ["Tingimused", "/terms"],
      ["Tagasimaksed", "/refund"],
      ["Koodi allkirjastamine", "/code-signing"],
      ["Panusta", "/contribute"],
    ],
    rights: "Kõik õigused kaitstud.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
