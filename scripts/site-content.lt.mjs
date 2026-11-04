import { RELEASES_URL } from "./site-constants.mjs";

export const lt = {
  title: "NEXUS — jūsų išmanieji namai, valdomi jūsų pačių tinkle",
  ogImageAlt: "NEXUS išmaniųjų namų ekosistema kompiuteryje ir telefone",
  description:
    "NEXUS yra vietinio tinklo principu veikianti išmaniųjų namų ekosistema, skirta Windows, macOS, Linux, Android ir iOS. Tiesioginis įrenginių valdymas jūsų vietiniame tinkle, greitai reaguojančios automatizacijos ir energijos rodikliai realiuoju laiku. Visada nemokama; pasirenkamas NEXUS+ planas.",
  nav: [
    ["#features", "Funkcijos"],
    ["#how", "Kaip tai veikia"],
    ["#integrations", "Integracijos"],
    ["#pricing", "Kainos"],
    ["#downloads", "Atsisiųsti"],
    ["#faq", "DUK"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Išmanieji namai pirmiausia vietiniame tinkle",
    h1a: "Jūsų namai.",
    h1b: "Ramiai jūsų rankose.",
    lead: "Vieninga ekosistema jūsų šviestuvams, klimatui, užuolaidoms ir jutikliams — ji tiesiogiai bendrauja su įrenginiais jūsų vietiniame tinkle. Greitai reaguojančios automatizacijos, energijos suvartojimo matavimas realiuoju laiku ir valdymas, kuris veikia net dingus internetui.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Naujausia versija",
    shotAlt: "NEXUS sąsaja ir valdymo centras",
    trust: [
      "Nemokamai, neribotas įrenginių skaičius",
      "Valdymui debesies nereikia",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Galinga infrastruktūra. Lengvas valdymas.",
    lead: "Kiekvienas įrenginio būsenos pokytis, galios rodiklis ir automatizuota scena vykdoma tiesiogiai jūsų vietiniame tinkle, nepriklausant nuo išorinių debesų.",
    items: [
      [
        "zap",
        "Greitai reaguojančios automatizacijos",
        "Pagal laiką ir saulėlydį paleidžiami scenarijai vykdomi tiesiogiai jūsų vietinėje įrangoje — kompiuteryje jie patikimai veikia fone.",
      ],
      [
        "gauge",
        "Energijos rodmenys realiuoju laiku",
        "Skaitykite momentinę galią ir suvartojimą tiesiai iš palaikomų išmaniųjų kištukų ir jungiklių savo vietiniame tinkle.",
      ],
      [
        "wifi",
        "Vietinio tinklo greitis",
        "Tiesioginis LAN ryšys per HTTP, TCP ir UDP su skyriuje Integracijos išvardytais gamintojais. Komandų kelyje nėra debesies.",
      ],
      [
        "lock",
        "Privatumas nuo pat pradžių",
        "Jūsų namų konfigūracija ir įrenginių telemetrija lieka jūsų vietinėje įrangoje. NEXUS naudoti reikia paskyros; ji saugo jūsų sąranką jūsų pačių eilutėje, apsaugotoje eilučių lygio prieigos kontrole. Įrenginių komandos vis tiek keliauja per jūsų LAN.",
      ],
      [
        "sparkles",
        "NEXUS AI intelektas",
        "Vietinės išmaniųjų namų komandos vykdomos akimirksniu ir visada nemokamai. Pasirenkamas debesies DI asistentas pateikia protingų patarimų, kai tik jų prireikia.",
      ],
      [
        "layers",
        "Atviri vietiniai protokolai",
        "Tiesioginiai jungtukai bendrauja jūsų LAN tinkle. Matter ir Zigbee jungiami per jūsų pačių Home Assistant serverį — skyriuje Integracijos nurodyta, kas jungiama tiesiogiai, o kas per tiltą.",
      ],
    ],
  },
  how: {
    heading: "Nuo atsisiuntimo iki sujungimo per kelias minutes.",
    steps: [
      [
        "1",
        "Įdiekite ir atidarykite",
        "Atsisiųskite savo platformai skirtą diegimo programą (Windows, Linux ar Android). Tada prisijunkite — NEXUS naudoti reikia paskyros, o ji taip pat sinchronizuoja sąranką tarp jūsų ekranų.",
      ],
      [
        "2",
        "Pridėkite įrenginius",
        "Pasirinkite gamintoją, ieškokite vietiniame tinkle arba įveskite IP adresą. Gamintojai su tiesioginiu jungtuku naudoja savo protokolą — be gamintojo debesies šiame kelyje.",
      ],
      [
        "3",
        "Gyvenkite savo namais",
        "Scenos, suplanuotos automatizacijos ir tikri energijos rodmenys — vieningas valdymas kompiuteryje ir telefone.",
      ],
    ],
  },
  integrations: {
    heading: "Veikia su tuo, ką jau turite.",
    lead: "Pirmiausia nemokami vietiniai protokolai. Viskas, kam nėra tiesioginio jungtuko, vis tiek veikia per Home Assistant tiltą.",
    groups: [
      [
        "Vietinis HTTP — visose platformose",
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
        "Vietinis tinklas, be paskyros ir rakto — kompiuterio programa",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY režimas)", "Wake-on-LAN"],
      ],
    ],
    more: "Ko nors trūksta? Paprašykite jungtuko",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Naudokite nemokamai. NEXUS+, kai norite daugiau",
    lead: "",
    currencyNote: "Kainos USD",
    plans: [
      {
        name: "Nemokamas",
        price: "$0",
        period: "visam laikui",
        features: [
          "Neribotas įrenginių ir kambarių skaičius visuose palaikomuose vietiniuose protokoluose",
          "Jokios priklausomybės nuo debesies: veikia vietoje, jūsų LAN",
          "30 NEXUS AI komandų ir įrenginių veiksmų per dieną",
          "Suplanuotos vietinės automatizacijos ir pritaikytos scenos",
          "Paskyros sinchronizavimas tarp kelių įrenginių (kambariai, įrenginiai, scenos)",
          "100 % privatu: jokio sekimo, jokio duomenų rinkimo",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "per mėnesį",
        badge: "Populiariausias",
        features: [
          "Viskas, kas yra Free plane, ir dar:",
          "2 000 NEXUS AI atsakymų per mėnesį vietoje 30 per dieną",
          "Paprašykite NEXUS AI nustatyti scenas ir atsakyti paprasta kalba",
          "Viena paskyra, galiojanti visuose NEXUS įrenginiuose",
          "Nemokamas bandomasis laikotarpis — 3 dienos mėnesiniam, 7 dienos metiniam planui; atsisakyti galima laikotarpio pabaigoje",
        ],
        cta: {
          label: "Pradėti nemokamą bandymą",
          monthlyLabel: "Pradėti 3 dienų nemokamą bandymą",
          yearlyLabel: "Pradėti 7 dienų nemokamą bandymą",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Šeimos",
        price: "Nemokamai",
        period: "visai šeimai",
        badge: "Visi namai",
        features: [
          "Namų ūkio nariai su rolėmis pagrįsta prieiga — narių skaičius neribojamas",
          "Savininko, nario ir svečio rolės",
          "Kiekvieno nario valdymo, kvietimų ir nustatymų teisės",
          "Scenos ir automatizacijos sinchronizuojamos tarp jūsų prisijungusių įrenginių",
          "Veikia visoje ekosistemoje (kompiuteryje ir telefone)",
          "Visiškai nemokama kartu su jūsų namais",
        ],
        cta: { label: "Pradėti su Family", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Atsisakyti galite bet kada skiltyje Atsiskaitymas programoje arba savo paskyroje šioje svetainėje. Atsisakymas įsigalioja einamojo laikotarpio pabaigoje.",
  },
  downloads: {
    heading: "Savaiminė programa kiekvienam kompiuteriui. Patogi ir telefone.",
    lead: "Visada nemokama. Prie kiekvienos diegimo programos pateikiama paskelbta SHA-256 kontrolinė suma, kad galėtumėte patikrinti, ką diegiate.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64 bitų", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian ir Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · pasirašytas APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Versija",
    sizeLabel: "Dydis",
    webCard: {
      title: "Viena paskyra visoje ekosistemoje",
      desc: "Windows ir Linux kompiuterių programos bei Android programėlė. Prisijungus jūsų kambariai, įrenginiai, scenos ir automatizacijos sklandžiai sinchronizuojasi tarp visų ekranų.",
      cta: { label: "Atsisiųsti NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "Sistemoje Windows paprasčiausias būdas — Microsoft Store: paketą pasirašo Microsoft, o naujinimai gaunami per Store. Tiesiogiai atsisiųstas .exe yra nepasirašytas, todėl Windows gali įspėti apie „nežinomą leidėją“ — žr. kontrolines sumas.",
  },
  faq: {
    heading: "Svarbūs klausimai — atsakymai.",
    items: [
      [
        "Ar NEXUS veikia vien tik mano vietiniame tinkle?",
        "Taip. NEXUS sukurta laikantis griežtos vietinio tinklo pirmumo architektūros. Jūsų įrenginiai, kambariai, scenos ir jutiklių telemetrija apdorojami tiesiogiai jūsų namų įrangoje. Net dingus internetui visi vietiniai valdikliai, apšvietimas ir automatizacijos toliau veikia sklandžiai be vėlavimo. Prisijungus saugiai sinchronizuojami jūsų nustatymai tarp visų ekranų.",
      ],
      [
        "Ar NEXUS reikia įdiegti, ar ji veikia naršyklėje?",
        "Įdiekite kompiuterio programą (Windows ar Linux) arba Android programėlę. NEXUS nėra siūloma kaip naršyklės programa. Įrenginių komandos keliauja jūsų vietiniu tinklu. Shelly, Philips Hue, ESPHome, Tasmota, WLED ir Home Assistant naudoja vietinį HTTP kompiuterio programoje ir Android. TP-Link Kasa ir Yeelight reikalingas neapdorotas TCP, todėl jie veikia kompiuterio programoje. Ši svetainė skirta paskyrai, atsisiuntimams ir atsiskaitymui.",
      ],
      [
        "Ką prideda NEXUS+ planas?",
        "Pagrindinis išmaniųjų namų valdymas — neribotas įrenginių ir kambarių skaičius, neprisijungus veikiančios automatizacijos ir vietinės informacijos skydeliai — nemokamas. NEXUS+ apima viską, kas yra Free plane, taip pat NEXUS AI scenoms ir klausimams paprasta kalba, 2 000 atsakymų per mėnesį, išplėstinius ryšius Home Assistant įrenginiams pridėti ir vieną paskyrą visuose įrenginiuose, su 3 dienų bandomuoju laikotarpiu mėnesiniam arba 7 dienų — metiniam planui. Įrenginių komandos vis tiek vykdomos vietoje. Namų ūkio rolės įtrauktos į jūsų namus be papildomo mokesčio.",
      ],
      [
        "Kuriai paskyrai priklauso mano NEXUS+ prenumerata?",
        "El. pašto adresui, naudotam atsiskaitant. Prieš mokėdami prisijunkite šioje svetainėje arba programoje: tada atsiskaitymas atsidaro su jūsų paskyros el. paštu, o prenumerata rodoma kiekviename įrenginyje, kuriame prisijungiate. NEXUS+ negalima įsigyti be paskyros. Jei sumokėsite naudodami kitą el. paštą, prenumerata bus saugoma pagal tą el. paštą ir jūsų paskyroje neatsiras, kol neprisijungsite su juo.",
      ],
      [
        "Kaip vykdomos automatizacijos ir suplanuotos taisyklės?",
        "NEXUS automatizacijų variklis vertina jūsų tvarkaraščius ir jutiklių taisykles įrenginyje, kurį laikote įjungtą — kompiuterio programa lieka sistemos juostoje ir veikia visą parą, todėl apšvietimo, energijos ir saugumo rutinos niekada nelaukia debesies. Scenos ir laikmačiai, paleisti iš telefono, pritaikomi akimirksniu per jūsų LAN. Nauji įvykiai siunčiami į pranešimų kanalus, kuriuos įjungiate puslapyje Tiesioginiai pranešimai: programos juostą, sistemos pranešimus, ntfy, Telegram arba savo HTTPS webhook.",
      ],
      [
        "Kokie įrenginiai ir ekosistemos palaikomi?",
        "NEXUS kalba kiekvieno įrenginio savo vietiniu protokolu: Shelly (Gen1 ir Gen2+), Tasmota, WLED, ESPHome, Philips Hue ir Home Assistant per vietinį HTTP visose platformose, o TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY režimas) ir Wake-on-LAN — vietiniu tinklu kompiuterio programoje, be paskyros ar rakto. Visa kita — Matter ar Zigbee įranga — jungiama per jūsų pačių Home Assistant serverį, kurį NEXUS traktuoja kaip vieną vietinį centrą. Vietinis IP aptikimas įrenginius suporuoja akimirksniu, be gamintojo debesies per vidurį.",
      ],
      [
        "Kaip integruojamos apsaugos kameros ir jutikliai?",
        "NEXUS sujungia jūsų apsaugos kameras, judesio detektorius ir įėjimo jutiklius į vieną centralizuotą saugumo skydelį. Galite automatizuoti privatumo režimus, įjungti stebėjimo rutinas išeinant iš namų ir matyti kiekvieną judesio ar kontakto įvykį programoje — taip pat jūsų įjungtuose pranešimų kanaluose (sistemos pranešimai, ntfy, Telegram arba savo webhook).",
      ],
      [
        "Ar galiu bet kada atsisakyti NEXUS+?",
        "Taip, be vargo ir be įsipareigojimų. Atsisakyti galite vienu paspaudimu bet kada: programos nustatymuose Paskyra ir atsiskaitymas, per mūsų svetainę arba tiesiai iš užsakymo nuorodos savo atsiskaitymo el. laiško kvite. Jūsų premium privalumai lieka aktyvūs iki atsiskaitymo ciklo pabaigos, o ateityje jokių mokesčių nebus.",
      ],
      [
        "Ar galiu valdyti namus, kai manęs nėra?",
        "Ne per NEXUS debesį: NEXUS bendrauja su jūsų įrenginiais tiesiogiai namų tinkle ir neturi tarpinio serverio. Norėdami prisijungti iš išorės, prijunkite telefoną ar nešiojamąjį prie namų tinklo per VPN, pavyzdžiui, Tailscale (potinklio maršrutizatorius) arba WireGuard savo maršrutizatoriuje; tada NEXUS veikia lygiai taip pat, kaip namuose. NEXUS dar neturi centro adreso nustatymo, todėl VPN turi padaryti prieinamą jūsų vietinių adresų diapazoną, o naujų įrenginių paieška veikia tik namų tinkle. Niekada neatverkite įrenginio internetui nukreipdami prievadus. Žingsnis po žingsnio gidas yra docs/REMOTE-ACCESS.md saugykloje.",
      ],
      [
        "Ar yra iPhone versija?",
        "App Store programėlės nėra, nes NEXUS nenaudoja mokamos Apple Developer paskyros. Su Mac ir nemokamu Apple ID galite sukompiliuoti ją savo iPhone (gidas: docs/IOS-BUILD.md), o leidime gali būti pridėtas ir nepasirašytas IPA, kurį AltStore ar Sideloadly gali pasirašyti už jus; šis kelias dar nepatikrintas su tikru iPhone. Nemokamas Apple ID programėlę nustoja galioti po 7 dienų, o pranešimai uždarius programą iOS sistemoje nepasiekiami. Namų centras vis dar yra kompiuterio programa; iPhone yra klientas.",
      ],
      [
        "Mano įrenginio sąraše nėra. Ką daryti?",
        "NEXUS palaiko tik įrenginius su dokumentuotu vietiniu protokolu; tik debesies įrenginiai nepalaikomi, nes NEXUS niekada nebendrauja su gamintojo debesimi. Suderinamumo sąraše (docs/COMPATIBILITY.md) taip pat yra Sonoff DIY režimu, WiZ, LIFX, Govee (LAN) ir Wake-on-LAN. Kiekvienas jų turi automatizuotus protokolo testus, tačiau modelis laikomas patikrintu tik tada, kai kas nors praneša, kad jis veikė su tikru įrenginiu. Parašykite mums per šios svetainės kontaktų formą (pasirinkite „New Device / Connector Request“) arba el. paštu: gamintoją ir modelį, ko tikėjotės ir kas įvyko. Žinia, kad modelis veikė jūsų tikrame įrenginyje, ir yra tai, kas pažymi jį kaip patikrintą; niekada neįtraukite slaptažodžių, vietinių raktų ar žetonų.",
      ],
      [
        "Ar man reikia paskyros? Kas nutinka, jei serveris neveikia?",
        "Taip: vieną kartą prisijungiate su nemokama el. pašto paskyra, kad atidarytumėte NEXUS. Po to įrenginių valdymas ir automatizacijų vykdymas vyksta jūsų tinkle ir toliau veikia be interneto. Paskyra prideda sinchronizavimą tarp įrenginių, Family ir DI asistentą, kurie naudoja nemokamas debesies paslaugas su apribojimais. Kai viena iš jų nepasiekiama, pavyzdžiui, kai nemokamas Supabase projektas sustabdomas po maždaug savaitės be veiklos, debesies ekranai pasako, kad serveris nepasiekiamas, o ne rodo, kad kažkas išsaugota; įrenginiai, automatizacijos ir sistemos juostos programa toliau veikia. Jei DI kvota ar paslauga išnaudota, asistentas pasako, kad negalėjo atsakyti.",
      ],
      [
        "Ar galiu sukurti nustatymų atsarginę kopiją ir perkelti į kitą įrenginį?",
        "Taip. Nustatymuose yra atsarginių kopijų skiltis, kur galite eksportuoti nustatymus ir automatizacijas į JSON failą ir importuoti jį kitame įrenginyje ar iš naujo įdiegę. Slaptažodžiai, žetonai ir vietiniai raktai pašalinami iš failo suporuotų įrenginių sąrašo, todėl atkūrę įveskite juos iš naujo. Laikykite atsarginės kopijos failą privatų.",
      ],
      [
        "Ar galiu eksportuoti energijos duomenis?",
        "Taip. Energijos puslapyje galima eksportuoti naujausius tikrus jūsų įrenginių galios rodmenis CSV arba JSON failu. NEXUS turi duomenų tik apie įrenginius, kurie iš tikrųjų praneša galią; jei nesuporuota nė vieno, nėra ko eksportuoti.",
      ],
      [
        "Kodėl Windows įspėja mane paleidžiant diegimo programą?",
        "Įdiekite iš Microsoft Store ir šio įspėjimo nematysite: Microsoft pasirašo tą paketą sertifikavimo metu ir pristato naujinimus per Store. Tiesiogiai atsisiųstas .exe dar nepasirašytas komerciniu sertifikatu, todėl SmartScreen gali rodyti „nežinomas leidėjas“. Prieš paleisdami galite palyginti failą su atsisiuntimų skiltyje nurodytomis kontrolinėmis sumomis. Mūsų kodo pasirašymo politikos nuoroda yra svetainės poraštėje.",
      ],
    ],
  },
  about: {
    title: "Apie NEXUS",
    lead: "Nepriklausoma, vietinio tinklo principu veikianti išmaniųjų namų platforma, sukurta greičiui, absoliučiam privatumui ir tikrai nuosavybei savo įrangai. Kalbėdama su jūsų įrenginiais tiesiogiai jūsų namų tinkle, NEXUS visiems laikams panaikina priklausomybę nuo debesies.",
    manifesto: {
      heading: "Kodėl sukūrėme NEXUS",
      text: "Šiuolaikinė išmaniųjų namų pramonė pasuko klaidingu keliu. Uždaros ekosistemos privertė namų savininkus prie privalomų prenumeratų, nuo debesies priklausančio vėlavimo ir įkyraus telemetrijos sekimo. Dingus internetui, jūsų svetainės jungiklis neturėtų nustoti veikti. Sukūrėme NEXUS, nes tikime, kad jūsų namai yra jūsų prieglobstis: jūsų planas, kamerų būsenos ir kasdienės šeimos rutinos turi priklausyti tik jūsų įrangai.",
    },
    pillars: [
      {
        title: "Vietinio tinklo greitis",
        desc: "Kiekviena automatizacija ir komanda vykdoma jūsų vietiniu LAN per milisekundes. Jokių kelionių į nutolusius debesies serverius, jokio vėlavimo.",
      },
      {
        title: "Privatumas be kompromisų",
        desc: "Jokios analitinės telemetrijos, jokio elgsenos profiliavimo ir jokio jūsų privačių rutinų pardavimo. Paskyra būtina; jūsų sąranka saugoma jūsų pačių, eilučių lygiu apsaugotoje paskyros eilutėje. Įrenginių komandos vis tiek lieka jūsų LAN.",
      },
      {
        title: "Jokios priklausomybės nuo gamintojo",
        desc: "Pirmiausia atviri vietiniai protokolai: Shelly, Philips Hue, ESPHome, Tasmota ir WLED atsako NEXUS tiesiogiai, o viskas kita jungiasi per jūsų pačių Home Assistant serverį, o ne per gamintojo debesį.",
      },
      {
        title: "Sąžiningas, tvarus SaaS",
        desc: "Pagrindinis išmaniųjų namų valdymas visiškai nemokamas ir neribotas visam laikui. NEXUS+ yra NEXUS AI planas, padedantis padengti tą debesies naudojimą.",
      },
    ],
    architecture: {
      heading: "Sukurta patikimumui",
      lead: "NEXUS sistemos juostoje laiko lengvą kompiuterio variklį, kad tvarkaraščiai ir jutiklių taisyklės būtų vertinamos, kol kompiuteris įjungtas, o mobilioji programa atsidaro tiesiai tame pačiame vietiniame tinkle.",
      items: [
        {
          icon: "layers",
          title: "Kompiuteris",
          desc: "Windows, macOS ir Linux programos lieka sistemos juostoje ir vykdo vietinius tvarkaraščius bei jutiklių taisykles, kol kompiuteris įjungtas. Windows ir Linux pateikiami kaip paruoštos diegimo programos; macOS kompiliuojama iš šaltinio (nepasirašyta: dešiniuoju pelės klavišu → Atidaryti).",
        },
        {
          icon: "wifi",
          title: "Telefonas",
          desc: "Android ir iOS programos atsidaro tame pačiame vietiniame tinkle; įrenginių komandos vis tiek keliauja per jūsų LAN. Android pateikiama kaip pasirašytas APK; iOS kompiliuojama iš šaltinio su Xcode ir nemokamu Apple ID.",
        },
        {
          icon: "lock",
          title: "Paskyra",
          desc: "Paskyra reikalinga, kad kambariai, įrenginiai ir scenos sutaptų visuose ekranuose. Įrenginių komandos nepalieka jūsų namų tinklo.",
        },
      ],
    },
    linksTitle: "Naudingos nuorodos",
  },
  footer: {
    tagline:
      "Valdykite visus savo išmaniuosius namus tiesiogiai per vietinį tinklą — be gamintojo priklausomybės ir be debesies. Net dingus internetui jūsų namai niekada nesustoja.",
    product: "Produktas",
    productLinks: [
      ["Funkcijos", "#features"],
      ["Kainos", "#pricing"],
      ["Atsisiųsti", "#downloads"],
      ["DUK", "#faq"],
      ["Apie", "/about"],
    ],
    account: "Klientams ir pagalba",
    accountLinks: [
      ["Kontaktai ir techninė pagalba", "javascript:nxOpenContactModal('Technical Support')"],
      ["Leidimų pastabos ir bendruomenė", RELEASES_URL],
      ["Atsisiųsti programas", "#downloads"],
    ],
    legal: "Teisinė informacija",
    legalLinks: [
      ["Privatumas", "/privacy"],
      ["Sąlygos", "/terms"],
      ["Grąžinimai", "/refund"],
      ["Kodo pasirašymas", "/code-signing"],
      ["Prisidėkite", "/contribute"],
    ],
    rights: "Visos teisės saugomos.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
