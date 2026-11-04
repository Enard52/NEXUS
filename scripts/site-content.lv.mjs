import { RELEASES_URL } from "./site-constants.mjs";

export const lv = {
  title: "NEXUS — jūsu viedā māja, ko pārvaldāt savā tīklā",
  ogImageAlt: "NEXUS viedās mājas ekosistēma datorā un tālrunī",
  description:
    "NEXUS ir vietējā tīkla principā balstīta viedās mājas ekosistēma operētājsistēmām Windows, macOS, Linux, Android un iOS. Tieša ierīču vadība jūsu pašu vietējā tīklā, ātri reaģējošas automatizācijas un enerģijas rādītāji reāllaikā. Mūžīgi bez maksas; pēc izvēles NEXUS+ plāns.",
  nav: [
    ["#features", "Iespējas"],
    ["#how", "Kā tas darbojas"],
    ["#integrations", "Integrācijas"],
    ["#pricing", "Cenas"],
    ["#downloads", "Lejupielāde"],
    ["#faq", "BUJ"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Viedā māja vispirms vietējā tīklā",
    h1a: "Jūsu māja.",
    h1b: "Mierīgi jūsu rokās.",
    lead: "Vienota ekosistēma jūsu apgaismojumam, klimatam, aizkariem un sensoriem — tā sazinās tieši ar ierīcēm jūsu pašu vietējā tīklā. Ātri reaģējošas automatizācijas, enerģijas patēriņa mērījumi reāllaikā un vadība, kas turpina darboties, pat ja pazūd internets.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Jaunākā versija",
    shotAlt: "NEXUS saskarne un vadības centrs",
    trust: [
      "Bez maksas, neierobežots ierīču skaits",
      "Vadībai mākonis nav vajadzīgs",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Jaudīga infrastruktūra. Viegla vadība.",
    lead: "Katra ierīces stāvokļa maiņa, jaudas rādītājs un automatizēta ainava tiek izpildīta tieši jūsu vietējā tīklā, nepaļaujoties uz ārējiem mākoņiem.",
    items: [
      [
        "zap",
        "Ātri reaģējošas automatizācijas",
        "Pēc laika un saulrieta aktivizēti scenāriji tiek izpildīti tieši jūsu vietējā aparatūrā — datorā tie uzticami turpina darbu fonā.",
      ],
      [
        "gauge",
        "Enerģijas rādījumi reāllaikā",
        "Nolasiet momentāno jaudu un patēriņu tieši no atbalstītajiem viedajiem kontaktligzdu adapteriem un slēdžiem savā vietējā tīklā.",
      ],
      [
        "wifi",
        "Vietējā tīkla ātrums",
        "Tieša LAN saziņa, izmantojot HTTP, TCP un UDP, ar zīmoliem, kas uzskaitīti sadaļā Integrācijas. Komandu ceļā nav mākoņa.",
      ],
      [
        "lock",
        "Privātums jau pēc dizaina",
        "Jūsu mājas konfigurācija un ierīču telemetrija paliek jūsu vietējā aparatūrā. NEXUS lietošanai nepieciešams konts; tas glabā jūsu iestatījumus jūsu pašu rindā ar rindu līmeņa piekļuves kontroli. Ierīču komandas joprojām iet caur jūsu LAN.",
      ],
      [
        "sparkles",
        "NEXUS AI intelekts",
        "Vietējās viedās mājas komandas tiek izpildītas acumirklī un mūžīgi bez maksas. Pēc izvēles mākoņa MI asistents sniedz gudrus ieteikumus, kad vien nepieciešama palīdzība.",
      ],
      [
        "layers",
        "Atvērti vietējie protokoli",
        "Tiešie savienotāji sazinās jūsu LAN tīklā. Matter un Zigbee pievienojas caur jūsu pašu Home Assistant serveri — sadaļā Integrācijas norādīts, kas ir tiešs un kas pieslēgts caur tiltu.",
      ],
    ],
  },
  how: {
    heading: "No lejupielādes līdz savienojumam dažās minūtēs.",
    steps: [
      [
        "1",
        "Instalējiet un atveriet",
        "Lejupielādējiet savai platformai paredzēto instalētāju (Windows, Linux vai Android). Pēc tam pierakstieties — NEXUS lietošanai nepieciešams konts, kas arī sinhronizē iestatījumus starp jūsu ekrāniem.",
      ],
      [
        "2",
        "Pievienojiet ierīces",
        "Izvēlieties zīmolu, skenējiet vietējo tīklu vai ievadiet IP adresi. Zīmoli ar tiešo savienotāju izmanto savu protokolu — šajā ceļā nav ražotāja mākoņa.",
      ],
      [
        "3",
        "Dzīvojiet savā mājā",
        "Ainavas, ieplānotas automatizācijas un īsti enerģijas rādījumi — vienota vadība datorā un tālrunī.",
      ],
    ],
  },
  integrations: {
    heading: "Darbojas ar to, kas jums jau ir.",
    lead: "Vispirms bezmaksas vietējie protokoli. Viss, kam nav tiešā savienotāja, tik un tā darbojas caur Home Assistant tiltu.",
    groups: [
      [
        "Vietējais HTTP — visās platformās",
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
        "Vietējais tīkls, bez konta vai atslēgas — datora lietotne",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY režīms)", "Wake-on-LAN"],
      ],
    ],
    more: "Kaut kā trūkst? Pieprasiet savienotāju",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Lietojiet bez maksas. NEXUS+, kad vēlaties vairāk",
    lead: "",
    currencyNote: "Cenas USD",
    plans: [
      {
        name: "Free",
        price: "$0",
        period: "uz visiem laikiem",
        features: [
          "Neierobežots ierīču un istabu skaits visos atbalstītajos vietējos protokolos",
          "Nekādas atkarības no mākoņa: darbojas lokāli jūsu pašu LAN",
          "30 NEXUS AI komandas un ierīču darbības dienā",
          "Ieplānotas vietējās automatizācijas un pielāgotas ainavas",
          "Konta sinhronizācija starp vairākām ierīcēm (istabas, ierīces, ainavas)",
          "100% privāti: bez izsekošanas, bez datu vākšanas",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "mēnesī",
        badge: "Populārākais",
        features: [
          "Viss, kas ir Free plānā, un vēl:",
          "2000 NEXUS AI atbilžu mēnesī, nevis 30 dienā",
          "Lūdziet NEXUS AI iestatīt ainavas un atbildēt vienkāršā valodā",
          "Viens konts, kas derīgs visās NEXUS ierīcēs",
          "Bezmaksas izmēģinājums — 3 dienas mēneša plānam, 7 dienas gada plānam; atcelt var perioda beigās",
        ],
        cta: {
          label: "Sākt bezmaksas izmēģinājumu",
          monthlyLabel: "Sākt 3 dienu bezmaksas izmēģinājumu",
          yearlyLabel: "Sākt 7 dienu bezmaksas izmēģinājumu",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Family",
        price: "Free",
        period: "visai ģimenei",
        badge: "Visa māja",
        features: [
          "Mājsaimniecības locekļi ar lomās balstītu piekļuvi — locekļu skaits nav ierobežots",
          "Īpašnieka, locekļa un viesa lomas",
          "Katra locekļa vadības, uzaicināšanas un iestatījumu atļaujas",
          "Ainavas un automatizācijas sinhronizējas starp jūsu pierakstītajām ierīcēm",
          "Aktīvs visā ekosistēmā (datorā un tālrunī)",
          "Pilnīgi bez maksas kopā ar jūsu māju",
        ],
        cta: { label: "Sākt ar Family", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Atcelt var jebkurā laikā sadaļā Norēķini lietotnē vai savā kontā šajā vietnē. Atcelšana stājas spēkā kārtējā perioda beigās.",
  },
  downloads: {
    heading: "Dabiski katrā datorā. Ērti arī tālrunī.",
    lead: "Vienmēr bez maksas. Katram instalētājam ir publicēta SHA-256 kontrolsumma, lai varētu pārbaudīt, ko instalējat.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64 bitu", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian un Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · parakstīts APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Versija",
    sizeLabel: "Izmērs",
    webCard: {
      title: "Viens konts visā ekosistēmā",
      desc: "Windows un Linux datora programmas un Android lietotne. Pierakstoties jūsu istabas, ierīces, ainavas un automatizācijas raiti sinhronizējas starp visiem ekrāniem.",
      cta: { label: "Lejupielādēt NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "Sistēmā Windows vienkāršākais ceļš ir Microsoft Store: pakotni paraksta Microsoft, un atjauninājumi nāk caur Store. Tieši lejupielādētais .exe nav parakstīts, tāpēc Windows var brīdināt par „nezināmu izdevēju” — skatiet kontrolsummas.",
  },
  faq: {
    heading: "Svarīgie jautājumi — ar atbildēm.",
    items: [
      [
        "Vai NEXUS darbojas pilnībā manā vietējā tīklā?",
        "Jā. NEXUS ir veidots uz stingras vietējā tīkla prioritātes arhitektūras. Jūsu ierīces, istabas, ainavas un sensoru telemetrija tiek apstrādāta tieši jūsu mājas aparatūrā. Pat ja internets pazūd, visa vietējā vadība, apgaismojums un automatizācijas turpina darboties raiti un bez aizkaves. Pierakstoties droši sinhronizējas jūsu iestatījumi starp visiem ekrāniem.",
      ],
      [
        "Vai NEXUS jāinstalē, vai tas darbojas pārlūkprogrammā?",
        "Instalējiet datora programmu (Windows vai Linux) vai Android lietotni. NEXUS netiek piedāvāts kā pārlūka lietotne. Ierīču komandas iet pa jūsu pašu vietējo tīklu. Shelly, Philips Hue, ESPHome, Tasmota, WLED un Home Assistant izmanto vietējo HTTP datora programmā un Android ierīcēs. TP-Link Kasa un Yeelight nepieciešams neapstrādāts TCP, tāpēc tie darbojas datora programmā. Šī vietne paredzēta kontam, lejupielādēm un norēķiniem.",
      ],
      [
        "Ko pievieno NEXUS+ plāns?",
        "Būtiskā viedās mājas vadība — neierobežotas ierīces, istabas, bezsaistes automatizācijas un vietējie informācijas paneļi — ir bez maksas. NEXUS+ ietver visu, kas ir Free plānā, kā arī NEXUS AI ainavām un jautājumiem vienkāršā valodā, 2000 atbilžu mēnesī, paplašinātus savienojumus Home Assistant ierīču pievienošanai un vienu kontu visās ierīcēs, ar 3 dienu izmēģinājumu mēneša plānam vai 7 dienu — gada plānam. Ierīču komandas joprojām tiek izpildītas lokāli. Mājsaimniecības lomas ir iekļautas jūsu mājā bez papildu maksas.",
      ],
      [
        "Kuram kontam pieder mans NEXUS+ abonements?",
        "E-pasta adresei, kas izmantota norēķinos. Pirms maksāšanas pierakstieties šajā vietnē vai lietotnē: tad norēķinu lapa atveras ar jūsu konta e-pastu, un abonements parādās katrā ierīcē, kurā pierakstāties. NEXUS+ nevar iegādāties bez konta. Ja maksājat ar citu e-pastu, abonements tiek saglabāts pie šī e-pasta un jūsu kontā neparādīsies, kamēr nepierakstīsities ar to.",
      ],
      [
        "Kā darbojas automatizācijas un ieplānotie noteikumi?",
        "NEXUS automatizāciju dzinējs izvērtē jūsu grafikus un sensoru noteikumus ierīcē, kuru turat ieslēgtu — datora lietotne paliek sistēmas joslā un darbojas visu diennakti, tāpēc apgaismojuma, enerģijas un drošības rutīnām nekad nav jāgaida mākonis. Ainavas un taimeri, kas palaisti no tālruņa, tiek pielietoti acumirklī caur jūsu LAN. Jaunie notikumi tiek nosūtīti uz paziņojumu kanāliem, ko ieslēdzat lapā Tūlītējie paziņojumi: lietotnes joslu, sistēmas paziņojumiem, ntfy, Telegram vai jūsu pašu HTTPS webhook.",
      ],
      [
        "Kuras ierīces un ekosistēmas tiek atbalstītas?",
        "NEXUS runā katras ierīces savā vietējā protokolā: Shelly (Gen1 un Gen2+), Tasmota, WLED, ESPHome, Philips Hue un Home Assistant caur vietējo HTTP visās platformās, kā arī TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY režīms) un Wake-on-LAN caur vietējo tīklu datora lietotnē, bez konta vai atslēgas. Viss pārējais — Matter vai Zigbee iekārtas — pievienojas caur jūsu pašu Home Assistant serveri, ko NEXUS uztver kā vienu vietējo centrmezglu. Vietējā IP atklāšana ierīces savieno acumirklī, bez ražotāja mākoņa pa vidu.",
      ],
      [
        "Kā tiek integrētas drošības kameras un sensori?",
        "NEXUS apvieno jūsu drošības kameras, kustības detektorus un ieejas sensorus vienā centralizētā drošības panelī. Varat automatizēt privātuma režīmus, aktivizēt novērošanas rutīnas, izejot no mājas, un redzēt katru kustības vai kontakta notikumu lietotnē — kā arī jūsu ieslēgtajos paziņojumu kanālos (sistēmas paziņojumi, ntfy, Telegram vai jūsu pašu webhook).",
      ],
      [
        "Vai NEXUS+ var atcelt jebkurā laikā?",
        "Jā, bez raizēm un bez saistībām. Atcelt var ar vienu klikšķi jebkurā laikā: lietotnes iestatījumos Konts un norēķini, mūsu vietnē vai tieši no pasūtījuma saites jūsu norēķinu e-pasta kvītī. Jūsu premium priekšrocības paliek aktīvas līdz norēķinu cikla beigām, un turpmāku maksājumu nebūs.",
      ],
      [
        "Vai varu vadīt māju, kad esmu prom?",
        "Ne caur NEXUS mākoni: NEXUS sazinās ar jūsu ierīcēm tieši mājas tīklā un nav starpnieka servera. Lai piekļūtu no ārpuses, pievienojiet tālruni vai klēpjdatoru mājas tīklam ar VPN, piemēram, Tailscale (apakštīkla maršrutētājs) vai WireGuard savā maršrutētājā; tad NEXUS darbojas tieši tāpat kā mājās. NEXUS vēl nav centrmezgla adreses iestatījuma, tāpēc VPN jāpadara sasniedzams jūsu vietējo adrešu diapazons, un jaunu ierīču meklēšana darbojas tikai mājas tīklā. Nekad neatveriet ierīci internetam ar portu pārsūtīšanu. Soli pa solim ceļvedis ir docs/REMOTE-ACCESS.md krātuvē.",
      ],
      [
        "Vai ir iPhone versija?",
        "App Store lietotnes nav, jo NEXUS neizmanto maksas Apple Developer kontu. Ar Mac un bezmaksas Apple ID varat to uzbūvēt savam iPhone (ceļvedis: docs/IOS-BUILD.md), un laidienam var tikt pievienots arī neparakstīts IPA, ko AltStore vai Sideloadly var parakstīt jūsu vietā; šis ceļš vēl nav pārbaudīts ar īstu iPhone. Bezmaksas Apple ID lietotni derīguma termiņš beidzas pēc 7 dienām, un paziņojumi, kamēr lietotne ir aizvērta, iOS nav pieejami. Mājas centrmezgls joprojām ir datora lietotne; iPhone ir klients.",
      ],
      [
        "Manas ierīces nav sarakstā. Ko darīt?",
        "NEXUS atbalsta tikai ierīces ar dokumentētu vietējo protokolu; tikai mākoņa ierīces netiek atbalstītas, jo NEXUS nekad nesazinās ar ražotāja mākoni. Saderības sarakstā (docs/COMPATIBILITY.md) ir arī Sonoff DIY režīmā, WiZ, LIFX, Govee (LAN) un Wake-on-LAN. Katram no tiem ir automatizēti protokola testi, taču modelis tiek uzskatīts par pārbaudītu tikai tad, kad kāds ziņo, ka tas darbojies uz īstas ierīces. Rakstiet mums caur šīs vietnes kontaktu veidlapu (izvēlieties „New Device / Connector Request”) vai pa e-pastu: zīmols un modelis, ko gaidījāt un kas notika. Ziņa, ka modelis darbojies jūsu īstajā ierīcē, ir tā, kas to atzīmē kā pārbaudītu; nekad nepievienojiet paroles, vietējās atslēgas vai žetonus.",
      ],
      [
        "Vai man vajadzīgs konts? Kas notiek, ja serveris nedarbojas?",
        "Jā: jūs vienreiz pierakstāties ar bezmaksas e-pasta kontu, lai atvērtu NEXUS. Pēc tam ierīču vadība un automatizāciju izpilde notiek jūsu tīklā un turpina darboties bez interneta. Konts pievieno sinhronizāciju starp ierīcēm, Family un MI asistentu, kas izmanto bezmaksas mākoņa pakalpojumus ar ierobežojumiem. Kad kāds no tiem nav pieejams, piemēram, kad bezmaksas Supabase projekts apturēts pēc aptuveni nedēļas bez aktivitātes, mākoņa ekrāni saka, ka serveris nav sasniedzams, nevis rāda kaut ko kā saglabātu; ierīces, automatizācijas un sistēmas joslas lietotne turpina darboties. Ja MI kvota vai pakalpojums ir izsmelts, asistents saka, ka nevarēja atbildēt.",
      ],
      [
        "Vai varu dublēt iestatījumus un pārnest tos uz citu ierīci?",
        "Jā. Iestatījumos ir dublēšanas sadaļa, kur varat eksportēt iestatījumus un automatizācijas JSON failā un importēt to citā ierīcē vai pēc pārinstalēšanas. Paroles, žetoni un vietējās atslēgas tiek izņemti no faila savienoto ierīču saraksta, tāpēc pēc atjaunošanas ievadiet tos no jauna. Glabājiet dublējuma failu privāti.",
      ],
      [
        "Vai varu eksportēt enerģijas datus?",
        "Jā. Enerģijas lapā var eksportēt jaunākos īstos jūsu ierīču jaudas rādījumus CSV vai JSON failā. NEXUS ir dati tikai par ierīcēm, kas patiešām ziņo jaudu; ja nav savienota neviena, nav ko eksportēt.",
      ],
      [
        "Kāpēc Windows mani brīdina, palaižot instalētāju?",
        "Instalējiet no Microsoft Store, un šo brīdinājumu neredzēsit: Microsoft paraksta šo pakotni sertifikācijas laikā un piegādā atjauninājumus caur Store. Tieši lejupielādētais .exe vēl nav parakstīts ar komerciālu sertifikātu, tāpēc SmartScreen var rādīt „nezināms izdevējs”. Pirms palaišanas varat salīdzināt failu ar lejupielāžu sadaļā norādītajām kontrolsummām. Mūsu koda parakstīšanas politikas saite ir vietnes kājenē.",
      ],
    ],
  },
  about: {
    title: "Par NEXUS",
    lead: "Neatkarīga, vietējā tīkla principā balstīta viedās mājas platforma, kas veidota ātrumam, absolūtam privātumam un patiesai aparatūras īpašumtiesībām. Sarunājoties ar jūsu ierīcēm tieši jūsu mājas tīklā, NEXUS uz visiem laikiem likvidē atkarību no mākoņa.",
    manifesto: {
      heading: "Kāpēc mēs izveidojām NEXUS",
      text: "Mūsdienu viedās mājas nozare ir nogriezusies uz nepareizā ceļa. Slēgtas ekosistēmas piespieda mājas īpašniekus pie obligātiem abonementiem, no mākoņa atkarīgas aizkaves un uzbāzīgas telemetrijas izsekošanas. Kad pazūd internets, jūsu viesistabas slēdzim nevajadzētu pārstāt darboties. Mēs izveidojām NEXUS, jo ticam, ka jūsu māja ir jūsu patvērums: jūsu plānojums, kameru stāvokļi un ikdienas ģimenes rutīnas pieder tikai jūsu aparatūrai.",
    },
    pillars: [
      {
        title: "Vietējā tīkla ātrums",
        desc: "Katra automatizācija un komanda tiek izpildīta jūsu vietējā LAN milisekundēs. Nekādu apgriezienu uz attāliem mākoņa serveriem, nulle aizkaves.",
      },
      {
        title: "Privātums bez kompromisiem",
        desc: "Nekādas analītikas telemetrijas, nekādas uzvedības profilēšanas un nekādas jūsu privāto rutīnu pārdošanas. Konts ir nepieciešams; jūsu iestatījumi tiek glabāti jūsu pašu, rindu līmenī aizsargātā konta rindā. Ierīču komandas joprojām paliek jūsu LAN.",
      },
      {
        title: "Nekādas atkarības no ražotāja",
        desc: "Vispirms atvērti vietējie protokoli: Shelly, Philips Hue, ESPHome, Tasmota un WLED atbild NEXUS tieši, un viss pārējais pievienojas caur jūsu pašu Home Assistant serveri, nevis ražotāja mākoni.",
      },
      {
        title: "Godīgs, ilgtspējīgs SaaS",
        desc: "Pamata viedās mājas pārvaldība ir pilnīgi bez maksas un neierobežota uz visiem laikiem. NEXUS+ ir NEXUS AI plāns, kas palīdz segt šo mākoņa lietojumu.",
      },
    ],
    architecture: {
      heading: "Izstrādāts uzticamībai",
      lead: "NEXUS sistēmas joslā tur vieglu datora dzinēju, lai grafiki un sensoru noteikumi tiktu izvērtēti, kamēr dators ir ieslēgts, un mobilā lietotne atveras tieši tajā pašā vietējā tīklā.",
      items: [
        {
          icon: "layers",
          title: "Dators",
          desc: "Windows, macOS un Linux lietotnes paliek sistēmas joslā un turpina izpildīt vietējos grafikus un sensoru noteikumus, kamēr dators ir ieslēgts. Windows un Linux tiek piegādāti kā gatavi instalētāji; macOS tiek būvēts no pirmkoda (neparakstīts: peles labā poga → Atvērt).",
        },
        {
          icon: "wifi",
          title: "Tālrunis",
          desc: "Android un iOS lietotnes atveras tajā pašā vietējā tīklā; ierīču komandas joprojām iet caur jūsu LAN. Android tiek piegādāts kā parakstīts APK; iOS tiek būvēts no pirmkoda ar Xcode un bezmaksas Apple ID.",
        },
        {
          icon: "lock",
          title: "Konts",
          desc: "Konts ir nepieciešams, lai istabas, ierīces un ainavas sakristu katrā ekrānā. Ierīču komandas neatstāj jūsu mājas tīklu.",
        },
      ],
    },
    linksTitle: "Noderīgas saites",
  },
  footer: {
    tagline:
      "Vadiet visu savu viedo māju tieši pa vietējo tīklu — bez ražotāja atkarības un bez mākoņa. Pat ja pazūd internets, jūsu māja nekad nepārstāj darboties.",
    product: "Produkts",
    productLinks: [
      ["Iespējas", "#features"],
      ["Cenas", "#pricing"],
      ["Lejupielāde", "#downloads"],
      ["BUJ", "#faq"],
      ["Par mums", "/about"],
    ],
    account: "Klientiem un atbalsts",
    accountLinks: [
      ["Kontakti un tehniskais atbalsts", "javascript:nxOpenContactModal('Technical Support')"],
      ["Laidienu piezīmes un kopiena", RELEASES_URL],
      ["Lejupielādēt lietotnes", "#downloads"],
    ],
    legal: "Juridiskā informācija",
    legalLinks: [
      ["Privātums", "/privacy"],
      ["Noteikumi", "/terms"],
      ["Atmaksas", "/refund"],
      ["Koda parakstīšana", "/code-signing"],
      ["Piedalieties", "/contribute"],
    ],
    rights: "Visas tiesības aizsargātas.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
