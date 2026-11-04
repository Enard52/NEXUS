import { RELEASES_URL } from "./site-constants.mjs";

export const ro = {
  title: "NEXUS — Casa ta inteligentă, gestionată pe propria rețea",
  ogImageAlt: "Ecosistemul de casă inteligentă NEXUS pe desktop și mobil",
  description:
    "NEXUS este un ecosistem de casă inteligentă local-first pentru Windows, macOS, Linux, Android și iOS. Control direct al dispozitivelor prin propria rețea locală, automatizări rapide și metrici de energie în timp real. Gratuit pentru totdeauna; plan opțional NEXUS+.",
  nav: [
    ["#features", "Funcții"],
    ["#how", "Cum funcționează"],
    ["#integrations", "Integrări"],
    ["#pricing", "Prețuri"],
    ["#downloads", "Descărcare"],
    ["#faq", "Întrebări frecvente"],
  ],
  navCta: null,
  hero: {
    eyebrow: "Casă inteligentă local-first",
    h1a: "Casa ta.",
    h1b: "Discret sub controlul tău.",
    lead: "Un singur ecosistem unificat pentru lumini, climatizare, jaluzele și senzori — care comunică direct cu dispozitivele din propria ta rețea locală. Automatizări rapide, măsurarea în timp real a consumului și control care continuă să funcționeze chiar și când internetul cade.",
    primary: { label: "Windows · Linux · Android", href: "#downloads" },
    secondary: null,
    versionNote: "Ultima versiune",
    shotAlt: "Interfața NEXUS și centrul de control",
    trust: [
      "Gratuit, dispozitive nelimitate",
      "Fără cloud pentru control",
      "Windows · Linux · Android",
    ],
  },
  features: {
    heading: "Infrastructură puternică. Control fără efort.",
    lead: "Fiecare stare a dispozitivelor, fiecare metrică de consum și fiecare scenă automată rulează direct în rețeaua ta locală, fără dependențe de cloud extern.",
    items: [
      [
        "zap",
        "Automatizări rapide",
        "Scenariile declanșate de oră sau de apus se execută direct pe hardware-ul tău local — și continuă să ruleze fiabil în fundal pe desktop.",
      ],
      [
        "gauge",
        "Citiri de energie în timp real",
        "Citește direct, din rețeaua ta locală, puterea în wați și consumul în timp real de la prizele și întrerupătoarele inteligente compatibile.",
      ],
      [
        "wifi",
        "Viteza rețelei locale",
        "Comunicare directă în LAN prin HTTP, TCP și UDP cu mărcile enumerate la Integrări. Fără ocolul prin cloud pe calea comenzilor.",
      ],
      [
        "lock",
        "Confidențialitate din proiectare",
        "Configurația casei și telemetria dispozitivelor rămân pe hardware-ul tău local. Pentru a folosi NEXUS este necesar un cont; acesta îți stochează configurația în propriul rând, sub control de acces la nivel de rând. Comenzile către dispozitive merg în continuare prin LAN-ul tău.",
      ],
      [
        "sparkles",
        "Inteligența NEXUS AI",
        "Comenzile locale de casă inteligentă sunt instantanee și gratuite pentru totdeauna. Asistentul AI opțional din cloud oferă sugestii inteligente ori de câte ori ai nevoie de îndrumare.",
      ],
      [
        "layers",
        "Protocoale locale deschise",
        "Conectorii directi comunică în LAN-ul tău. Matter și Zigbee se alătură prin propriul tău server Home Assistant — secțiunea Integrări arată ce este direct și ce trece printr-o punte.",
      ],
    ],
  },
  how: {
    heading: "De la descărcare la conectat în câteva minute.",
    steps: [
      [
        "1",
        "Instalează și deschide",
        "Descarcă programul de instalare nativ pentru platforma ta (Windows, Linux sau Android). Apoi autentifică-te — pentru a folosi NEXUS este necesar un cont, care sincronizează și configurația între ecranele tale.",
      ],
      [
        "2",
        "Adaugă-ți dispozitivele",
        "Alege marca, scanează rețeaua locală sau introdu o adresă IP. Mărcile cu conector direct folosesc propriul protocol — fără cloudul producătorului pe acea cale.",
      ],
      [
        "3",
        "Trăiește-ți casa",
        "Scene, automatizări programate și citiri reale de energie — control unificat pe desktop și mobil.",
      ],
    ],
  },
  integrations: {
    heading: "Funcționează cu ce ai deja.",
    lead: "Mai întâi protocoale locale, gratuite. Orice fără conector direct funcționează totuși prin puntea Home Assistant.",
    groups: [
      [
        "HTTP local — pe fiecare platformă",
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
        "Rețea locală, fără cont sau cheie — aplicația desktop",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (mod DIY)", "Wake-on-LAN"],
      ],
    ],
    more: "Lipsește ceva? Solicită un conector",
    moreHref: "javascript:nxOpenContactModal('Connector Request')",
  },
  pricing: {
    heading: "Gratuit de folosit. NEXUS+ când vrei mai mult",
    lead: "",
    currencyNote: "Prețuri în USD",
    plans: [
      {
        name: "Gratuit",
        price: "$0",
        period: "pentru totdeauna",
        features: [
          "Dispozitive și camere nelimitate pe toate protocoalele locale acceptate",
          "Zero dependență de cloud: rulează local, în propriul tău LAN",
          "30 de comenzi și acțiuni zilnice NEXUS AI asupra dispozitivelor",
          "Automatizări locale programate și scene personalizate",
          "Sincronizare cont pe mai multe dispozitive (camere, dispozitive, scene)",
          "100% privat: fără urmărire, fără colectare de date",
        ],
        cta: { label: "Windows · Linux · Android", href: "#downloads" },
      },
      {
        name: "NEXUS+",
        price: null,
        period: "pe lună",
        badge: "Cel mai popular",
        features: [
          "Tot ce include nivelul Free, plus:",
          "2.000 de răspunsuri NEXUS AI pe lună, în loc de 30 pe zi",
          "Cere-i NEXUS AI să stabilească scene și să răspundă pe înțelesul tău",
          "Un singur cont, valabil pe fiecare dispozitiv NEXUS",
          "Probă gratuită — 3 zile pentru planul lunar, 7 zile pentru cel anual; anulezi la sfârșitul perioadei",
        ],
        cta: {
          label: "Începe perioada de probă gratuită",
          monthlyLabel: "Începe proba gratuită de 3 zile",
          yearlyLabel: "Începe proba gratuită de 7 zile",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
      },
      {
        name: "Familie",
        price: "Gratuit",
        period: "pentru toată familia",
        badge: "Toată casa",
        features: [
          "Membri ai gospodăriei cu acces pe bază de roluri — fără limită de membri",
          "Roluri de proprietar, membru și invitat",
          "Permisiuni de control, invitare și setări pentru fiecare membru",
          "Scenele și automatizările se sincronizează între propriile tale dispozitive autentificate",
          "Active în întregul ecosistem (desktop și mobil)",
          "Complet gratuit odată cu casa ta",
        ],
        cta: { label: "Începe cu Family", href: "#downloads" },
        soon: false,
      },
    ],
    manageNote:
      "Anulezi oricând din Facturare în aplicație sau din contul tău de pe acest site. Anularea intră în vigoare la sfârșitul perioadei curente.",
  },
  downloads: {
    heading: "Nativ pe fiecare desktop. La el acasă pe telefon.",
    lead: "Mereu gratuit. Fiecare program de instalare vine cu o sumă de control SHA-256 publicată, ca să poți verifica ce instalezi.",
    cards: [
      ["windows", "monitor", "Windows", "Windows 10/11 · 64 de biți", "NEXUS-Setup.exe", ".exe"],
      ["linux", "terminal", "Linux", "Debian și Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
      [
        "android",
        "smartphone",
        "Android",
        "Android 8.0+ · APK semnat",
        "NEXUS-Android.apk",
        ".apk",
      ],
    ],
    versionLabel: "Versiune",
    sizeLabel: "Dimensiune",
    webCard: {
      title: "Un singur cont, în tot ecosistemul tău",
      desc: "Programele desktop pentru Windows și Linux și aplicația Android. Autentificat, camerele, dispozitivele, scenele și automatizările tale rămân sincronizate fără efort între ecrane.",
      cta: { label: "Descarcă NEXUS", href: "#downloads" },
    },
    smartScreenNote:
      "Pe Windows, cea mai simplă cale este Microsoft Store: pachetul este semnat de Microsoft, iar actualizările vin prin Store. Fișierul .exe direct nu este semnat, așa că Windows poate avertiza despre un „editor necunoscut” — vezi sumele de control.",
  },
  faq: {
    heading: "Întrebările importante, cu răspunsuri.",
    items: [
      [
        "Funcționează NEXUS în întregime pe rețeaua mea locală?",
        "Da. NEXUS este construit pe o arhitectură strict local-first. Dispozitivele, camerele, scenele și telemetria senzorilor tăi sunt procesate direct pe hardware-ul din casa ta. Chiar și în timpul întreruperilor de internet, toate controalele locale, iluminatul și automatizările continuă să funcționeze fără probleme, cu latență zero. Autentificarea îți sincronizează în siguranță setările pe toate ecranele.",
      ],
      [
        "Trebuie să instalez NEXUS sau rulează în browser?",
        "Instalează programul desktop (Windows sau Linux) sau aplicația Android. NEXUS nu este oferit ca aplicație de browser. Comenzile către dispozitive circulă prin propria ta rețea locală. Shelly, Philips Hue, ESPHome, Tasmota, WLED și Home Assistant folosesc HTTP local în programul desktop și pe Android. TP-Link Kasa și Yeelight necesită TCP brut, deci rulează în programul desktop. Acest site este pentru cont, descărcări și facturare.",
      ],
      [
        "Ce adaugă planul NEXUS+?",
        "Controlul esențial al casei inteligente — dispozitive și camere nelimitate, automatizări offline și panouri locale — este gratuit. NEXUS+ include tot ce oferă Free, NEXUS AI pentru scene și întrebări pe înțelesul tău, 2.000 de răspunsuri pe lună, conexiuni avansate pentru adăugarea dispozitivelor Home Assistant și un singur cont pe fiecare dispozitiv, cu probă de 3 zile (lunar) sau 7 zile (anual). Comenzile către dispozitive rulează în continuare local. Rolurile din gospodărie sunt incluse în casa ta, fără cost suplimentar.",
      ],
      [
        "Cărui cont îi aparține abonamentul meu NEXUS+?",
        "Adresei de e-mail folosite la plată. Autentifică-te pe acest site sau în aplicație înainte să plătești: plata se deschide apoi cu e-mailul contului tău completat, iar abonamentul apare pe fiecare dispozitiv pe care te autentifici. NEXUS+ nu poate fi cumpărat fără un cont. Dacă plătești cu un alt e-mail, abonamentul este păstrat sub acel e-mail și nu va apărea în contul tău până când nu te autentifici cu el.",
      ],
      [
        "Cum rulează automatizările și regulile programate?",
        "Motorul de automatizare NEXUS evaluează programările și regulile de senzori pe dispozitivul pe care îl ții pornit — aplicația desktop rămâne în zona de notificare a sistemului și rulează non-stop, astfel încât rutinele de iluminat, energie și securitate nu așteaptă niciodată un cloud. Scenele și temporizatoarele declanșate de pe telefon se aplică instantaneu prin LAN-ul tău. Evenimentele noi sunt trimise către canalele de notificare pe care le activezi în pagina Notificări instantanee: banda din aplicație, notificările de sistem, ntfy, Telegram sau propriul tău webhook HTTPS.",
      ],
      [
        "Ce dispozitive și ecosisteme sunt acceptate?",
        "NEXUS vorbește protocolul local al fiecărui dispozitiv: Shelly (Gen1 și Gen2+), Tasmota, WLED, ESPHome, Philips Hue și Home Assistant prin HTTP local pe toate platformele, plus TP-Link Kasa, Yeelight, WiZ, Sonoff (mod DIY) și Wake-on-LAN prin rețeaua locală în aplicația desktop, fără cont sau cheie. Tot restul — echipamentele Matter sau Zigbee — se alătură prin propriul tău server Home Assistant, pe care NEXUS îl tratează ca pe un singur hub local. Descoperirea locală prin IP asociază dispozitivele instantaneu, fără cloudul vreunui producător la mijloc.",
      ],
      [
        "Cum sunt integrate camerele de supraveghere și senzorii?",
        "NEXUS îți adună camerele de supraveghere, detectoarele de mișcare și senzorii de acces într-un panou de securitate centralizat. Poți automatiza modurile de confidențialitate, poți activa rutinele de supraveghere când pleci de acasă și poți vedea în aplicație fiecare mișcare sau eveniment de contact — plus pe canalele de notificare pe care le activezi (notificări de sistem, ntfy, Telegram sau propriul webhook).",
      ],
      [
        "Pot anula NEXUS+ oricând?",
        "Da, fără bătăi de cap și fără angajamente. Poți anula cu un singur clic oricând: din setările Cont și facturare din aplicație, prin site-ul nostru sau direct din linkul comenzii din e-mailul cu chitanța de facturare. Beneficiile premium rămân active până la sfârșitul ciclului de facturare, fără alte plăți viitoare.",
      ],
      [
        "Pot controla casa când sunt plecat?",
        "Nu printr-un cloud NEXUS: NEXUS comunică direct cu dispozitivele tale în rețeaua de acasă și nu are releu. Pentru a ajunge la ea din exterior, conectează telefonul sau laptopul la rețeaua de acasă printr-un VPN precum Tailscale (subnet router) sau WireGuard pe router; NEXUS funcționează atunci exact ca acasă. NEXUS nu are încă o setare pentru adresa hubului, așa că VPN-ul trebuie să facă accesibil intervalul tău de adrese locale, iar scanarea pentru dispozitive noi funcționează doar în rețeaua de acasă. Nu expune niciodată un dispozitiv la internet prin redirecționare de porturi. Ghidul pas cu pas este docs/REMOTE-ACCESS.md din depozit.",
      ],
      [
        "Există o versiune pentru iPhone?",
        "Nu există aplicație în App Store, deoarece NEXUS nu folosește un cont Apple Developer plătit. Cu un Mac și un Apple ID gratuit o poți compila pentru propriul iPhone (ghid: docs/IOS-BUILD.md), iar o versiune poate atașa și un IPA nesemnat pe care AltStore sau Sideloadly îl pot semna pentru tine; această cale nu a fost încă verificată pe un iPhone real. Un Apple ID gratuit face aplicația să expire după 7 zile, iar notificările cât timp aplicația este închisă nu sunt disponibile pe iOS. Hubul casei rămâne aplicația desktop; iPhone-ul este un client.",
      ],
      [
        "Dispozitivul meu nu este în listă. Ce pot face?",
        "NEXUS acceptă doar dispozitive cu un protocol local documentat; dispozitivele exclusiv cloud nu sunt acceptate, deoarece NEXUS nu comunică niciodată cu cloudul unui producător. Lista de compatibilitate (docs/COMPATIBILITY.md) include și Sonoff în mod DIY, WiZ, LIFX, Govee (LAN) și Wake-on-LAN. Fiecare dintre acestea are teste automate de protocol, dar un model contează ca verificat doar atunci când cineva raportează că a funcționat pe un dispozitiv real. Scrie-ne prin formularul de contact de pe acest site (alege „New Device / Connector Request”) sau prin e-mail: marca și modelul, ce te-ai așteptat și ce s-a întâmplat. Faptul că ne spui că un model a funcționat pe dispozitivul tău real este ceea ce îl marchează ca verificat; nu include niciodată parole, chei locale sau token-uri.",
      ],
      [
        "Am nevoie de un cont? Ce se întâmplă dacă serverul este indisponibil?",
        "Da: te autentifici o singură dată cu un cont gratuit de e-mail pentru a deschide NEXUS. După aceea, controlul dispozitivelor și rularea automatizărilor au loc în propria ta rețea și continuă să funcționeze fără internet. Contul adaugă sincronizarea între dispozitive, Family și asistentul AI, care folosesc servicii cloud gratuite, cu limite. Când unul dintre ele este indisponibil, de exemplu când proiectul Supabase gratuit s-a oprit după aproximativ o săptămână fără activitate, ecranele din cloud spun că serverul nu poate fi contactat, în loc să arate ceva ca salvat; dispozitivele, automatizările și zona de notificare continuă să funcționeze. Dacă cota sau serviciul AI este epuizat, asistentul spune că nu a putut răspunde.",
      ],
      [
        "Pot face o copie de rezervă a setărilor și să le mut pe alt dispozitiv?",
        "Da. Setările au o secțiune de copie de rezervă unde îți poți exporta setările și automatizările într-un fișier JSON și le poți importa pe alt dispozitiv sau după o reinstalare. Parolele, token-urile și cheile locale sunt eliminate din lista dispozitivelor asociate din fișier, așa că reintroduce-le după restaurare. Păstrează fișierul de rezervă privat.",
      ],
      [
        "Îmi pot exporta datele de energie?",
        "Da. Pagina Energie poate exporta ultimele citiri reale de putere de la dispozitivele tale ca fișier CSV sau JSON. NEXUS are date doar pentru dispozitivele care raportează efectiv puterea; fără niciun dispozitiv asociat, nu există nimic de exportat.",
      ],
      [
        "De ce mă avertizează Windows când rulez programul de instalare?",
        "Instalează din Microsoft Store și nu vei vedea acest avertisment: Microsoft semnează pachetul în timpul certificării și livrează actualizările prin Store. Descărcarea directă a fișierului .exe nu este încă semnată cu un certificat comercial, așa că SmartScreen poate afișa „editor necunoscut”. Poți compara fișierul cu sumele de control din secțiunea de descărcări înainte de a-l rula. Politica noastră de semnare a codului este legată din subsolul site-ului.",
      ],
    ],
  },
  about: {
    title: "Despre NEXUS",
    lead: "O platformă de casă inteligentă independentă, local-first, concepută pentru viteză, confidențialitate absolută și adevărata proprietate asupra hardware-ului. Vorbind direct cu dispozitivele tale prin propria rețea de acasă, NEXUS elimină pentru totdeauna dependența de cloud.",
    manifesto: {
      heading: "De ce am construit NEXUS",
      text: "Industria casei inteligente moderne a luat-o pe un drum greșit. Ecosistemele proprietare i-au forțat pe proprietari să accepte abonamente obligatorii, întârzieri cauzate de dependența de cloud și urmărire invazivă prin telemetrie. Când conexiunea la internet cade, întrerupătorul din sufragerie nu ar trebui să înceteze să funcționeze. Am construit NEXUS pentru că credem că casa ta este sanctuarul tău: planul locuinței, starea camerelor și rutinele zilnice ale familiei tale aparțin strict propriului tău hardware.",
    },
    pillars: [
      {
        title: "Viteză local-first",
        desc: "Fiecare automatizare și comandă se execută prin LAN-ul tău local în milisecunde. Fără drumuri dus-întors către servere cloud îndepărtate, latență zero.",
      },
      {
        title: "Confidențialitate fără compromisuri",
        desc: "Fără telemetrie de analiză, fără profilare comportamentală și fără vânzarea rutinelor tale private. Este necesar un cont; configurația ta este stocată în propriul rând al contului, protejat la nivel de rând. Comenzile către dispozitive rămân în continuare în LAN-ul tău.",
      },
      {
        title: "Fără dependență de furnizor",
        desc: "Mai întâi protocoale locale deschise: Shelly, Philips Hue, ESPHome, Tasmota și WLED răspund direct către NEXUS, iar orice altceva se alătură prin propriul tău server Home Assistant, în loc de cloudul unui producător.",
      },
      {
        title: "SaaS sincer și sustenabil",
        desc: "Gestionarea de bază a casei inteligente este complet gratuită și nelimitată pentru totdeauna. NEXUS+ este planul NEXUS AI și ajută la acoperirea acestui consum de cloud.",
      },
    ],
    architecture: {
      heading: "Construit pentru fiabilitate",
      lead: "NEXUS păstrează în zona de notificare a sistemului un motor desktop ușor, astfel încât programările și regulile de senzori continuă să fie evaluate cât timp calculatorul este pornit, iar aplicația mobilă se deschide direct pe aceeași rețea locală.",
      items: [
        {
          icon: "layers",
          title: "Desktop",
          desc: "Aplicațiile pentru Windows, macOS și Linux rămân în zona de notificare a sistemului și mențin în funcțiune programările locale și regulile de senzori cât timp calculatorul este pornit. Windows și Linux vin ca programe de instalare gata făcute; macOS se compilează din sursă (nesemnat: clic dreapta → Open).",
        },
        {
          icon: "wifi",
          title: "Telefon",
          desc: "Aplicațiile Android și iOS se deschid pe aceeași rețea locală; comenzile către dispozitive merg în continuare prin LAN-ul tău. Android vine ca APK semnat; iOS se compilează din sursă cu Xcode și un Apple ID gratuit.",
        },
        {
          icon: "lock",
          title: "Cont",
          desc: "Este necesar un cont pentru ca încăperile, dispozitivele și scenele să coincidă pe fiecare ecran. Comenzile către dispozitive nu părăsesc rețeaua ta de acasă.",
        },
      ],
    },
    linksTitle: "Linkuri utile",
  },
  footer: {
    tagline:
      "Controlează-ți întreaga casă inteligentă direct prin rețeaua ta locală — fără dependență de furnizor și fără cloud. Chiar și când internetul cade, casa ta nu se oprește niciodată.",
    product: "Produs",
    productLinks: [
      ["Funcții", "#features"],
      ["Prețuri", "#pricing"],
      ["Descărcare", "#downloads"],
      ["Întrebări frecvente", "#faq"],
      ["Despre", "/about"],
    ],
    account: "Clienți și asistență",
    accountLinks: [
      ["Contact și asistență tehnică", "javascript:nxOpenContactModal('Technical Support')"],
      ["Note de versiune și comunitate", RELEASES_URL],
      ["Descarcă aplicațiile", "#downloads"],
    ],
    legal: "Juridic",
    legalLinks: [
      ["Confidențialitate", "/privacy"],
      ["Termeni", "/terms"],
      ["Rambursări", "/refund"],
      ["Semnarea codului", "/code-signing"],
      ["Contribuie", "/contribute"],
    ],
    rights: "Toate drepturile rezervate.",
    langSwitchLabel: "Türkçe",
    langSwitchHref: "/tr/",
  },
};
