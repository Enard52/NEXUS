import { RELEASES_URL } from "./site-constants.mjs";

export const hu = {
  title: "NEXUS — Az okosotthonod, a saját hálózatodon kezelve",
  ogImageAlt: "A NEXUS okosotthon-ökoszisztéma asztali gépen és mobilon",
  description:
    "A NEXUS egy helyi hálózatra épülő okosotthon-ökoszisztéma Windowsra, macOS-re, Linuxra, Androidra és iOS-re. Közvetlen eszközvezérlés a saját helyi hálózatodon, gyorsan reagáló automatizálások és élő energiamérés. Örökre ingyenes; opcionális NEXUS+ csomaggal.",
  nav: [
    ["#features", "Funkciók"],
    ["#how", "Hogyan működik"],
    ["#integrations", "Integrációk"],
    ["#pricing", "Árak"],
    ["#downloads", "Letöltés"],
    ["#faq", "GYIK"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Helyi hálózatra épülő okosotthon",
    h1a: "Az otthonod.",
    h1b: "Csendben a kezedben.",
    lead: "Egyetlen egységes ökoszisztéma a lámpáidhoz, a klímához, az árnyékolókhoz és az érzékelőkhöz — a saját helyi hálózatodon lévő eszközökkel közvetlenül beszélgetve. Gyorsan reagáló automatizálások, élő teljesítménymérés és vezérlés, amely akkor is működik, ha leáll az internet.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Legújabb verzió",
    shotAlt: "A NEXUS felülete és vezérlőközpontja",
    trust: [
      "Ingyenes, korlátlan számú eszköz",
      "A vezérléshez nincs szükség felhőre",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Erős infrastruktúra. Fáradtság nélküli vezérlés.",
    lead: "Minden eszközállapot, teljesítménymérés és automatizált jelenet közvetlenül a helyi hálózatodon fut, külső felhőfüggőség nélkül.",
    items: [
      [
        "zap",
        "Gyorsan reagáló automatizálások",
        "Az idő- és naplementealapú forgatókönyvek közvetlenül a helyi hardveren futnak le — asztali gépen megbízhatóan a háttérben folytatódnak.",
      ],
      [
        "gauge",
        "Élő energiaadatok",
        "Valós idejű wattértékek és fogyasztás olvasható le közvetlenül a helyi hálózatodon lévő, támogatott okoskonnektorokból és kapcsolókból.",
      ],
      [
        "wifi",
        "Helyi hálózati sebesség",
        "Közvetlen LAN-kommunikáció HTTP-n, TCP-n és UDP-n keresztül az Integrációk között felsorolt márkákkal. A parancsok útjában nincs felhős kitérő.",
      ],
      [
        "lock",
        "Tervezetten magánszféra-barát",
        "Az otthoni konfigurációd és az eszközök telemetriája a helyi hardveren marad. A NEXUS használatához fiók szükséges; a beállításaidat a saját soraidban tárolja sorszintű hozzáférés-vezérlés mellett. Az eszközparancsok továbbra is a LAN-on mennek.",
      ],
      [
        "sparkles",
        "NEXUS AI intelligencia",
        "A helyi okosotthon-parancsok azonnaliak és örökre ingyenesek. A választható felhős AI-asszisztens okos javaslatokkal segít, valahányszor útmutatásra van szükséged.",
      ],
      [
        "layers",
        "Nyílt helyi protokollok",
        "A közvetlen csatlakozók a LAN-odon kommunikálnak. A Matter és a Zigbee a saját Home Assistant szervereden keresztül csatlakozik — az Integrációk szakasz megmutatja, mi közvetlen és mi áthidalt.",
      ],
    ],
  },
  how: {
    heading: "A letöltéstől a csatlakozásig percek alatt.",
    steps: [
      [
        "1",
        "Telepítés és megnyitás",
        "Töltsd le a platformodnak megfelelő natív telepítőt (Windows, Linux vagy Android). Ezután jelentkezz be — a NEXUS használatához fiók szükséges, ez szinkronizálja a beállításaidat a képernyőid között is.",
      ],
      [
        "2",
        "Eszközök hozzáadása",
        "Válaszd ki a márkát, szkenneld a helyi hálózatot, vagy add meg az IP-címet. A közvetlen csatlakozóval rendelkező márkák a saját protokolljukon beszélnek — ezen az úton nincs gyártói felhő.",
      ],
      [
        "3",
        "Éld az otthonod",
        "Jelenetek, ütemezett automatizálások és valódi energiaadatok — egységes vezérlés asztali gépen és mobilon.",
      ],
    ],
  },
  integrations: {
    heading: "Együttműködik azzal, ami már megvan.",
    lead: "Először az ingyenes, helyi protokollok. Ami nem rendelkezik közvetlen csatlakozóval, az is működik a Home Assistant hídon keresztül.",
    groups: [
      [
        "Helyi HTTP — minden platformon",
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
        "Helyi hálózat, fiók és kulcs nélkül — asztali alkalmazás",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY mode)", "Wake-on-LAN"],
      ],
    ],
    more: "Hiányzik valami? Kérj csatlakozót",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Ingyenesen használható. NEXUS+, ha többet szeretnél",
    lead: "",
    currencyNote: "Az árak USD-ben értendők",
    plans: [
      {
        name: "Ingyenes",
        price: "$0",
        period: "örökre",
        features: [
          "Korlátlan számú eszköz és szoba minden támogatott helyi protokollon",
          "Nulla felhőfüggőség: a saját LAN-odon fut helyben",
          "Napi 30 NEXUS AI-parancs és eszközművelet",
          "Ütemezett helyi automatizálások és egyéni jelenetek",
          "Többeszközös fiókszinkron (szobák, eszközök, jelenetek)",
          "100%-ban privát: nincs követés, nincs adatgyűjtés",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "havonta",
        badge: "Legnépszerűbb",
        features: [
          "Minden, ami az Ingyenes csomagban, és még:",
          "Havi 2000 NEXUS AI-válasz a napi 30 helyett",
          "Kérd meg a NEXUS AI-t jelenetek beállítására, és válaszoljon közérthető nyelven",
          "Egy fiók, amely minden NEXUS-eszközön érvényes",
          "Ingyenes próba — havi előfizetésnél 3 nap, éves előfizetésnél 7 nap; az időszak végén lemondható",
        ],
        cta: {
          label: "Kezdd el az ingyenes próbát",
          monthlyLabel: "3 napos ingyenes próba indítása",
          yearlyLabel: "7 napos ingyenes próba indítása",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Család",
        price: "Free",
        period: "az egész családnak",
        badge: "Az egész otthon",
        features: [
          "Háztartástagok szerepköralapú hozzáféréssel — tagszámkorlát nélkül",
          "Tulajdonos, tag és vendég szerepkörök",
          "Tagonkénti vezérlési, meghívási és beállítási jogosultságok",
          "A jelenetek és automatizálások szinkronban maradnak a saját bejelentkezett eszközeiden",
          "Aktív az egész ökoszisztémában (asztali gép és mobil)",
          "Teljesen ingyenes az otthonoddal",
        ],
        cta: { label: "Kezdd a Családdal", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Bármikor lemondhatod az alkalmazás Számlázás részében vagy a fiókodból ezen az oldalon. A lemondás az aktuális időszak végén lép életbe.",
  },
  downloads: {
    heading: "Natív minden asztali gépen. Otthon van a telefonodon is.",
    lead: "Mindig ingyenes. Minden telepítőhöz közzétett SHA-256 ellenőrzőösszeg tartozik, így ellenőrizheted, mit telepítesz.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64 bites", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian és Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · aláírt APK",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Verzió",
    sizeLabel: "Méret",
    webCard: {
      title: "Egy fiók, az egész ökoszisztémádban",
      desc: "Windows és Linux asztali programok, valamint az Android-alkalmazás. Bejelentkezve a szobáid, eszközeid, jeleneteid és automatizálásaid zökkenőmentesen szinkronban maradnak a képernyőid között.",
      cta: { label: "NEXUS letöltése", href: "#downloads" },
    },
    smartScreenNote:
      "Windowson a legegyszerűbb út a Microsoft Store: a csomagot a Microsoft írja alá, a frissítések pedig a Store-on keresztül érkeznek. A közvetlenül letölthető .exe nincs aláírva, ezért a Windows „ismeretlen kiadó” figyelmeztetést jeleníthet meg — lásd az ellenőrzőösszegeket.",
  },
  faq: {
    heading: "A fontos kérdések, megválaszolva.",
    items: [
      [
        "A NEXUS teljesen a helyi hálózatomon működik?",
        "Igen. A NEXUS szigorúan helyi hálózatra épülő architektúrára épül. Az eszközeid, szobáid, jeleneteid és érzékelőtelemetriád közvetlenül a saját otthoni hardveren dolgozódik fel. Internetkimaradás esetén is minden helyi vezérlés, világítás és automatizálás zökkenőmentesen, nulla késleltetéssel működik tovább. A bejelentkezés biztonságosan szinkronizálja a beállításaidat az összes képernyőd között.",
      ],
      [
        "Telepítenem kell a NEXUS-t, vagy fut böngészőben is?",
        "Telepítsd az asztali programot (Windows vagy Linux) vagy az Android-alkalmazást. A NEXUS nem érhető el böngészős alkalmazásként. Az eszközparancsok a saját helyi hálózatodon mennek át. A Shelly, a Philips Hue, az ESPHome, a Tasmota, a WLED és a Home Assistant helyi HTTP-t használ az asztali programban és Androidon. A TP-Link Kasa és a Yeelight nyers TCP-t igényel, ezért az asztali programban futnak. Ez az oldal a fiókot, a letöltéseket és a számlázást szolgálja.",
      ],
      [
        "Mit ad hozzá a NEXUS+ csomag?",
        "Az alapvető okosotthon-vezérlés — korlátlan eszköz, szoba, offline automatizálás és helyi irányítópultok — ingyenes. A NEXUS+ tartalmaz mindent, ami az Ingyenesben van, továbbá a NEXUS AI-t jelenetekhez és közérthető nyelvű kérdésekhez, havi 2000 választ, speciális kapcsolatokat Home Assistant eszközök hozzáadásához, és egy fiókot minden eszközön, 3 napos havi vagy 7 napos éves próbával. Az eszközparancsok továbbra is helyben futnak. A háztartási szerepkörök az otthonoddal együtt, külön költség nélkül járnak.",
      ],
      [
        "Melyik fiókhoz tartozik a NEXUS+ előfizetésem?",
        "Ahhoz az e-mail-címhez, amelyet a fizetésnél használtál. Fizetés előtt jelentkezz be ezen az oldalon vagy az alkalmazásban: a fizetési oldal ekkor a fiókod e-mail-címével kitöltve nyílik meg, és az előfizetés minden eszközön megjelenik, amelyre bejelentkezel. A NEXUS+ fiók nélkül nem vásárolható meg. Ha más e-mail-címmel fizetsz, az előfizetés az adott címhez kerül, és addig nem jelenik meg a fiókodban, amíg azzal be nem jelentkezel.",
      ],
      [
        "Hogyan futnak az automatizálások és az ütemezett szabályok?",
        "A NEXUS automatizálási motorja az általad futtatva tartott eszközön értékeli az ütemezéseidet és az érzékelőszabályaidat — az asztali alkalmazás a tálcán marad, és éjjel-nappal fut, így a világítási, energia- és biztonsági rutinok soha nem várnak felhőre. A telefonról indított jelenetek és időzítők azonnal érvényesülnek a LAN-on. Az új események eljutnak azokra az értesítési csatornákra, amelyeket az Azonnali értesítések oldalon bekapcsolsz: az alkalmazáson belüli sáv, a rendszerértesítések, az ntfy, a Telegram vagy a saját HTTPS webhookod.",
      ],
      [
        "Mely eszközök és ökoszisztémák támogatottak?",
        "A NEXUS minden eszköz saját helyi protokollján beszél: Shelly (Gen1 és Gen2+), Tasmota, WLED, ESPHome, Philips Hue és Home Assistant helyi HTTP-n minden platformon, valamint TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY mode) és Wake-on-LAN a helyi hálózaton az asztali alkalmazásban, fiók és kulcs nélkül. Minden más — a Matter vagy Zigbee eszközök — a saját Home Assistant szervereden keresztül csatlakozik, amelyet a NEXUS egyetlen helyi központként kezel. A helyi IP-felderítés azonnal párosítja az eszközöket, gyártói felhő közbeiktatása nélkül.",
      ],
      [
        "Hogyan integrálódnak a biztonsági kamerák és érzékelők?",
        "A NEXUS egyetlen központi biztonsági irányítópultba fogja össze a biztonsági kamerákat, mozgásérzékelőket és nyitásérzékelőket. Automatizálhatod a magánszféra módokat, élesítheted a megfigyelési rutinokat, amikor elmész otthonról, és az alkalmazásban láthatsz minden mozgás- vagy érintkezési eseményt — valamint azokon az értesítési csatornákon is, amelyeket bekapcsolsz (rendszerértesítések, ntfy, Telegram vagy a saját webhookod).",
      ],
      [
        "Bármikor lemondhatom a NEXUS+-t?",
        "Igen, teljesen gondtalanul, kötelezettségek nélkül. Egyetlen kattintással bármikor lemondhatod: az alkalmazás Fiók és számlázás beállításaiból, a weboldalunkon keresztül, vagy közvetlenül a számlázási e-mail-visszaigazolásban található rendelési hivatkozásról. A prémium előnyök a számlázási ciklus végéig aktívak maradnak, további terhelés nélkül.",
      ],
      [
        "Tudom vezérelni az otthonomat, ha távol vagyok?",
        "NEXUS-felhőn keresztül nem: a NEXUS közvetlenül az otthoni hálózaton éri el az eszközeidet, és nincs közvetítő szervere. Kívülről úgy érheted el, hogy a telefonodat vagy laptopodat VPN-nel az otthoni hálózatra csatlakoztatod, például Tailscale-lel (subnet router) vagy a routereden futó WireGuarddal; a NEXUS ekkor pontosan úgy működik, mint otthon. A NEXUS-ban még nincs központcím-beállítás, ezért a VPN-nek elérhetővé kell tennie a helyi címtartományodat, az új eszközök keresése pedig csak az otthoni hálózaton működik. Soha ne tegyél ki eszközt az internetre portátirányítással. A lépésenkénti útmutató a docs/REMOTE-ACCESS.md fájl a tárolóban.",
      ],
      [
        "Van iPhone-os verzió?",
        "App Store-os alkalmazás nincs, mert a NEXUS nem használ fizetős Apple Developer-fiókot. Machez és ingyenes Apple ID-hoz hozzáférve saját iPhone-ra le tudod fordítani (útmutató: docs/IOS-BUILD.md), és egy kiadáshoz aláíratlan IPA is tartozhat, amelyet az AltStore vagy a Sideloadly alá tud írni neked; ezt az utat valódi iPhone-on még nem ellenőriztük. Az ingyenes Apple ID-vel az alkalmazás 7 nap után lejár, és iOS-en nem érhetők el értesítések, amíg az alkalmazás be van zárva. Az otthoni központ továbbra is az asztali alkalmazás; az iPhone kliens.",
      ],
      [
        "Az eszközöm nincs a listán. Mit tehetek?",
        "A NEXUS csak dokumentált helyi protokollal rendelkező eszközöket támogat; a kizárólag felhős eszközök nem támogatottak, mert a NEXUS soha nem kommunikál gyártói felhővel. A kompatibilitási lista (docs/COMPATIBILITY.md) tartalmazza még a DIY módú Sonoffot, a WiZ-et, a LIFX-et, a Govee-t (LAN) és a Wake-on-LAN-t is. Mindegyikhez automatizált protokolltesztek tartoznak, de egy modell csak akkor számít ellenőrzöttnek, ha valaki jelzi, hogy valódi eszközön működött. Írj nekünk az oldalon lévő kapcsolatfelvételi űrlapon keresztül (válaszd az „Új eszköz / csatlakozó kérése” lehetőséget) vagy e-mailben: a márkát és a modellt, mire számítottál, és mi történt. Attól lesz egy modell ellenőrzött, ha jelzed, hogy működött a valódi eszközödön; soha ne küldj jelszavakat, helyi kulcsokat vagy tokeneket.",
      ],
      [
        "Szükségem van fiókra? Mi történik, ha a szerver nem elérhető?",
        "Igen: egyszer bejelentkezel egy ingyenes e-mail-fiókkal a NEXUS megnyitásához. Ezután az eszközök vezérlése és az automatizálások futtatása a saját hálózatodon történik, és internet nélkül is működik. A fiók hozzáadja az eszközök közötti szinkront, a Családot és az AI-asszisztenst, amelyek korlátozott, ingyenes felhőszolgáltatásokat használnak. Ha ezek egyike nem elérhető — például amikor az ingyenes Supabase-projekt körülbelül egy hét tétlenség után szünetel —, a felhős képernyők azt mondják, hogy a szerver nem érhető el, ahelyett hogy bármit mentettként mutatnának; az eszközök, az automatizálások és a tálcaikon tovább működnek. Ha az AI kvótája vagy szolgáltatása kimerült, az asszisztens jelzi, hogy nem tudott válaszolni.",
      ],
      [
        "Menthetem a beállításaimat, és átvihetem őket másik eszközre?",
        "Igen. A Beállításokban van egy biztonsági mentés szakasz, ahol JSON-fájlba exportálhatod a beállításaidat és automatizálásaidat, és importálhatod másik eszközön vagy újratelepítés után. A fájlban a párosított eszközök listájából eltávolítjuk a jelszavakat, tokeneket és helyi kulcsokat, ezért visszaállítás után add meg őket újra. Tartsd privátan a mentési fájlt.",
      ],
      [
        "Exportálhatom az energiaadataimat?",
        "Igen. Az Energia oldal CSV- vagy JSON-fájlként exportálni tudja az eszközeid legfrissebb valódi teljesítményadatait. A NEXUS csak olyan eszközökről rendelkezik adatokkal, amelyek ténylegesen jelentenek teljesítményt; párosított eszköz nélkül nincs mit exportálni.",
      ],
      [
        "Miért figyelmeztet a Windows a telepítő futtatásakor?",
        "Ha a Microsoft Store-ból telepítesz, nem látod ezt a figyelmeztetést: a Microsoft a tanúsítás során aláírja a csomagot, és a frissítéseket a Store-on keresztül kézbesíti. A közvetlenül letölthető .exe még nincs kereskedelmi tanúsítvánnyal aláírva, ezért a SmartScreen „ismeretlen kiadó” üzenetet jeleníthet meg. Futtatás előtt összevetheted a fájlt a letöltések szakaszban felsorolt ellenőrzőösszegekkel. A kódaláírási szabályzatunk az oldal láblécéből érhető el.",
      ],
    ],
  },
  about: {
    title: "A NEXUS-ról",
    lead: "Független, helyi hálózatra épülő okosotthon-platform, amelyet a sebességre, a teljes magánszférára és a valódi hardvertulajdonlásra terveztünk. Azzal, hogy a saját otthoni hálózatodon közvetlenül beszél az eszközeiddel, a NEXUS örökre megszünteti a felhőhöz kötöttséget.",
    manifesto: {
      heading: "Miért építettük a NEXUS-t",
      text: "A modern okosotthon-ipar rossz irányba fordult. A zárt ökoszisztémák kötelező előfizetésekbe, felhőfüggő késleltetésbe és tolakodó telemetriai követésbe kényszerítették a lakástulajdonosokat. Ha megszakad az internetkapcsolatod, a nappalid kapcsolójának nem szabadna leállnia. Azért építettük a NEXUS-t, mert hisszük, hogy az otthonod a menedéked: az alaprajzod, a kamerák állapota és a mindennapi családi rutinjaid kizárólag a saját hardveredre tartoznak.",
    },
    pillars: [
      {
        title: "Helyi hálózati sebesség",
        desc: "Minden automatizálás és parancs a helyi LAN-on fut le ezredmásodpercek alatt. Nincs körút távoli felhőszerverekhez, nulla késleltetés.",
      },
      {
        title: "Megalkuvás nélküli magánszféra",
        desc: "Nincs analitikai telemetria, nincs viselkedési profilalkotás, és nem adjuk el a privát rutinjaidat. Fiók szükséges; a beállításaid a saját, sorszinten védett fiókodban tárolódnak. Az eszközparancsok továbbra is a LAN-on maradnak.",
      },
      {
        title: "Nincs gyártóhoz kötöttség",
        desc: "Először a nyílt helyi protokollok: a Shelly, a Philips Hue, az ESPHome, a Tasmota és a WLED közvetlenül válaszol a NEXUS-nak, minden más pedig a saját Home Assistant szervereden keresztül csatlakozik gyártói felhő helyett.",
      },
      {
        title: "Őszinte, fenntartható SaaS",
        desc: "Az alapvető okosotthon-kezelés örökre teljesen ingyenes és korlátlan. A NEXUS+ a NEXUS AI csomagja, és segít fedezni ezt a felhőhasználatot.",
      },
    ],
    architecture: {
      heading: "A megbízhatóságra tervezve",
      lead: "A NEXUS egy könnyű asztali motort tart a tálcádon, hogy az ütemezések és az érzékelőszabályok kiértékelése addig folytatódjon, amíg a számítógéped be van kapcsolva, a mobilalkalmazás pedig közvetlenül ugyanarra a helyi hálózatra nyílik.",
      items: [
        {
          icon: "layers",
          title: "Asztali gép",
          desc: "A Windows, macOS és Linux alkalmazások a tálcán maradnak, és a helyi ütemezéseket és érzékelőszabályokat futtatják, amíg a számítógép be van kapcsolva. A Windows és a Linux kész telepítőként érhető el; a macOS forrásból fordítható (aláíratlan: jobb kattintás → Megnyitás).",
        },
        {
          icon: "wifi",
          title: "Telefon",
          desc: "Az Android- és iOS-alkalmazások ugyanarra a helyi hálózatra nyílnak; az eszközparancsok továbbra is a LAN-on mennek át. Az Android aláírt APK-ként érhető el; az iOS forrásból fordítható Xcode-dal és ingyenes Apple ID-vel.",
        },
        {
          icon: "lock",
          title: "Fiók",
          desc: "Fiók szükséges ahhoz, hogy a szobák, eszközök és jelenetek minden képernyőn egyezzenek. Az eszközparancsok nem hagyják el az otthoni hálózatodat.",
        },
      ],
    },
    linksTitle: "Hasznos hivatkozások",
  },
  footer: {
    tagline:
      "Vezéreld az egész okosotthonodat közvetlenül a helyi hálózaton — gyártóhoz kötöttség és felhőfüggőség nélkül. Még ha leáll is az internet, az otthonod soha nem áll le.",
    product: "Termék",
    productLinks: [
      ["Funkciók", "#features"],
      ["Árak", "#pricing"],
      ["Letöltés", "#downloads"],
      ["GYIK", "#faq"],
      ["Rólunk", "/about"],
    ],
    account: "Ügyfelek és támogatás",
    accountLinks: [
      ["Kapcsolat és technikai támogatás", "javascript:nxOpenContactModal('Technical Support')"],
      ["Kiadási jegyzetek és közösség", RELEASES_URL],
      ["Alkalmazások letöltése", "#downloads"],
    ],
    legal: "Jogi információk",
    legalLinks: [
      ["Adatvédelem", "/privacy"],
      ["Feltételek", "/terms"],
      ["Visszatérítések", "/refund"],
      ["Kódaláírás", "/code-signing"],
      ["Közreműködés", "/contribute"],
    ],
    rights: "Minden jog fenntartva.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
