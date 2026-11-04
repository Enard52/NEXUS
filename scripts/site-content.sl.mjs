import { RELEASES_URL } from "./site-constants.mjs";

export const sl = {
  "title": "NEXUS — Vaš pametni dom, upravljan v vašem lastnem omrežju",
  "ogImageAlt": "NEXUS ekosistem pametnega doma na namizju in mobilnih napravah",
  "description": "NEXUS je ekosistem pametnega doma, ki daje prednost lokalnemu omrežju, za Windows, macOS, Linux, Android in iOS. Neposredna kontrola naprav preko vašega lokalnega omrežja, odzivne avtomatizacije in prikaz v realnem času porabe energije. Vedno brezplačno; opcijski NEXUS+ paket.",
  "nav": [
    [
      "#features",
      "Značilnosti"
    ],
    [
      "#how",
      "Kako deluje"
    ],
    [
      "#integrations",
      "Integracije"
    ],
    [
      "#pricing",
      "Cenik"
    ],
    [
      "#downloads",
      "Prenesi"
    ],
    [
      "#faq",
      "Pogosta vprašanja"
    ]
  ],
  "navCta": null,
  "hero": {
    "eyebrow": "Pametni dom z lokalno prednostjo",
    "h1a": "Vaš dom.",
    "h1b": "Tiho pod vašo kontrolo.",
    "lead": "Enoten ekosistem za vašo razsvetljavo, klimatske naprave, pokrove in senzorje — ki komunicira neposredno z napravami na vašem lokalnem omrežju. Odzivne avtomatizacije, merjenje moči v realnem času in nadzor, ki deluje tudi, ko internet ne deluje.",
    "primary": {
      "label": "Windows · Linux · Android",
      "href": "#downloads"
    },
    "secondary": null,
    "versionNote": "Najnovejša različica",
    "shotAlt": "Vmesnik in kontrolni center NEXUS",
    "trust": [
      "Brezplačno, neomejeno število naprav",
      "Za nadzor ni potreben oblak",
      "Windows · Linux · Android"
    ]
  },
  "features": {
    "heading": "Močna infrastruktura. Enostaven nadzor.",
    "lead": "Vsako stanje naprave, meritev porabe in avtomatiziran prizor deluje neposredno po vašem lokalnem omrežju brez odvisnosti od zunanjega oblaka.",
    "items": [
      [
        "zap",
        "Odzivne avtomatizacije",
        "Scenariji, sproženi po času in sončnem zahodu, se izvajajo neposredno na vaši lokalni strojni opremi — zanesljivo nadaljujejo v ozadju na namizju."
      ],
      [
        "gauge",
        "Sporočila o porabi energije v živo",
        "Preberite trenutno moč in porabo energije neposredno iz podprtih pametnih vtičnic in stikal na vaši lokalni mreži."
      ],
      [
        "wifi",
        "Hitrost lokalnega omrežja",
        "Neposredna LAN komunikacija preko HTTP, TCP in UDP z blagovnimi znamkami, navedenimi v Integracijah. Brez skoka v oblak v poti ukaza."
      ],
      [
        "lock",
        "Zasebnost po zasnovi",
        "Konfiguracija vašega doma in telemetrija naprav ostaneta na vaši lokalni strojni opremi. Račun je potreben za uporabo NEXUS-a; shranjuje vašo nastavitev v vaši lastni vrstici pod nadzorom dostopa na ravni vrstic. Ukazi naprav še vedno potujejo preko vašega LAN-a."
      ],
      [
        "sparkles",
        "NEXUS AI Inteligenca",
        "Lokalni ukazi pametnega doma so takojšnji in vedno brezplačni. Izbirni oblačni AI asistent nudi pametne predloge kadarkoli potrebujete pomoč."
      ],
      [
        "layers",
        "Odprti lokalni protokoli",
        "Neposredne povezave komunicirajo preko vašega LAN-a. Matter in Zigbee se povežeta preko vašega lastnega Home Assistant strežnika — razdelek Integracije navaja, kaj je neposredno in kaj preko mostu."
      ]
    ]
  },
  "how": {
    "heading": "Od prenosa do povezave v nekaj minutah.",
    "steps": [
      [
        "1",
        "Namesti in odpri",
        "Prenesite lasten namestitveni program za vašo platformo (Windows, Linux ali Android). Nato se prijavite — za uporabo NEXUS-a je potreben račun, ki prav tako sinhronizira nastavitve med vašo zasloni."
      ],
      [
        "2",
        "Dodajte svoje naprave",
        "Izberite svojo blagovno znamko, preglejte lokalno omrežje ali vnesite IP. Blagovne znamke z neposrednim priključkom uporabljajo svoj protokol — brez oblaka proizvajalca v tej poti."
      ],
      [
        "3",
        "Uživajte v svojem domu",
        "Scene, načrtovane avtomatizacije in dejanske meritve energije — združeno upravljanje na namizju in mobilnih napravah."
      ]
    ]
  },
  "integrations": {
    "heading": "Deluje z obstoječo opremo.",
    "lead": "Brezplačno, najprej lokalni protokoli. Vse, kar nima neposredne povezave, še vedno deluje preko Home Assistant mostu.",
    "groups": [
      [
        "Lokalni HTTP — na vseh platformah",
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
        "Lokalno omrežje, brez računa ali ključa — namizna aplikacija",
        [
          "TP-Link Kasa",
          "Yeelight",
          "WiZ",
          "Sonoff (DIY način)",
          "Wake-on-LAN"
        ]
      ]
    ],
    "more": "Nekaj manjka? Zahtevajte konektor",
    "moreHref": "javascript:nxOpenContactModal('Connector Request')"
  },
  "pricing": {
    "heading": "Brezplačno za uporabo. NEXUS+, ko želite več",
    "lead": "",
    "currencyNote": "Cene v USD",
    "plans": [
      {
        "name": "Brezplačno",
        "price": "$0",
        "period": "forever",
        "features": [
          "Neomejeno število naprav in sob preko vseh podprtih lokalnih protokolov",
          "Brez odvisnosti od oblaka: deluje lokalno v vašem lastnem LAN-u",
          "30 dnevnih ukazov NEXUS AI in akcij naprav",
          "Načrtovane lokalne avtomatizacije in po meri ustvarjene scene",
          "Sinhronizacija računov med več napravami (sobe, naprave, scene)",
          "100 % zasebno: brez sledenja, brez zbiranja podatkov"
        ],
        "cta": {
          "label": "Windows · Linux · Android",
          "href": "#downloads"
        }
      },
      {
        "name": "NEXUS+",
        "price": null,
        "period": "na mesec",
        "badge": "Najbolj priljubljeno",
        "features": [
          "Vse v brezplačnem paketu, plus:",
          "2.000 NEXUS AI odgovorov na mesec namesto 30 na dan",
          "Prosite NEXUS AI, naj nastavi scene in odgovarja v navadnem jeziku",
          "En račun, veljaven na vsaki NEXUS napravi",
          "Brezplačna preizkusna različica — 3 dni mesečno, 7 dni letno; preklic ob koncu obdobja"
        ],
        "cta": {
          "label": "Začnite brezplačno preizkusno različico",
          "monthlyLabel": "Začnite 3-dnevno brezplačno preizkusno različico",
          "yearlyLabel": "Začnite 7-dnevno brezplačno preizkusno različico",
          "href": "https://whop.com/checkout/plan_HIySYESquBqlg",
          "yearlyHref": "https://whop.com/checkout/plan_XlA3SacShoiJU"
        }
      },
      {
        "name": "Družina",
        "price": "Brezplačno",
        "period": "za celotno družino",
        "badge": "Celoten dom",
        "features": [
          "Člani gospodinjstva z dostopom na podlagi vlog — brez omejitve števila članov",
          "Vloge lastnika, člana in gosta",
          "Nadzor, povabila in dovoljenja za nastavitve po posameznem članu",
          "Sinhronizacija prizorov in avtomatizacij med vašimi lastnimi prijavljenimi napravami",
          "Aktivno v celotnem ekosistemu (namizje in mobilno)",
          "Popolnoma brezplačno z vašim domom"
        ],
        "cta": {
          "label": "Začnite z Družino",
          "href": "#downloads"
        },
        "soon": false
      }
    ],
    "manageNote": "Kadarkoli prekličete v razdelku »Plačevanje« v aplikaciji ali prek svojega računa na tej strani. Prekinitev začne veljati ob koncu trenutnega obdobja."
  },
  "downloads": {
    "heading": "Nativno na vsakem namizju. Doma na vašem telefonu.",
    "lead": "Vedno brezplačno. Vsak namestitveni program je opremljen z objavljeno SHA-256 kontrolno vsoto, tako da lahko preverite, kaj nameščate.",
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
        "Debian in Ubuntu · .deb",
        "NEXUS-linux.deb",
        ".deb"
      ],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · podpisana APK",
        "NEXUS-Android.apk",
        ".apk"
      ]
    ],
    "versionLabel": "Različica",
    "sizeLabel": "Velikost",
    "webCard": {
      "title": "En račun, v celotnem ekosistemu",
      "desc": "Namizni programi za Windows in Linux ter Android aplikacija. Ko ste prijavljeni, so vaše sobe, naprave, scene in avtomatizacije brezhibno sinhronizirane prek vseh vaših zaslonov.",
      "cta": {
        "label": "Prenesite NEXUS",
        "href": "#downloads"
      }
    },
    "smartScreenNote": "V sistemu Windows je najlažja pot Microsoftova trgovina: paket je podpisan s strani Microsofta in posodobitve pridejo preko trgovine. Neposredna datoteka .exe ni podpisana, zato lahko Windows opozori na „neznanega založnika“ — glejte kontrolne vsote."
  },
  "faq": {
    "heading": "Pomembna vprašanja, odgovori.",
    "items": [
      [
        "Ali NEXUS deluje popolnoma na mojem lokalnem omrežju?",
        "Ja. NEXUS je zasnovan na strogi arhitekturi, ki temelji predvsem na lokalnem delovanju. Vaše naprave, sobe, scene in telemetrija senzorjev se obdelujejo neposredno na vaši lastni domači strojni opremi. Tudi med izpadi interneta vsa lokalna upravljanja, svetlobni sistemi in avtomatizacije nadaljujejo delovanje brez zamika. Varnostna prijava sinhronizira vaše nastavitve na vseh vaših zaslonih. Ali moram namestiti NEXUS ali deluje v brskalniku?"
      ],
      [
        "Do I need to install NEXUS, or does it run in the browser?",
        "Namestite namizni program (Windows ali Linux) ali aplikacijo za Android. NEXUS ni na voljo kot brskalniška aplikacija. Naročila naprav potekajo preko vašega lastnega lokalnega omrežja. Shelly, Philips Hue, ESPHome, Tasmota, WLED in Home Assistant uporabljajo lokalni HTTP v namiznem programu in na Androidu. TP-Link Kasa in Yeelight potrebujejo surovi TCP, zato tečejo v namiznem programu. Ta stran je za račun, prenose in obračune."
      ],
      [
        "Kaj dodaja načrt NEXUS+?",
        "Osnovno upravljanje pametnega doma—neomejeno naprav, sob, avtomatizacij brez povezave in lokalnih nadzornih plošč—je brezplačno. NEXUS+ vključuje vse v brezplačni različici, NEXUS AI za prizore in vprašanja v naravnem jeziku, 2.000 odgovorov na mesec, napredne povezave za dodajanje naprav Home Assistant in en račun na vsaki napravi, z 3-dnevno mesečno ali 7-dnevno letno preizkusno različico. Ukazi za naprave se še vedno izvajajo lokalno. Družinske vloge so vključene z vašim domom brez dodatnih stroškov."
      ],
      [
        "Kateremu računu pripada moja naročnina NEXUS+?",
        "E-poštni naslov, uporabljen ob odjavi. Prijavite se na tej strani ali v aplikaciji, preden plačate: odjava se nato odpre z izpolnjenim e-poštnim naslovom vašega računa, naročnina pa se prikaže na vsaki napravi, na katero se prijavite. NEXUS+ ni mogoče kupiti brez računa. Če plačate z drugim e-poštnim naslovom, se naročnina shrani pod tem e-poštnim naslovom in se ne bo prikazala na vašem računu, dokler se z njim ne prijavite."
      ],
      [
        "Kako delujejo avtomatizacije in načrtovana pravila?",
        "Avtomatizacijski motor NEXUS ocenjuje vaše urnike in pravila senzorjev na napravi, ki jo imate vedno vklopljeno — namizna aplikacija ostane v sistemski vrstici in deluje ves čas, tako da se osvetlitev, energetske in varnostne rutine nikoli ne zanašajo na oblak. Scene in časovniki, sproženi iz vašega telefona, se takoj uveljavijo prek vašega LAN-a. Novi dogodki se širijo na obvestitvene kanale, ki jih omogočite na strani Instant Notifications: trak v aplikaciji, sistemska obvestila, ntfy, Telegram ali vaš lastni HTTPS webhook. Katere naprave in ekosistemi so podprti?"
      ],
      [
        "Which devices and ecosystems are supported?",
        "NEXUS govori lastni lokalni protokol vsake naprave: Shelly (Gen1 in Gen2+), Tasmota, WLED, ESPHome, Philips Hue in Home Assistant preko lokalnega HTTP na vseh platformah, poleg tega TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY način) in Wake-on-LAN preko lokalnega omrežja v namizni aplikaciji, brez računa ali ključa. Vse drugo — naprave Matter ali Zigbee — se povežejo preko vašega lastnega Home Assistant strežnika, ki ga NEXUS obravnava kot en sam lokalni hub. Lokalno odkrivanje IP naslovov poveže naprave takoj, brez vmesnega oblaka proizvajalca. Kako so integrirane varnostne kamere in senzorji?"
      ],
      [
        "How are security cameras and sensors integrated?",
        "NEXUS združuje vaše varnostne kamere, senzorje gibanja in senzorje vhodov v centralizirano nadzorno ploščo za varnost. Lahko avtomatizirate zasebne načine, aktivirate nadzorne rutine ob odhodu od doma in vidite vsak gib ali dogodek stika v aplikaciji — poleg tega pa na obvestilnih kanalih, ki jih omogočite (sistemska obvestila, ntfy, Telegram ali vaš lastni webhook)."
      ],
      [
        "Ali lahko kadar koli prekličem NEXUS+",
        "Da, popolnoma brez težav in brez kakršnih koli obveznosti. Preklic lahko izvedete z enim klikom kadarkoli: v nastavitvah Račun in obračun v aplikaciji, preko naše spletne strani ali neposredno preko povezave za naročilo v prejemku obračuna po e-pošti. Vaše premium koristi ostanejo aktivne do konca vašega obračunskega obdobja brez prihodnjih stroškov."
      ],
      [
        "Ali lahko nadzorujem svoj dom, ko sem odsoten?",
        "Ne preko NEXUS oblaka: NEXUS komunicira z vašimi napravami neposredno na vašem domačem omrežju in nima relaya. Če mu želite dostopati od zunaj, povežite telefon ali prenosnik z domačim omrežjem preko VPN, kot sta Tailscale (subnet router) ali WireGuard na vašem usmerjevalniku; NEXUS potem deluje točno tako, kot doma. NEXUS še nima nastavitve hub-naslova, zato mora VPN omogočiti dostop do lokalnega naslovenega območja, in iskanje novih naprav deluje le v domačem omrežju. Nikoli ne izpostavljajte naprave internetu preko posredovanja vrat. Vodnik po korakih je docs/REMOTE-ACCESS.md v repozitoriju."
      ],
      [
        "Ali obstaja različica za iPhone?",
        "Aplikacije za App Store ni, ker NEXUS ne uporablja plačanega Apple Developer računa. Z Mac računalnikom in brezplačnim Apple ID-jem ga lahko sestavite za svoj iPhone (navodila: docs/IOS-BUILD.md), in različica za izdajo lahko vsebuje tudi nepodpisan IPA, ki ga lahko AltStore ali Sideloadly podpišeta za vas; ta pot še ni bila preverjena na pravem iPhoneu. Brezplačni Apple ID poteče po 7 dneh, obvestila medtem ko je aplikacija zaprta, pa na iOS niso na voljo. Osrednja enota doma je še vedno namizna aplikacija; iPhone je odjemalec."
      ],
      [
        "Moj naprava ni na seznamu. Kaj lahko storim?",
        "NEXUS podpira samo naprave z dokumentiranim lokalnim protokolom; naprave, ki delujejo samo preko oblaka, niso podprte, ker NEXUS nikoli ne komunicira z oblakom proizvajalca. Seznam združljivosti (docs/COMPATIBILITY.md) vključuje tudi Sonoff v DIY načinu, WiZ, LIFX, Govee (LAN) in Wake-on-LAN. Za vsakega od teh so na voljo avtomatizirani preizkusi protokola, vendar se model šteje za preverjen šele, ko nekdo poroča, da je deloval na dejanski napravi. Pišite nam preko kontaktnega obrazca na tej strani (izberite „New Device / Connector Request“) ali po e-pošti: znamka in model, kaj ste pričakovali in kaj se je zgodilo. Sporočitev, da je model deloval na vaši dejanski napravi, ga označi kot preverjenega; nikoli ne vključujte gesel, lokalnih ključev ali žetonov."
      ],
      [
        "Ali potrebujem račun? Kaj se zgodi, če strežnik ne deluje?",
        "Da: enkrat se prijavite z brezplačnim e-poštnim računom, da odprete NEXUS. Po tem nadzorovanje naprav in izvajanje avtomatizacij poteka v vašem lastnem omrežju in deluje brez interneta. Račun omogoča sinhronizacijo med vašimi napravami, Družino in AI pomočnikom, ki uporabljajo brezplačne oblačne storitve z omejitvami. Ko ena od teh ni na voljo, na primer, ko je brezplačni projekt Supabase po približno tednu dni brez aktivnosti začasno ustavljen, oblačni zasloni prikažejo, da strežnika ni mogoče doseči, namesto da bi pokazali nekaj kot shranjeno; naprave, avtomatizacije in pladenj še naprej delujejo. Če je kvota ali storitev AI porabljena, pomočnik sporoči, da ni mogel odgovoriti."
      ],
      [
        "Ali lahko varnostno kopiram svoje nastavitve in jih prenesem na drugo napravo? Da. Nastavitve imajo razdelek za varnostno kopiranje, kjer lahko izvozite svoje nastavitve in avtomatizacije v datoteko JSON in jo uvozite na drugo napravo ali po ponovni namestitvi. Gesla, žetoni in lokalni ključi so odstranjeni s seznama povezanih naprav v datoteki, zato jih po obnovitvi znova vnesite. Datoteko varnostne kopije obdržite zasebno. Ali lahko izvozim svoje podatke o energiji?",
        "Yes. Settings has a backup section where you can export your settings and automations to a JSON file and import it on another device or after a reinstall. Passwords, tokens and local keys are stripped from the paired device list in the file, so re-enter them after restoring. Keep the backup file private."
      ],
      [
        "Can I export my energy data?",
        "Da. Stran Energija lahko izvozi najnovejše meritve dejanske moči vaših naprav kot CSV ali JSON datoteko. NEXUS ima podatke samo za naprave, ki dejansko poročajo o moči; če ni povezanih naprav, ni ničesar za izvoz."
      ],
      [
        "Zakaj me Windows opozori, ko zaženem namestitveni program?",
        "Namestite iz Microsoft Store in ne boste videli tega opozorila: Microsoft ta paket med certificiranjem podpiše in posodablja prek Store. Neposredna .exe datoteka še ni podpisana s komercialnim certifikatom, zato lahko SmartScreen prikaže „neznanega založnika“. Datoteko lahko primerjate s kontrolnimi seštevki, navedenimi v razdelku za prenose, preden jo zaženete. Naša politika podpisovanja kode je povezana iz noge spletnega mesta."
      ]
    ]
  },
  "about": {
    "title": "O NEXUS",
    "lead": "Neodvisna, lokalno usmerjena platforma za pametni dom, zasnovana za hitrost, popolno zasebnost in pravo lastništvo strojne opreme. S tem, da neposredno komunicira z vašimi napravami preko lastnega domačega omrežja, NEXUS za vedno odpravi zaklepanje v oblak.",
    "manifesto": {
      "heading": "Zakaj smo ustvarili NEXUS",
      "text": "Moderna industrija pametnih domov je zavila na napačno pot. Lastniški ekosistemi so lastnike stanovanj prisilili v obvezne naročnine, zamik zaradi odvisnosti od oblaka in vsiljivo spremljanje telemetrije. Ko vaša internetna povezava ne deluje, vaša stikala v dnevni sobi ne smejo prenehati delovati. NEXUS smo ustvarili, ker verjamemo, da je vaš dom vaše svetišče: tloris, stanje kamer in dnevne družinske rutine sodijo izključno na vašo lastno strojno opremo."
    },
    "pillars": [
      {
        "title": "Prednost lokalne hitrosti",
        "desc": "Vsaka avtomatizacija in ukaz se izvede prek vašega lokalnega LAN-a v milisekundah. Brez kroženja do oddaljenih oblačnih strežnikov, ničelna latenca."
      },
      {
        "title": "Nepopustljiva zasebnost",
        "desc": "Brez analitične telemetrije, brez vedenjskega profiliranja in brez prodaje vaših zasebnih rutin. Zahtevan je račun; vaša nastavitev je shranjena v vašem lastnem računu z zaščito na ravni vrstic. Ukazi za naprave ostanejo na vašem lokalnem omrežju."
      },
      {
        "title": "Brez zaklepanja pri ponudniku",
        "desc": "Najprej odprti lokalni protokoli: Shelly, Philips Hue, ESPHome, Tasmota in WLED se neposredno povežejo z NEXUS-om, vse ostalo pa se poveže prek vaše lastne Home Assistant strežnika namesto oblačne storitve ponudnika."
      },
      {
        "title": "Pošten, trajnosten SaaS",
        "desc": "Osnovno upravljanje pametnega doma je popolnoma brezplačno in neomejeno za vedno. NEXUS+ je NEXUS AI načrt in pomaga pokriti uporabo oblaka."
      }
    ],
    "architecture": {
      "heading": "Inženirsko zasnovano za zanesljivost",
      "lead": "NEXUS ohranja lahkotni namizni motor v vaši sistemski vrstici, tako da se urniki in pravila senzorjev še naprej izvajajo, medtem ko je vaš računalnik vklopljen, mobilna aplikacija pa se odpre neposredno v isto lokalno omrežje.",
      "items": [
        {
          "icon": "layers",
          "title": "Namizje",
          "desc": "Aplikacije za Windows, macOS in Linux ostanejo v sistemski vrstici in omogočajo, da lokalni urniki in pravila senzorjev tečejo, medtem ko je računalnik vklopljen. Windows in Linux se dobavljata kot pripravljeni namestitveni programi; macOS je sestavljen iz izvorne kode (nesignirano: desni klik → Odpri)."
        },
        {
          "icon": "wifi",
          "title": "Telefon",
          "desc": "Android in iOS aplikacije se odprejo na istem lokalnem omrežju; ukazi za naprave še vedno potujejo po vašem LAN-u. Android se distribuira kot podpisan APK; iOS je zgrajen iz izvorne kode z Xcode in brezplačnim Apple ID-jem."
        },
        {
          "icon": "lock",
          "title": "Račun",
          "desc": "Račun je potreben, da se sobe, naprave in scene ujemajo na vsakem zaslonu. Ukazi za naprave ne zapuščajo vašega domačega omrežja."
        }
      ]
    },
    "linksTitle": "Praktične povezave"
  },
  "footer": {
    "tagline": "Nadzorujte celoten pametni dom neposredno preko lokalnega omrežja — brez zaklepanja pri dobavitelju in brez odvisnosti od oblačnih storitev. Tudi ko internet izpade, vaš dom ne preneha delovati.",
    "product": "Izdelek",
    "productLinks": [
      [
        "Funkcije",
        "#features"
      ],
      [
        "Cenik",
        "#pricing"
      ],
      [
        "Prenos",
        "#downloads"
      ],
      [
        "Pogosto zastavljena vprašanja",
        "#faq"
      ],
      [
        "O nas",
        "/about"
      ]
    ],
    "account": "Stranke in podpora",
    "accountLinks": [
      [
        "Kontakt & Tehnična podpora",
        "javascript:nxOpenContactModal('Technical Support')"
      ],
      [
        "Opombe ob izdaji & Skupnost",
        "https://github.com/Enard52/nexus-releases"
      ],
      [
        "Prenesi aplikacije",
        "#downloads"
      ]
    ],
    "legal": "Pravno",
    "legalLinks": [
      [
        "Zasebnost",
        "/privacy"
      ],
      [
        "Pogoji",
        "/terms"
      ],
      [
        "Vračila",
        "/refund"
      ],
      [
        "Podpisovanje kode",
        "/code-signing"
      ],
      [
        "Prispevaj",
        "/contribute"
      ]
    ],
    "rights": "Vse pravice pridržane.",
    "langSwitchLabel": "Türkçe",
    "langSwitchHref": "/tr/"
  }
};
