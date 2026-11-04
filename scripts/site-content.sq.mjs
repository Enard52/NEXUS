import { RELEASES_URL } from "./site-constants.mjs";

export const sq = {
  "title": "NEXUS — Shtëpia juaj inteligjente, menaxhuar në rrjetin tuaj vetjak",
  "ogImageAlt": "Ekosistemi i shtëpisë inteligjente NEXUS në desktop dhe celular",
  "description": "NEXUS është një ekosistem shtëpie inteligjente i bazuar kryesisht në lokal për Windows, macOS, Linux, Android dhe iOS. Kontroll direkt i pajisjeve përmes rrjetit tuaj lokal, automatizime të përgjegjshme dhe metrika energjie në kohë reale. Falas përgjithmonë; plan i opsional NEXUS+.",
  "nav": [
    [
      "#features",
      "Karakteristikat"
    ],
    [
      "#how",
      "Si funksionon"
    ],
    [
      "#integrations",
      "Integrimet"
    ],
    [
      "#pricing",
      "Çmimet"
    ],
    [
      "#downloads",
      "Shkarko"
    ],
    [
      "#faq",
      "Shtëpi inteligjente kryesisht lokale"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Shtëpia juaj.",
    "h1a": "Nën tuaj kontroll në heshtje.",
    "h1b": "Quietly in your control.",
    "lead": "Një ekosistem i unifikuar për dritat, klimën, mbulesat dhe sensorët tuaj — duke komunikuar drejtpërdrejt me pajisjet në rrjetin tuaj lokal. Automatizime të përgjegjshme, matje të fuqisë në kohë reale, dhe kontroll që vazhdon të funksionojë kur interneti bie.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Versioni më i fundit",
    "shotAlt": "Ndërfaqja dhe qendra e kontrollit NEXUS",
    "trust": [
      "Pajisje falas, të pakufizuara",
      "Për kontroll nuk kërkohet cloud",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Infrastrukturë e fuqishme. Kontroll pa mundim.",
    "lead": "Gjendja e çdo pajisjeje, metrika e fuqisë, dhe skema e automatizuar funksionon direkt përmes rrjetit tuaj lokal pa varësi nga cloud-i i jashtëm.",
    "items": [
      [
        "zap",
        "Automatizime të përgjegjshme",
        "Skenarët e shkaktuar nga koha dhe perëndimi i diellit ekzekutohen drejtpërdrejt në harduerin tuaj lokal — duke vazhduar në mënyrë të besueshme në sfond në desktop."
      ],
      [
        "gauge",
        "Lexime të Energjisë në Kohë Reale",
        "Lexoni wattazhin dhe konsumimin e energjisë në kohë reale direkt nga prizat dhe çelësat e zgjuar të mbështetur në rrjetin tuaj lokal."
      ],
      [
        "wifi",
        "Shpejtësia e Rrjetit Lokal",
        "Komunikim i drejtpërdrejtë LAN mbi HTTP, TCP dhe UDP me markat e listuara nën Integrime. Asnjë kalim në cloud në rrugën e komandës."
      ],
      [
        "lock",
        "Privatësia sipas Dizajnit",
        "Konfigurimi i shtëpisë suaj dhe telemetria e pajisjes mbeten në harduerin tuaj lokal. Nevojitet një llogari për të përdorur NEXUS; ajo ruan konfigurimin tuaj në rreshtin tuaj nën kontrollin e qasjes në nivel rreshti. Komandat e pajisjes ende kalojnë përmes LAN-it tuaj."
      ],
      [
        "sparkles",
        "NEXUS AI Intelligence",
        "Komandat lokale të shtëpisë inteligjente janë të menjëhershme dhe falas përgjithmonë. Asistenti opsional i AI në cloud ofron sugjerime inteligjente sa herë që keni nevojë për udhëzime."
      ],
      [
        "layers",
        "Protokollet e Hapura Lokale",
        "Lidhësit e drejtpërdrejtë komunikojnë në LAN-in tuaj. Matter dhe Zigbee bashkohen përmes serverit tuaj të Home Assistant — seksioni Integrimet liston se cilët janë të drejtpërdrejtë dhe cilët janë të ndërlidhur."
      ]
    ]
  },
  "how": {
    "heading": "Nga shkarkimi deri te lidhja në minuta.",
    "steps": [
      [
        "1",
        "Instalo & hap",
        "Shkarko instaluesin vendas për platformën tënde (Windows, Linux, ose Android). Pastaj identifiko veten — kërkohet një llogari për të përdorur NEXUS, dhe gjithashtu sinkronizon konfigurimin në të gjitha ekranet tuaja."
      ],
      [
        "2",
        "Shto pajisjet tuaja",
        "Zgjidh markën tënde, skano rrjetin lokal ose fut një IP. Markat me një lidhës të drejtpërdrejtë përdorin protokollin e tyre — nuk ka cloud të furnizuesit në këtë rrugë."
      ],
      [
        "3",
        "Shijo shtëpinë tënde",
        "Skena, automatizime të planifikuara dhe leximet reale të energjisë — kontroll i unifikuar në desktop dhe celular."
      ]
    ]
  },
  "integrations": {
    "heading": "Funksionon me atë që tashmë ke.",
    "lead": "Së pari protokollet lokale falas. Çfarëdo pa një lidhës direkt funksionon ende përmes urës Home Assistant.",
    "groups": [
      [
        "HTTP lokal — në çdo platformë",
        [
          "Shelly Gen1 & Gen2+",
          "Tasmota",
          "WLED",
          "ESPHome",
          "Ura Philips Hue",
          "Home Assistant"
        ]
      ],
      [
        "Rrjeti lokal, pa llogari apo çelës — aplikacion desktop",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (modalitet DIY)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "Diçka mungon? Kërko një lidhës",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Falas për përdorim. NEXUS+ kur dëshiron më shumë",
    "lead": "",
    "currencyNote": "Çmimet në USD",
    "plans": [
      {
        "name": "Falas",
        "price": "$0",
        "period": "forever",
        "features": [
          "Pajisje dhe dhoma të pakufizuara në të gjitha protokollet lokale të mbështetura",
          "Pa varësi nga cloud: funksionon lokalisht në LAN-in tuaj",
          "30 komanda dhe veprime ditore NEXUS AI për pajisje",
          "Automatizime lokale të planifikuara & skena të personalizuara",
          "Sinkronizim llogarie me shumë pajisje (dhoma, pajisje, skena)",
          "100% privat: pa ndjekje, pa mbledhje të të dhënave"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "çdo muaj",
        "badge": "Më e popullarizuar",
        "features": [
          "Gjithçka në niveli Falas, plus:",
          "2,000 përgjigje NEXUS AI në muaj në vend të 30 në ditë",
          "Kërko NEXUS AI të vendosë skena dhe të përgjigjet në gjuhë të thjeshtë",
          "Një llogari, e vlefshme në çdo pajisje NEXUS",
          "Prova falas — 3 ditë mujore, 7 ditë vjetore; anulo në fund të periudhës"
        ],
        "cta": {
          "label": "Filloni provën tuaj falas",
          "monthlyLabel": "Filloni provën falas 3-ditore",
          "yearlyLabel": "Filloni provën falas 7-ditore",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Familjar",
        "price": "Falas",
        "period": "për të gjithë familjen",
        "badge": "E gjithë shtëpia",
        "features": [
          "Anëtarët e shtëpisë me qasje bazuar në role — pa kufi anëtarësh",
          "Rrole pronari, anëtari dhe mysafiri",
          "Kontroll për çdo anëtar, ftesa dhe lejet e cilësimeve",
          "Skena dhe automatizime sinkronizohen në pajisjet tuaja ku jeni kyçur",
          "Aktive në të gjithë ekosistemin (desktop dhe mobil)",
          "Plotësisht falas me shtëpinë tuaj"
        ],
        "cta": {
          "label": "Filloni me Familjen",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Anuloni në çdo kohë nga Blerjet në aplikacion ose nga llogaria juaj në këtë faqe. Anulimi hyn në fuqi në fund të periudhës aktuale."
  },
  "downloads": {
    "heading": "Originare në çdo desktop. Në shtëpi në telefonin tuaj.",
    "lead": "Gjithmonë falas. Çdo instalues shkon me një SHA-256 checksum të publikuar që mund ta verifikoni atë që instaloni.",
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
        "Debian dhe Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK e nënshkruar",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Versioni",
    "sizeLabel": "Madhësia",
    "webCard": {
      "title": "Një llogari, në të gjithë ekosistemin tuaj",
      "desc": "Programet për desktop Windows dhe Linux dhe aplikacioni Android. Kur jeni të kyçur, dhomat, pajisjet, skenat dhe automatizimet tuaja qëndrojnë të sinkronizuara pa probleme në të gjitha ekranet tuaja.",
      "cta": {
        "label": "Shkarkoni NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "Në Windows rruga më e lehtë është Microsoft Store: paketa është e nënshkruar nga Microsoft dhe përditësimet vijnë përmes Store. .exe direkt nuk është i nënshkruar, kështu që Windows mund të paralajmërojë për një “botues të panjohur” — shihni kontrollet e përmbledhjeve. Pyetjet e rëndësishme, të përgjigjura. A funksionon NEXUS plotësisht në rrjetin tim lokal?"
  },
  "faq": {
    "heading": "The important questions, answered.",
    "items": [
      [
        "Does NEXUS operate entirely on my local network?",
        "Po. NEXUS është ndërtuar mbi një arkitekturë strikte ‘local-first’. Pajisjet tuaja, dhomat, skenat dhe telemetria e sensorëve përpunohen drejtpërdrejt nëpërmjet harduerit tuaj të shtëpisë. Edhe gjatë prishjeve të internetit, të gjitha kontrollet lokale, ndriçimi dhe automatizimet funksionojnë pa probleme dhe me zero vonesë. Kyqja në mënyrë të sigurt sinkronizon cilësimet tuaja në të gjitha ekranet tuaja."
      ],
      [
        "A duhet të instaloj NEXUS, apo funksionon në shfletues?",
        "Instaloni programin për desktop (Windows ose Linux) ose aplikacionin për Android. NEXUS nuk ofrohet si aplikacion për shfletues. Komandat e pajisjes kalojnë përmes rrjetit tuaj lokal. Shelly, Philips Hue, ESPHome, Tasmota, WLED dhe Home Assistant përdorin HTTP lokal në programin për desktop dhe në Android. TP-Link Kasa dhe Yeelight kërkojnë TCP të drejtpërdrejtë, kështu që ata funksionojnë në programin për desktop. Ky faqe është për llogarinë, shkarkimet dhe faturimin."
      ],
      [
        "Çfarë shton plani NEXUS+?",
        "Kontrolli thelbësor i shtëpisë inteligjente—pajisje të pakufizuara, dhoma, automatizime offline dhe panele lokale—është falas. NEXUS+ përfshin gjithçka që ka Free, NEXUS AI për skena dhe pyetje në gjuhë të thjeshtë, 2,000 përgjigje në muaj, lidhje të avancuara për të shtuar pajisje Home Assistant, dhe një llogari në çdo pajisje, me një provë mujore prej 3 ditësh ose një provë vjetore prej 7 ditësh. Komandat e pajisjeve ende funksionojnë lokalisht. Roli i anëtarëve të shtëpisë përfshihet me shtëpinë tuaj pa kosto shtesë."
      ],
      [
        "Cilës llogarie i përket abonimi im NEXUS+?",
        "Adresa e emailit e përdorur gjatë pagesës. Identifikohu në këtë faqje ose në aplikacion para se të paguash: faqja e pagesës pastaj hapet me emailin e llogarisë tënd të plotësuar, dhe abonimi shfaqet në çdo pajisje ku identifikohesh. NEXUS+ nuk mund të blihet pa një llogari. Nëse paguan me një email tjetër, abonimi ruhet nën atë email dhe nuk do të shfaqet në llogarinë tënde deri sa të identifikohesh me të."
      ],
      [
        "Si funksionojnë automatizimet dhe rregullat e planifikuara?",
        "Motorri i automatizimit NEXUS vlerëson oraret dhe rregullat e sensorëve tuaj në pajisjen që vazhdoni të përdorni — aplikacioni në desktop qëndron në shiritin e sistemit dhe ekzekutohet gjatë gjithë kohës, kështu që rutinat e ndriçimit, energjisë dhe sigurisë nuk presin kurrë për një cloud. Skena dhe tajmerët e shtyrë nga telefoni juaj aplikohen menjëherë mbi LAN-in tuaj. Ngjarjet e reja shpërndahen tek kanalet e njoftimeve që aktivizoni në faqen Njoftime Instant: shiriti brenda aplikacionit, njoftimet e sistemit, ntfy, Telegram, ose webhook-u juaj HTTPS."
      ],
      [
        "Cilat pajisje dhe ekosisteme mbështeten?",
        "NEXUS flet me protokollin lokal të secilës pajisje: Shelly (Gen1 dhe Gen2+), Tasmota, WLED, ESPHome, Philips Hue dhe Home Assistant përmes HTTP lokal në çdo platformë, plus TP-Link Kasa, Yeelight, WiZ, Sonoff (modalitet DIY) dhe Wake-on-LAN përmes rrjetit lokal në aplikacionin për desktop, pa nevojën për llogari ose çelës. Të gjitha të tjerat — pajisje Matter ose Zigbee — bashkohen përmes serverit tuaj Home Assistant, të cilin NEXUS e trajton si një qendër lokale të vetme. Zbulimi lokal i IP-së lidh pajisjet menjëherë, pa ndonjë cloud të furnizuesit në mes."
      ],
      [
        "Si integrohen kamerat e sigurisë dhe sensorët?",
        "NEXUS bashkon kamerat tuaja të sigurisë, detektorët e lëvizjes dhe sensorët e hyrjes në një panel qendror sigurie. Mund të automatizoni mënyrat e privatësisë, të aktivizoni rutina të mbikëqyrjes kur lini shtëpinë, dhe të shihni çdo lëvizje ose ngjarje kontakti në aplikacion — plus në kanalet e njoftimit që aktivizoni (njoftimet e sistemit, ntfy, Telegram, ose webhook-un tuaj)."
      ],
      [
        "A mund të anuloj NEXUS+ në çdo kohë?",
        "Po, krejtësisht pa telashe dhe pa angazhime. Mund të anuloni me një klikim në çdo kohë: nga cilësimet e Llogarisë & Pagesave në aplikacion, përmes faqes tonë të internetit, ose direkt nga lidhja e porosisë në faturën tuaj me email. Përfitimet tuaja premium mbeten aktive deri në fund të ciklit tuaj të faturimit pa asnjë pagesë të ardhshme. A mund ta kontrolloj shtëpinë time kur jam larg?"
      ],
      [
        "Can I control my home when I am away?",
        "Jo përmes një reje NEXUS: NEXUS komunikon drejtpërdrejt me pajisjet tuaja në rrjetin tuaj shtëpiak dhe nuk ka ndonjë përçues. Për t'ia arritur nga jashtë, vendosni telefonin ose laptopin tuaj në rrjetin shtëpiak me një VPN si Tailscale (router subneti) ose WireGuard në router-in tuaj; NEXUS pastaj funksionon saktësisht siç funksionon në shtëpi. NEXUS ende nuk ka një cilësim të adresës së qendrës, prandaj VPN duhet ta bëjë të arritshme gamën e adresave lokale, dhe skanimi për pajisje të reja funksionon vetëm në rrjetin shtëpiak. Mos e ekspozoni kurrë një pajisje në internet me përparim porti. Udhëzimi hap-pas-hapi është docs/REMOTE-ACCESS.md në depo."
      ],
      [
        "A ka një version për iPhone? Nuk ka një aplikacion në App Store, sepse NEXUS nuk përdor një llogari të paguar të Apple Developer. Me një Mac dhe një Apple ID falas, mund ta ndërtoni për iPhone-in tuaj (udhëzues: docs/IOS-BUILD.md), dhe një version publik mund gjithashtu të bashkëngjisë një IPA të pasignuar që AltStore ose Sideloadly mund ta nënshkruajnë për ju; ky rrugë nuk është verifikuar ende në një iPhone të vërtetë. Një Apple ID falas skadon aplikacionin pas 7 ditësh, dhe njoftimet ndërkohë që aplikacioni është i mbyllur nuk janë të disponueshme në iOS. Qendra home mbetet ende aplikacioni për desktop; iPhone është një klient. Pajisja ime nuk është në listë. Çfarë mund të bëj?",
        "There is no App Store app, because NEXUS does not use a paid Apple Developer account. With a Mac and a free Apple ID you can build it for your own iPhone (guide: docs/IOS-BUILD.md), and a release may also attach an unsigned IPA that AltStore or Sideloadly can sign for you; that path has not been verified on a real iPhone yet. A free Apple ID expires the app after 7 days, and notifications while the app is closed are not available on iOS. The home hub is still the desktop app; the iPhone is a client."
      ],
      [
        "My device is not on the list. What can I do?",
        "NEXUS mbështet vetëm pajisjet me një protokoll lokal të dokumentuar; pajisjet që përdorin vetëm cloud nuk mbështeten sepse NEXUS kurrë nuk komunikon me cloud-in e një furnizuesi. Lista e kompatibilitetit (docs/COMPATIBILITY.md) përfshin gjithashtu Sonoff në mënyrën DIY, WiZ, LIFX, Govee (LAN) dhe Wake-on-LAN. Secila prej tyre ka teste të automatizuara të protokollit, por një model konsiderohet i verifikuar vetëm kur dikush raporton që ka funksionuar në një pajisje reale. Na shkruani përmes formularit të kontaktit në këtë faqe (zgjidhni “New Device / Connector Request”) ose me e-mail: marka dhe modeli, çfarë prisnit dhe çfarë ndodhi. Tregimi që një model ka funksionuar në pajisjen tuaj reale është ajo që e bën të verifikuar; kurrë mos përfshini fjalëkalime, çelësa lokalë ose tokena."
      ],
      [
        "A më nevojitet një llogari? Çfarë ndodh nëse shërbimi është ndërprerë?",
        "Po: ju hyni një herë me një llogari falas emaili për të hapur NEXUS. Pas kësaj, kontrolli i pajisjeve dhe ekzekutimi i automatizmave ndodh në rrjetin tuaj dhe vazhdon të funksionojë pa internet. Llogaria shton sinkronizim në pajisjet tuaja, Familjen dhe asistentin AI, të cilët përdorin shërbime falas cloud me kufij. Kur një prej tyre nuk është i disponueshëm, për shembull kur projekti falas Supabase është ndalur pas rreth një jave pa aktivitet, ekranet cloud thonë se serveri nuk është i arritshëm në vend që të tregojnë diçka si e ruajtur; pajisjet, automatizmat dhe tryeza vazhdojnë të funksionojnë. Nëse kuota ose shërbimi AI është shteruar, asistenti thotë se nuk mundi të përgjigjej."
      ],
      [
        "A mund të bëj një kopje rezervë të cilësimeve të mia dhe t’i transferoj në një pajisje tjetër?",
        "Po. Cilësimet kanë një seksion të kopjes rezervë ku mund të eksportoni cilësimet dhe automatizimet tuaja në një skedar JSON dhe ta importoni në një pajisje tjetër ose pas një instalimi të ri. Fjalëkalimet, tokenët dhe çelësat lokalë hiqen nga lista e pajisjeve të çiftuara në skedar, kështu që rivendosini pasi të keni rikthyer. Mbajeni skedarin e kopjes rezervë privat."
      ],
      [
        "A mund të eksportoj të dhënat e mia të energjisë?",
        "Po. Faqja e Energjisë mund të eksportojë të dhënat më të fundit të fuqisë reale nga pajisjet tuaja si një skedar CSV ose JSON. NEXUS ka të dhëna vetëm për pajisjet që me të vërtetë raportojnë fuqi; pa asnjë të lidhur, nuk ka asgjë për të eksportuar."
      ],
      [
        "Pse më paralajmëron Windows kur ekzekutoj instaluesin?",
        "Instaloni nga Microsoft Store dhe nuk do të shihni këtë paralajmërim: Microsoft nënshkruan atë paketë gjatë certifikimit dhe ofron përditësime përmes Store-it. Shkarkimi i drejtpërdrejtë .exe ende nuk është nënshkruar me një certifikatë komerciale, kështu që SmartScreen mund të tregojë “publikues i panjohur”. Ju mund të krahasoni skedarin me kontrollimet e përmendura në seksionin e shkarkimeve para se ta ekzekutoni. Politika jonë e nënshkrimit të kodit lidhet nga futbolli i faqes."
      ]
    ]
  },
  "about": {
    "title": "Rreth NEXUS",
    "lead": "Një platformë e pavarur për shtëpi të mençura, e fokusuar fillimisht në vend dhe e dizajnuar për shpejtësi, privatësi absolute dhe pronësi të vërtetë të pajisjeve. Duke komunikuar drejtpërdrejt me pajisjet tuaja përmes rrjetit tuaj të brendshëm, NEXUS eliminon përgjithmonë varësinë nga cloud-i.",
    "manifesto": {
      "heading": "Pse Ndërtuam NEXUS",
      "text": "Industria moderne e shtëpive inteligjente mori një drejtim të gabuar. Ekosistemet pronësore detyruan pronarët e shtëpive të hynin në abonime të detyrueshme, vonesa të vare nga cloud-i dhe ndjekje invazive të telemetrisë. Kur lidhja juaj në internet bie, çelësi i dhomës suaj të ndenjjes nuk duhet të ndalojë së funksionuari. Ne krijuam NEXUS sepse besojmë se shtëpia juaj është një shtegtim: planimetri juaj, gjendjet e kamerave tuaja dhe rutinat e përditshme familjare i përkasin vetëm pajisjeve tuaja."
    },
    "pillars": [
      {
        "title": "Shpejtësia e Parë Lokale",
        "desc": "Çdo automatizim dhe komandë ekzekutohet mbi LAN-in tuaj lokal në milisekonda. Pa udhëtime në serverë të largët cloud, zero vonesë."
      },
      {
        "title": "Privatësi Pa Kompromise",
        "desc": "Asnjë telemetri analitike, asnjë profilizim i sjelljes, dhe asnjë shitje e rutinave tuaja private. Kërkohet një llogari; konfigurimi juaj ruhet në rreshtin tuaj të mbrojtur me nivel rreshti të llogarisë. Komandat e pajisjes mbeten ende në LAN-in tuaj."
      },
      {
        "title": "Pa Bllokim nga Ofruesi",
        "desc": "Protokollet lokale të hapura së pari: Shelly, Philips Hue, ESPHome, Tasmota dhe WLED përgjigjen drejtpërdrejt NEXUS-it, dhe çdo gjë tjetër bashkohet përmes serverit tuaj të Home Assistant në vend të një cloud-i të ofruesit."
      },
      {
        "title": "SaaS i Ndershëm dhe i Qëndrueshëm",
        "desc": "Menaxhimi themelor i shtëpisë inteligjente është plotësisht falas dhe i pakufizuar përgjithmonë. NEXUS+ është plani NEXUS AI dhe ndihmon në mbulimin e përdorimit të atij cloud-i."
      }
    ],
    "architecture": {
      "heading": "Projektuar për Besueshmëri",
      "lead": "NEXUS mban një motor të lehtë desktopi në shiritin e sistemit tuaj në mënyrë që oraret dhe rregullat e sensorëve të vazhdojnë të ekzaminohen ndërsa kompjuteri juaj është i ndezur, dhe aplikacioni mobil hapet direkt në të njëjtin rrjet lokal.",
      "items": [
        {
          "icon": "layers",
          "title": "Desktop",
          "desc": "Aplikacionet për Windows, macOS dhe Linux qëndrojnë në shiritin e sistemit dhe mbajnë të ekzekutohen oraret lokale dhe rregullat e sensorëve ndërsa kompjuteri është i ndezur. Windows dhe Linux dërgohen si instalues të gatshëm; macOS ndërtohet nga burimi (i pa-nënshkruar: klikoni me të djathtën → Open)."
        },
        {
          "icon": "wifi",
          "title": "Telefon",
          "desc": "Aplikacionet Android dhe iOS hapen në të njëjtin rrjet lokal; komandat e pajisjeve kalojnë akoma përmes LAN-it tuaj. Android vjen si APK e nënshkruar; iOS ndërtohet nga burimi me Xcode dhe një Apple ID falas."
        },
        {
          "icon": "lock",
          "title": "Llogaria",
          "desc": "Kërkohet një llogari në mënyrë që dhomat, pajisjet dhe skenat të përputhen në çdo ekran. Komandat e pajisjeve nuk largohen nga rrjeti juaj i shtëpisë."
        }
      ]
    },
    "linksTitle": "Lidhje praktike"
  },
  "footer": {
    "tagline": "Kontrolloni të gjithë shtëpinë inteligjente direkt mbi rrjetin tuaj lokal — pa asnjë bllokim nga furnizuesi dhe pa varësi nga cloud-i. Edhe kur interneti fiket, shtëpia juaj nuk ndalet asnjëherë.",
    "product": "Produkti",
    "productLinks": [
      [
        "Veçori",
        "#features"
      ],
      [
        "Çmimet",
        "#pricing"
      ],
      [
        "Shkarko",
        "#downloads"
      ],
      [
        "Pyetje të Shpeshta",
        "#faq"
      ],
      [
        "Rreth",
        "/about"
      ]
    ],
    "account": "Klienti & Mbështetja",
    "accountLinks": [
      [
        "Kontakt & Mbështetje Teknike",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Shënime Për Lirimin & Komuniteti",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "Shkarkoni Aplikacionet",
        "#downloads"
      ]
    ],
    "legal": "Ligjor",
    "legalLinks": [
      [
        "Privatësi",
        "/privacy"
      ],
      [
        "Kushtet",
        "/terms"
      ],
      [
        "Rimbursime",
        "/refund"
      ],
      [
        "Nënshkrimi i Kodit",
        "/code-signing"
      ],
      [
        "Kontribuoni",
        "/contribute"
      ]
    ],
    "rights": "Të gjitha të drejtat e rezervuara.",
    "langSwitchLabel": "Turqisht",
    "langSwitchHref": "/tr/"
  }
};
