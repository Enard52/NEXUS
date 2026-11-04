import { RELEASES_URL } from "./site-constants.mjs";

export const eu = {
  title: "NEXUS — Zure etxe adimenduna, zure sarean kudeatua",
  ogImageAlt: "NEXUS etxe adimenaren ekosistema mahaigainean eta mugikorrean",
  description:
    "NEXUS tokiko-lehenengo etxe adimenaren ekosistema da Windows, macOS, Linux, Android eta iOSrako. Gailuen kontrol zuzena zure tokiko sarean, automatizazio azkarrak eta energia-neurketak denbora errealean. Betiko doakoa; NEXUS+ plan aukerazkoa.",
  nav: [
    ["#features", "Ezaugarriak"],
    ["#how", "Nola funtzionatzen du"],
    ["#integrations", "Integrazioak"],
    ["#pricing", "Prezioak"],
    ["#downloads", "Deskargatu"],
    ["#faq", "Ohiko galderak"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Tokiko-lehenengo etxe adimenduna",
    h1a: "Zure etxea.",
    h1b: "Isilean zure kontrolpean.",
    lead: "Ekosistema bakarra zure argientzat, girotzeagatik, pertsianentzat eta sentsoreentzat — zure tokiko sareko gailuekin zuzenean hitz egiten. Automatizazio azkarrak, kontsumo elektrikoaren neurketa zuzenekoa eta internetek huts egiten duenean ere funtzionatzen jarraitzen duen kontrola.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Azken bertsioa",
    shotAlt: "NEXUS interfazea eta kontrol-zentroa",
    trust: [
      "Doakoa, gailu mugagabeak",
      "Kontrolerako ez da hodeirik behar",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Azpiegitura indartsua. Kontrol erraza.",
    lead: "Gailu bakoitzaren egoera, energia-neurketa eta eszena automatizatu bakoitza zuzenean zure tokiko sarean exekutatzen da, kanpoko hodei-mendekotasunik gabe.",
    items: [
      [
        "zap",
        "Automatizazio azkarrak",
        "Ordu- eta ilunabar-eszenatokiak zuzenean zure tokiko hardwarean exekutatzen dira — mahaigainean atzeko planoan fidagarritasunez jarraitzen dute.",
      ],
      [
        "gauge",
        "Energia-irakurketak zuzenean",
        "Irakurri denbora errealeko watioak eta energia-kontsumoa zuzenean zure tokiko sareko entxufe eta etengailu adimendun bateragarrietatik.",
      ],
      [
        "wifi",
        "Tokiko sarearen abiadura",
        "LAN bidezko komunikazio zuzena HTTP, TCP eta UDP bidez Integrazioak atalean zerrendatutako markekin. Komandoen bidean ez dago hodeirik.",
      ],
      [
        "lock",
        "Pribatutasuna diseinutik",
        "Zure etxearen konfigurazioa eta gailuen telemetria zure tokiko hardwarean geratzen dira. NEXUS erabiltzeko kontu bat behar da; zure konfigurazioa zure errenkada propioan gordetzen du, errenkada-mailako sarbide-kontrolaren pean. Gailuen komandoak LANetik joaten dira oraindik.",
      ],
      [
        "sparkles",
        "NEXUS AI adimena",
        "Etxe adimenaren tokiko komandoak berehalakoak dira eta betiko doakoak. Hodeiko AI laguntzaile aukerazkoak iradokizun adimentsuak ematen ditu gidaritza behar duzunean.",
      ],
      [
        "layers",
        "Tokiko protokolo irekiak",
        "Konektore zuzenek zure LANean hitz egiten dute. Matter eta Zigbee zure Home Assistant zerbitzariaren bidez batzen dira — Integrazioak atalak zerrendatzen du zer den zuzena eta zer zubi bidezkoa.",
      ],
    ],
  },
  how: {
    heading: "Deskargatik konektatzera minutuetan.",
    steps: [
      [
        "1",
        "Instalatu eta ireki",
        "Deskargatu zure plataformarako instalatzaile natiboa (Windows, Linux edo Android). Gero hasi saioa — NEXUS erabiltzeko kontu bat behar da, eta konfigurazioa zure pantailen artean sinkronizatzen ere du.",
      ],
      [
        "2",
        "Gehitu zure gailuak",
        "Aukeratu zure marka, eskaneatu tokiko sarea edo sartu IP bat. Konektore zuzena duten markek beren protokoloa erabiltzen dute — bide horretan ez dago fabrikatzailearen hodeirik.",
      ],
      [
        "3",
        "Bizi zure etxea",
        "Eszenak, programatutako automatizazioak eta benetako energia-irakurketak — kontrol bateratua mahaigainean eta mugikorrean.",
      ],
    ],
  },
  integrations: {
    heading: "Dagoeneko duzunarekin funtzionatzen du.",
    lead: "Doako tokiko protokoloak lehenik. Konektore zuzenik ez duen guztiak Home Assistant zubiaren bidez funtzionatzen du oraindik.",
    groups: [
      [
        "HTTP lokala — plataforma guztietan",
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
        "Tokiko sarea, konturik edo gakorik gabe — mahaigaineko aplikazioa",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY modua)", "Wake-on-LAN"],
      ],
    ],
    more: "Zerbait falta da? Eskatu konektore bat",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Erabiltzeko doakoa. NEXUS+ gehiago nahi duzunean",
    lead: "",
    currencyNote: "Prezioak USDtan",
    plans: [
      {
        name: "Doakoa",
        price: "$0",
        period: "betiko",
        features: [
          "Gailu eta gela mugagabeak onartutako tokiko protokolo guztietan",
          "Hodei-mendekotasunik ez: tokian bertan exekutatzen da, zure LANean",
          "Egunean 30 NEXUS AI komando eta gailu-ekintza",
          "Programatutako tokiko automatizazioak eta eszena pertsonalizatuak",
          "Gailu anitzeko kontu-sinkronizazioa (gelak, gailuak, eszenak)",
          "% 100 pribatua: jarraipenik eta datu-bilketarik ez",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "hilean",
        badge: "Ospetsuena",
        features: [
          "Free mailako guztia, eta gainera:",
          "Hilean 2.000 NEXUS AI erantzun, egunean 30en ordez",
          "Eskatu NEXUS AIri eszenak ezartzeko eta hizkuntza arruntean erantzuteko",
          "Kontu bakarra, NEXUS gailu guztietan baliozkoa",
          "Doako proba — 3 egun hilabetekoan, 7 egun urtekoan; bertan behera utzi aldiaren amaieran",
        ],
        cta: {
          label: "Hasi doako proba",
          monthlyLabel: "Hasi 3 eguneko doako proba",
          yearlyLabel: "Hasi 7 eguneko doako proba",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Familia",
        price: "Doakoa",
        period: "familia osoarentzat",
        badge: "Etxe osoa",
        features: [
          "Etxeko kideak rol bidezko sarbidearekin — kide-mugarik gabe",
          "Jabe, kide eta gonbidatu rolak",
          "Kide bakoitzaren kontrol, gonbidapen eta ezarpen baimenak",
          "Eszenak eta automatizazioak zure saioa hasita duten gailuen artean sinkronizatzen dira",
          "Ekosistema osoan aktiboa (mahaigaina eta mugikorra)",
          "Guztiz doakoa zure etxearekin batera",
        ],
        cta: { label: "Hasi Familyrekin", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Utzi edozein unetan aplikazioko Fakturaziotik edo gune honetako zure kontutik. Bertan behera uztea uneko aldiaren amaieran gauzatzen da.",
  },
  downloads: {
    heading: "Natiboa mahaigain guztietan. Etxean zure telefonoan.",
    lead: "Beti doakoa. Instalatzaile guztiek argitaratutako SHA-256 egiaztatze-batura dute, instalatzen duzuna egiazta dezazun.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64 biteko", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian eta Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK sinatua",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Bertsioa",
    sizeLabel: "Tamaina",
    webCard: {
      title: "Kontu bakarra, zure ekosistema osoan",
      desc: "Windows eta Linux mahaigaineko programak eta Android aplikazioa. Saioa hasita, zure gelak, gailuak, eszenak eta automatizazioak behar bezala sinkronizatuta geratzen dira zure pantailen artean.",
      cta: { label: "Deskargatu NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "Windowsen bide errazena Microsoft Store da: paketea Microsoftek sinatzen du eta eguneraketak Storetik datoz. .exe zuzena sinatu gabe dago, beraz Windowsek “argitaratzaile ezezaguna” abisua eman dezake — ikusi egiaztatze-baturak.",
  },
  faq: {
    heading: "Galdera garrantzitsuak, erantzunda.",
    items: [
      [
        "NEXUS osorik nire tokiko sarean funtzionatzen al du?",
        "Bai. NEXUS tokiko-lehenengo arkitektura zorrotz baten gainean eraikita dago. Zure gailuak, gelak, eszenak eta sentsoreen telemetria zuzenean zure etxeko hardwarean prozesatzen dira. Interneteko etenaldietan ere, tokiko kontrol, argiztapen eta automatizazio guztiek ondo funtzionatzen jarraitzen dute, latentziarik gabe. Saioa hasteak zure ezarpenak modu seguruan sinkronizatzen ditu zure pantaila guztien artean.",
      ],
      [
        "NEXUS instalatu behar al dut, ala nabigatzailean exekutatzen da?",
        "Instalatu mahaigaineko programa (Windows edo Linux) edo Android aplikazioa. NEXUS ez da nabigatzaileko aplikazio gisa eskaintzen. Gailuen komandoak zure tokiko sarean zehar doaz. Shelly, Philips Hue, ESPHome, Tasmota, WLED eta Home Assistantek HTTP lokala erabiltzen dute mahaigaineko programan eta Androiden. TP-Link Kasak eta Yeelightek TCP gordina behar dute, beraz mahaigaineko programan exekutatzen dira. Gune hau kontua, deskargak eta faktura kudeatzeko da.",
      ],
      [
        "Zer gehitzen du NEXUS+ planak?",
        "Etxe adimenaren oinarrizko kontrola —gailu eta gela mugagabeak, lineaz kanpoko automatizazioak eta tokiko aginte-panelak— doakoa da. NEXUS+ak Free mailako guztia dakar, NEXUS AI eszenetarako eta galderetarako hizkuntza arruntean, hilean 2.000 erantzun, Home Assistant gailuak gehitzeko konexio aurreratuak eta kontu bakarra gailu guztietan, hilabeteko 3 eguneko edo urteko 7 eguneko probarekin. Gailuen komandoak tokian exekutatzen dira oraindik. Etxeko rolak zure etxearekin batera datoz, kosturik gabe.",
      ],
      [
        "Zein kontuk du nire NEXUS+ harpidetza?",
        "Ordainketan erabilitako helbide elektronikoak. Hasi saioa gune honetan edo aplikazioan ordaindu aurretik: orduan ordainketa zure kontuaren helbide elektronikoarekin beteta irekitzen da, eta harpidetza saioa hasten duzun gailu guztietan agertzen da. NEXUS+ ezin da kontu gabe erosi. Beste helbide elektroniko batekin ordaintzen baduzu, harpidetza helbide horren pean gordetzen da eta ez da zure kontuan agertuko harekin saioa hasi arte.",
      ],
      [
        "Nola exekutatzen dira automatizazioak eta programatutako arauak?",
        "NEXUS automatizazio-motorrak zure ordutegiak eta sentsore-arauak ebaluatzen ditu martxan mantentzen duzun gailuan — mahaigaineko aplikazioa sistemaren erretiluan geratzen da eta egun osoan exekutatzen da, beraz argiztapen, energia eta segurtasun errutinek ez dute inoiz hodeiaren zain egon behar. Zure telefonotik abiarazitako eszenak eta tenporizadoreak berehala aplikatzen dira zure LANean. Gertaera berriak Berehalako jakinarazpenak orrian gaitzen dituzun jakinarazpen-kanaletara bidaltzen dira: aplikazioko banda, sistemaren jakinarazpenak, ntfy, Telegram edo zure HTTPS webhook propioa.",
      ],
      [
        "Zein gailu eta ekosistema onartzen dira?",
        "NEXUS-ek gailu bakoitzaren tokiko protokoloa hitz egiten du: Shelly (Gen1 eta Gen2+), Tasmota, WLED, ESPHome, Philips Hue eta Home Assistant HTTP lokalaren bidez plataforma guztietan, eta TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY mode) eta Wake-on-LAN tokiko sarearen bidez mahaigaineko aplikazioan, konturik edo gakorik gabe. Beste guztia —Matter edo Zigbee gailuak— zure Home Assistant zerbitzariaren bidez batzen da, eta NEXUS-ek tokiko hub bakar gisa tratatzen du. IP lokalaren aurkikuntzak gailuak berehala parekatzen ditu, tartean fabrikatzailearen hodeirik gabe.",
      ],
      [
        "Nola integratzen dira segurtasun-kamerak eta sentsoreak?",
        "NEXUS-ek zure segurtasun-kamerak, mugimendu-detektagailuak eta sarrera-sentsoreak segurtasun-panel zentralizatu batean biltzen ditu. Pribatutasun-moduak automatiza ditzakezu, etxetik irtetean zaintza-errutinak aktibatu eta mugimendu edo kontaktu-gertaera bakoitza aplikazioan ikusi — baita gaitzen dituzun jakinarazpen-kanaletan ere (sistemaren jakinarazpenak, ntfy, Telegram edo zure webhook propioa).",
      ],
      [
        "NEXUS+ edozein unetan bertan behera utz dezaket?",
        "Bai, guztiz arazorik gabe eta konpromisorik gabe. Klik batekin utz dezakezu edozein unetan: aplikazioko Kontua eta faktura ezarpenetatik, gure webgunetik edo zuzenean fakturaren posta elektronikoko agiriko eskaera-estekatik. Zure premium onurak fakturazio-zikloaren amaierara arte aktibo egoten dira, etorkizuneko kargurik gabe.",
      ],
      [
        "Nire etxea kontrola dezaket kanpoan nagoenean?",
        "NEXUS-en hodei baten bidez ez: NEXUS-ek zure gailuekin zuzenean hitz egiten du zure etxeko sarean eta ez du errelerik. Kanpotik iristeko, jarri zure telefonoa edo ordenagailu eramangarria etxeko sarean VPN batekin, adibidez Tailscale (subnet router) edo WireGuard zure routerrean; orduan NEXUS etxean bezala funtzionatzen du. NEXUS-ek ez du oraindik hub-helbideen ezarpenik, beraz VPNak zure tokiko helbide-tartea eskuragarri egin behar du, eta gailu berrien bilaketak etxeko sarean bakarrik funtzionatzen du. Ez utzi inoiz gailu bat internetera irekita portu-birbidalketarekin. Urratsez urratseko gida biltegiko docs/REMOTE-ACCESS.md fitxategia da.",
      ],
      [
        "iPhonerako bertsiorik badago?",
        "Ez dago App Storeko aplikaziorik, NEXUS-ek ez baitu Apple Developer kontu ordaindurik erabiltzen. Mac batekin eta Apple ID doako batekin zure iPhonerako eraiki dezakezu (gida: docs/IOS-BUILD.md), eta argitalpen batek IPA sinatu gabe ere erants dezake, AltStorek edo Sideloadlyk zuretzat sina dezaketena; bide hori ez da oraindik benetako iPhone batean egiaztatu. Apple ID doakoak aplikazioa 7 egunera iraungitzen du, eta aplikazioa itxita dagoenean jakinarazpenak ez daude eskuragarri iOSen. Etxeko hub-a mahaigaineko aplikazioa da oraindik; iPhonea bezeroa da.",
      ],
      [
        "Nire gailua ez dago zerrendan. Zer egin dezaket?",
        "NEXUS-ek tokiko protokolo dokumentatua duten gailuak soilik onartzen ditu; hodeia soilik duten gailuak ez dira onartzen NEXUS-ek ez baitu inoiz fabrikatzailearen hodeiarekin hitz egiten. Bateragarritasun-zerrendak (docs/COMPATIBILITY.md) DIY moduko Sonoff, WiZ, LIFX, Govee (LAN) eta Wake-on-LAN ere barne hartzen ditu. Horietako bakoitzak protokolo-proba automatizatuak ditu, baina eredu bat egiaztatutzat jotzen da norbaitek benetako gailu batean funtzionatu zuela jakinarazten duenean bakarrik. Idatzi iezaguzu gune honetako harremanetarako formularioaren bidez (aukeratu “New Device / Connector Request”) edo posta elektronikoz: marka eta modeloa, zer espero zenuen eta zer gertatu zen. Zure benetako gailuan eredu batek funtzionatu zuela esateak egiaztatutzat markatzen du; ez sartu inoiz pasahitzik, tokiko gakorik edo tokenik.",
      ],
      [
        "Konturik behar al dut? Zer gertatzen da zerbitzaria erori bada?",
        "Bai: behin saioa hasten duzu doako posta elektronikoko kontu batekin NEXUS irekitzeko. Gero, gailuak kontrolatzea eta automatizazioak exekutatzea zure sarean gertatzen da eta internetik gabe funtzionatzen jarraitzen du. Kontuak gailuen arteko sinkronizazioa, Family eta AI laguntzailea gehitzen ditu, muga dituzten doako hodei-zerbitzuak erabiltzen dituztenak. Horietako bat eskuragarri ez dagoenean, adibidez Supabase proiektu doakoa astebete inguruko jarduerarik gabe gelditu denean, hodeiko pantailek zerbitzaria ez dagoela eskuragarri diote, zerbait gordeta dagoela erakutsi beharrean; gailuek, automatizazioek eta erretiluak funtzionatzen jarraitzen dute. AI kuota edo zerbitzua agortuta badago, laguntzaileak ezin izan duela erantzun esaten du.",
      ],
      [
        "Nire ezarpenen babeskopia egin eta beste gailu batera eraman al dezaket?",
        "Bai. Ezarpenetan babeskopia-atal bat dago, non zure ezarpenak eta automatizazioak JSON fitxategi batera esportatu eta beste gailu batean edo berrinstalatu ondoren inportatu ditzakezun. Pasahitzak, tokenak eta tokiko gakoak fitxategiko parekatutako gailuen zerrendatik kentzen dira, beraz berriro sartu itzazu leheneratu ondoren. Mantendu babeskopia-fitxategia pribatu.",
      ],
      [
        "Nire energia-datuak esporta ditzaket?",
        "Bai. Energia orriak zure gailuen azken benetako potentzia-irakurketak CSV edo JSON fitxategi gisa esporta ditzake. NEXUS-ek benetan potentzia jakinarazten duten gailuen datuak bakarrik ditu; bat ere parekatuta ez badago, ez dago esportatzeko ezer.",
      ],
      [
        "Zergatik ohartarazten dit Windowsek instalatzailea exekutatzean?",
        "Instalatu Microsoft Storetik eta ez duzu abisu hau ikusiko: Microsoftek pakete hori sinatzen du ziurtapenean eta eguneraketak Storetik bidaltzen ditu. .exe deskarga zuzena oraindik ez dago ziurtagiri komertzial batekin sinatuta, beraz SmartScreenek “argitaratzaile ezezaguna” erakutsi dezake. Fitxategia exekutatu aurretik deskargen atalean zerrendatutako egiaztatze-baturekin alderatu dezakezu. Gure kode-sinaduraren politika webguneko oinean dago estekatuta.",
      ],
    ],
  },
  about: {
    title: "NEXUS-i buruz",
    lead: "Plataforma independentea, tokiko-lehenengo etxe adimenduna, abiadura, pribatutasun absolutua eta benetako hardware-jabetzarako diseinatua. Zure gailuekin zuzenean zure etxeko sarean hitz eginez, NEXUS-ek betiko ezabatzen du hodeiaren mendekotasuna.",
    manifesto: {
      heading: "Zergatik eraiki dugun NEXUS",
      text: "Etxe adimenaren industria modernoak bide okerra hartu zuen. Ekosistema jabedunek etxe-jabeak derrigorrezko harpidetzetara, hodeiaren mendeko atzerapenera eta telemetria bidezko jarraipen intrusibora behartu zituzten. Zure interneteko konexioa erortzen denean, zure egongelako etengailuak ez luke funtzionatzeari utzi behar. NEXUS eraiki dugu uste dugulako zure etxea zure santutegia dela: zure oin-planoa, zure kamerek dituzten egoerak eta zure eguneroko familia-errutinak zure hardware propioan egon behar dute bakarrik.",
    },
    pillars: [
      {
        title: "Tokiko-lehenengo abiadura",
        desc: "Automatizazio eta komando guztiak zure LAN lokalean exekutatzen dira milisegundotan. Urruneko hodei-zerbitzarietara joan-etorririk ez, latentziarik ez.",
      },
      {
        title: "Pribatutasun konpromisorik gabea",
        desc: "Analitika-telemetriarik ez, portaera-profilik ez, eta zure errutina pribatuen salmentarik ez. Kontu bat behar da; zure konfigurazioa errenkada-mailako babesa duen zure kontuko errenkadan gordetzen da. Gailuen komandoak zure LANean geratzen dira oraindik.",
      },
      {
        title: "Fabrikatzailearen mendekotasunik ez",
        desc: "Protokolo lokal irekiak lehenik: Shelly, Philips Hue, ESPHome, Tasmota eta WLEDk zuzenean erantzuten diote NEXUS-i, eta beste guztia zure Home Assistant zerbitzariaren bidez batzen da fabrikatzailearen hodei baten ordez.",
      },
      {
        title: "SaaS zintzoa eta jasangarria",
        desc: "Etxe adimenaren oinarrizko kudeaketa guztiz doakoa eta mugagabea da betiko. NEXUS+ NEXUS AI plana da eta hodeiko erabilera hori estaltzen laguntzen du.",
      },
    ],
    architecture: {
      heading: "Fidagarritasunerako eraikia",
      lead: "NEXUS-ek mahaigaineko motor arina mantentzen du zure sistemaren erretiluan, ordutegiak eta sentsore-arauak ebaluatzen jarrai dezaten ordenagailua piztuta dagoen bitartean, eta mugikorreko aplikazioa zuzenean tokiko sare beraren gainean irekitzen da.",
      items: [
        {
          icon: "layers",
          title: "Mahaigaina",
          desc: "Windows, macOS eta Linux aplikazioak sistemaren erretiluan geratzen dira eta tokiko ordutegiak eta sentsore-arauak martxan mantentzen dituzte ordenagailua piztuta dagoen bitartean. Windows eta Linux instalatzaile prest gisa datoz; macOS iturburutik eraikitzen da (sinatu gabe: eskuineko klik → Open).",
        },
        {
          icon: "wifi",
          title: "Telefonoa",
          desc: "Android eta iOS aplikazioak tokiko sare berean irekitzen dira; gailuen komandoak zure LANetik joaten dira oraindik. Android APK sinatu gisa dator; iOS iturburutik eraikitzen da Xcode eta Apple ID doako batekin.",
        },
        {
          icon: "lock",
          title: "Kontua",
          desc: "Kontu bat behar da gelak, gailuak eta eszenak pantaila guztietan bat etor daitezen. Gailuen komandoak ez dira zure etxeko saretik ateratzen.",
        },
      ],
    },
    linksTitle: "Esteka praktikoak",
  },
  footer: {
    tagline:
      "Kontrolatu zure etxe adimendun osoa zuzenean zure tokiko sarean — fabrikatzailearen mendekotasunik gabe eta hodeirik gabe. Internetek huts egiten duenean ere, zure etxeak ez du inoiz gelditzen.",
    product: "Produktua",
    productLinks: [
      ["Ezaugarriak", "#features"],
      ["Prezioak", "#pricing"],
      ["Deskargatu", "#downloads"],
      ["Ohiko galderak", "#faq"],
      ["Honi buruz", "/about"],
    ],
    account: "Bezeroak eta laguntza",
    accountLinks: [
      ["Harremana eta laguntza teknikoa", "javascript:nxOpenContactModal('Technical Support')"],
      ["Bertsio-oharrak eta komunitatea", RELEASES_URL],
      ["Deskargatu aplikazioak", "#downloads"],
    ],
    legal: "Lege-informazioa",
    legalLinks: [
      ["Pribatutasuna", "/privacy"],
      ["Baldintzak", "/terms"],
      ["Itzulketak", "/refund"],
      ["Kode-sinadura", "/code-signing"],
      ["Lagundu", "/contribute"],
    ],
    rights: "Eskubide guztiak erreserbatuta.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
