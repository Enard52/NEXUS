// NEXUS tanıtım sitesi — tek içerik kaynağı (TR/EN) (issue #2)
// ------------------------------------------------------------
// scripts/site-build.mjs bu modülden index + about sayfalarını üretir.
// Fiyatlar cloud-sync.js PRICES ile birebir aynı olmak zorundadır
// (packages/core/src/site-pricing.test.ts denetler — CLAUDE.md kural 4).

export const CHECKOUT_URLS = {
  TRY: {
    monthly: "https://whop.com/checkout/plan_fAMBHwTVE0hR2",
    yearly: "https://whop.com/checkout/plan_UEXO1F5mjIgWB",
  },
  USD: {
    monthly: "https://whop.com/checkout/plan_HIySYESquBqlg",
    yearly: "https://whop.com/checkout/plan_XlA3SacShoiJU",
  },
};

export const PRICES = {
  TRY: { monthly: "₺499,99", yearly: "₺3.999,99", perMonthOfYear: "₺333,33" },
  USD: { monthly: "$11.99", yearly: "$89.99", perMonthOfYear: "$7.50" },
};

export const APP_URL = "https://nexus-web-jre.pages.dev";
export const RELEASES_URL = "https://github.com/Enard52/nexus-releases";
export const MANAGE_URL = "https://whop.com/@me/settings/memberships/";
export const BILLING_URL = "https://whop.com/@me/settings/billing/";
export const SUPPORT_EMAIL = "mailto:nexus.smarthome.app@gmail.com";
export const CONNECTOR_REQUEST_URL = "mailto:nexus.smarthome.app@gmail.com?subject=NEXUS%20Device%20Connector%20Request";

const brand = {
  logoSvg: `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><defs><linearGradient id="lg" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#6f9bff"/><stop offset=".55" stop-color="#5b8dff"/><stop offset="1" stop-color="#8b7bff"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lg)"/><path d="M10.5 22.5V10.5L21.5 22.5V10.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

export const content = {
  en: {
    lang: "en",
    htmlLang: "en",
    canonical: "/",
    alternate: { en: "/", tr: "/tr/" },
    title: "NEXUS — Your smart home, managed on your own network",
    ogImageAlt: "NEXUS smart home app on phone, tablet and desktop",
    description:
      "NEXUS is a local-first smart home app for Windows, Linux and Android. Direct device control over your own local network, responsive automations, and live energy metrics. Free forever; optional NEXUS+ AI plan.",
    nav: [
      ["#features", "Features"],
      ["#how", "How it works"],
      ["#integrations", "Integrations"],
      ["#pricing", "Pricing"],
      ["#downloads", "Download"],
      ["#faq", "FAQ"],
    ],
    navCta: null,
    hero: {
      eyebrow: "Local-first smart home",
      h1a: "Your home.",
      h1b: "Quietly in your control.",
      lead: "One unified app for your lights, climate, covers and sensors — talking directly to the devices on your own local network. Responsive automations, live power metering, and control that keeps working when the internet goes down.",
      primary: { label: "Windows · Linux · Android", href: "#downloads" },
      secondary: null,
      versionNote: "Latest version",
      // Etiket her ekranla birlikte "— <ekran adı>" olarak tamamlanır; bu yüzden
      // "home screen" gibi tek ekrana sabitlenmiş bir metin kullanılmaz.
      shotAlt: "NEXUS app screen",
      trust: [
        "Free, unlimited devices",
        "No cloud required for control",
        "Windows · Linux · Android",
      ],
    },
    features: {
      heading: "Powerful infrastructure. Effortless control.",
      lead: "Every device state, power metric, and automated scene runs directly across your local network without external cloud dependencies.",
      items: [
        [
          "zap",
          "Responsive Automations",
          "Time- and sunset-triggered scenarios execute directly on your local hardware — continuing reliably in the background on desktop.",
        ],
        [
          "gauge",
          "Live Energy Readings",
          "Read real-time wattage and power consumption directly from supported smart plugs and switches on your local network.",
        ],
        [
          "wifi",
          "Local-Network Speed",
          "Direct LAN communication over HTTP, TCP and UDP with the brands listed under Integrations. No cloud hop in the command path.",
        ],
        [
          "lock",
          "Privacy By Design",
          "Your home configuration and device telemetry stay on your local hardware. An account is required to use NEXUS; it stores your setup in your own row under row-level access control. Device commands still go over your LAN.",
        ],
        [
          "sparkles",
          "NEXUS AI Intelligence",
          "Local smart home commands are instant and free forever. Optional cloud AI assistant provides intelligent suggestions whenever you need guidance.",
        ],
        [
          "layers",
          "Open Local Protocols",
          "Direct connectors talk on your LAN. Matter and Zigbee join through your own Home Assistant server — the Integrations section lists what is direct versus bridged.",
        ],
      ],
    },
    how: {
      heading: "From download to connected in minutes.",
      steps: [
        [
          "1",
          "Install & open",
          "Download the native installer for your platform (Windows, Linux, or Android). Then sign in — an account is required to use NEXUS, and it also syncs setup across your screens.",
        ],
        [
          "2",
          "Add your devices",
          "Pick your brand, scan the local network or enter an IP. Brands with a direct connector speak their own protocol — no vendor cloud in that path.",
        ],
        [
          "3",
          "Live your home",
          "Scenes, scheduled automations and real energy readings — from your mobile companion app or your native desktop program.",
        ],
      ],
    },
    integrations: {
      heading: "Works with what you already have.",
      lead: "Free, local protocols first. Anything without a direct connector still works through the Home Assistant bridge.",
      groups: [
        [
          "Local HTTP — on every platform",
          [
            "Shelly Gen1 & Gen2+",
            "Tasmota",
            "WLED",
            "ESPHome",
            "Philips Hue bridge",
            "Home Assistant",
          ],
        ],
        ["Local TCP — desktop app", ["TP-Link Kasa", "Yeelight"]],
      ],
      more: "Something missing? Request a connector",
      moreHref: "javascript:nxOpenContactModal('Connector Request')",
    },
    pricing: {
      heading: "Free to use. NEXUS+ when you want more",
      lead: "",
      currencyNote: "Prices in USD",
      plans: [
        {
          name: "Free",
          price: "$0",
          period: "forever",
          features: [
            "Unlimited devices and rooms across every supported local protocol",
            "Zero cloud dependence: runs locally on your own LAN",
            "30 daily NEXUS AI commands & device actions",
            "Scheduled local automations & custom scenes",
            "Multi-device account sync (rooms, devices, scenes)",
            "100% private: no tracking, no data harvesting",
          ],
          cta: { label: "Windows · Linux · Android", href: "#downloads" },
        },
        {
          name: "NEXUS+",
          price: null,
          period: "per month",
          badge: "Most popular",
          features: [
            "Everything in Free tier included",
            "2,000 NEXUS AI replies a month instead of 30 a day",
            "Ask NEXUS AI to set scenes and answer in plain language",
            "One account, valid on every NEXUS device",
            "Free trial — 3 days monthly, 7 days yearly; cancel at period end",
          ],
          cta: { label: "Start your free trial", monthlyLabel: "Start 3-day free trial", yearlyLabel: "Start 7-day free trial", href: "https://whop.com/checkout/plan_HIySYESquBqlg", yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU" },
        },
        {
          name: "Family",
          price: "Free",
          period: "included with your home",
          badge: "Whole home",
          features: [
            "Household members with role-based access — no member cap",
            "Owner, member, and guest roles",
            "Per-member control, invite, and settings permissions",
            "Scenes and automations sync across your own signed-in devices",
            "Active across Android mobile and desktop apps (Windows, Linux)",
            "Completely included and free with your home",
          ],
          cta: { label: "Included in NEXUS", href: "#downloads" },
          soon: false,
        },
      ],
      manageNote: "Cancel anytime from Billing in the app or from your account on this site. Cancellation takes effect at the end of the current period.",
    },
    downloads: {
      heading: "Native on every desktop. At home on your phone.",
      lead: "Always free. Installers are served from GitHub Releases with published checksums.",
      cards: [
        ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
        ["linux", "terminal", "Linux", "Debian and Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
        [
          "android",
          "smartphone",
          "Android",
          "Android 8.0+ · signed APK",
          "NEXUS-Android.apk",
          ".apk",
        ],
      ],
      versionLabel: "Version",
      sizeLabel: "Size",
      webCard: {
        title: "One account, every screen you install",
        desc: "Native desktop programs for Windows and Linux, and the Android app. Signed in, your rooms, devices, scenes and automations match on each of them.",
        cta: { label: "Download", href: "#downloads" },
      },
      otherOs:
        "On a Mac, iPhone, or another system? You can still download the Windows, Linux and Android installers here. A native package for that system is not published yet.",
      smartScreenNote:
        "Windows may warn about unsigned installers (“unknown publisher”). The file is safe — see checksums.",
    },
    faq: {
      heading: "The important questions, answered.",
      items: [
        [
          "Does NEXUS operate entirely on my local network?",
          "Yes. NEXUS is built on a strict local-first architecture. Your devices, rooms, scenes, and sensor telemetry are processed directly across your own home hardware. Even during internet outages, all local controls, lighting, and automations continue to function seamlessly with zero latency. Signing in securely synchronizes your settings across all your screens.",
        ],
        [
          "Do I need to install NEXUS, or does it run in the browser?",
          "Install the desktop program (Windows or Linux) or the Android app. NEXUS is not offered as a browser app. Device commands go across your own local network. Shelly, Philips Hue, ESPHome, Tasmota, WLED and Home Assistant use local HTTP in the desktop program and on Android. TP-Link Kasa and Yeelight need raw TCP, so they run in the desktop program. This site is for the account, downloads and billing.",
        ],
        [
          "What does the NEXUS+ plan add?",
          "Essential smart home control—unlimited devices, rooms, offline automations, and local dashboards—is free. NEXUS+ includes everything in Free, NEXUS AI for scenes and questions in plain language, 2,000 replies a month, and one account on every device, with a 3-day monthly or 7-day yearly trial. Device commands still run locally. Household roles are included with your home at no extra cost.",
        ],
        [
          "How do automations and scheduled rules run?",
          "The NEXUS automation engine evaluates your schedules and sensor rules on the device you keep running — the desktop app stays in the system tray and executes around the clock, so lighting, energy and security routines never wait for a cloud. Scenes and timers triggered from your phone apply instantly over your LAN. New events fan out to the notification channels you enable on the Instant Notifications page: the in-app strip, system notifications, ntfy, Telegram, or your own HTTPS webhook.",
        ],
        [
          "Which devices and ecosystems are supported?",
          "NEXUS speaks each device's own local protocol: Shelly (Gen1 and Gen2+), Tasmota, WLED, ESPHome, Philips Hue and Home Assistant over local HTTP on every platform, plus TP-Link Kasa and Yeelight over local TCP in the desktop app. Everything else — Matter or Zigbee gear — joins through your own Home Assistant server, which NEXUS treats as a single local hub. Local IP discovery pairs devices instantly, with no vendor cloud in between.",
        ],
        [
          "How are security cameras and sensors integrated?",
          "NEXUS consolidates your security cameras, motion detectors, and entry sensors into a centralized security dashboard. You can automate privacy modes, arm surveillance routines when leaving home, and see every movement or contact event in the app — plus on the notification channels you enable (system notifications, ntfy, Telegram, or your own webhook).",
        ],
        [
          "Can I cancel NEXUS+ anytime?",
          "Yes, completely hassle-free with zero commitments. You can cancel with a single click anytime: from the in-app Account & Billing settings, through our website, or directly from the order link in your billing email receipt. Your premium benefits remain active until the end of your billing cycle with zero future charges.",
        ],
      ],
    },
    about: {
      title: "About NEXUS",
      lead: "An independent, local-first smart home platform designed for speed, absolute privacy, and true hardware ownership. By speaking directly to your devices over your own home network, NEXUS eliminates cloud lock-in forever.",
      manifesto: {
        heading: "Why We Built NEXUS",
        text: "The modern smart home industry took a wrong turn. Proprietary ecosystems forced homeowners into mandatory subscriptions, cloud-dependent lag, and invasive telemetry tracking. When your internet connection goes down, your living room switch shouldn't stop working. We built NEXUS because we believe your home is your sanctuary: your floor plan, your camera states, and your daily family routines belong strictly on your own hardware.",
      },
      pillars: [
        {
          title: "Local-First Speed",
          desc: "Every automation and command executes over your local LAN in milliseconds. No roundtrips to remote cloud servers, zero latency.",
        },
        {
          title: "Uncompromising Privacy",
          desc: "No analytics telemetry, no behavioral profiling, and no selling of your private routines. An account is required; your setup is stored in your own row-level-protected account row. Device commands still stay on your LAN.",
        },
        {
          title: "No Vendor Lock-In",
          desc: "Open local protocols first: Shelly, Philips Hue, ESPHome, Tasmota and WLED answer NEXUS directly, and anything else joins through your own Home Assistant server instead of a vendor cloud.",
        },
        {
          title: "Honest, Sustainable SaaS",
          desc: "Core smart home management is completely free and unlimited forever. NEXUS+ is the NEXUS AI plan and helps cover that cloud usage.",
        },
      ],
      architecture: {
        heading: "Engineered for Reliability",
        lead: "NEXUS keeps a lightweight desktop engine in your system tray so schedules and sensor rules keep evaluating while your computer is on, and the mobile app opens straight onto the same local network.",
        items: [
          { icon: "layers", title: "Desktop", desc: "The Windows and Linux apps stay in the system tray and keep local schedules and sensor rules running while the computer is on." },
          { icon: "wifi", title: "Phone", desc: "The Android app opens onto the same local network; device commands still go across your LAN." },
          { icon: "lock", title: "Account", desc: "An account is required so rooms, devices and scenes match on every screen. Device commands do not leave your home network." },
        ],
      },
      linksTitle: "Practical links",
    },
    footer: {
      tagline:
        "Smart home control that talks to your devices directly on your own network — no vendor cloud in the middle. Automations keep running when the internet goes down. An account is required; it syncs your setup across your screens.",
      product: "Product",
      productLinks: [
        ["Features", "#features"],
        ["Pricing", "#pricing"],
        ["Download", "#downloads"],
        ["FAQ", "#faq"],
        ["About", "/about"],
      ],
      account: "Customer & Support",
      accountLinks: [
        ["Contact & Technical Support", "javascript:nxOpenContactModal('Technical Support')"],
        ["Release Notes & Community", RELEASES_URL],
        ["Download Apps", "#downloads"],
      ],
      legal: "Legal",
      legalLinks: [
        ["Privacy", "/privacy"],
        ["Terms", "/terms"],
        ["Refunds", "/refund"],
      ],
      rights: "All rights reserved.",
      langSwitchLabel: "Türkçe",
      langSwitchHref: "/tr/",
    },
  },

  tr: {
    lang: "tr",
    htmlLang: "tr",
    canonical: "/tr/",
    alternate: { en: "/", tr: "/tr/" },
    title: "NEXUS — Akıllı evin, kendi ağında, senin kontrolünde",
    ogImageAlt: "Telefon, tablet ve bilgisayarda NEXUS akıllı ev uygulaması",
    description:
      "NEXUS; Windows, Linux ve Android için yerel-öncelikli akıllı ev uygulaması. Cihazlarınızla yerel ağınızda doğrudan iletişim, kesintisiz çalışan otomasyonlar ve anlık enerji ölçümleri. Ücretsiz; isteğe bağlı NEXUS+ yapay zekâ planı.",
    nav: [
      ["#features", "Özellikler"],
      ["#how", "Nasıl çalışır"],
      ["#integrations", "Entegrasyonlar"],
      ["#pricing", "Fiyatlar"],
      ["#downloads", "İndir"],
      ["#faq", "SSS"],
    ],
    navCta: null,
    hero: {
      eyebrow: "Yerel-öncelikli akıllı ev",
      h1a: "Evini.",
      h1b: "Sessizce kontrol et.",
      lead: "Işıklarınız, iklimlendirmeniz, perdeleriniz ve sensörleriniz tek uygulamada — bulut aracılarına ihtiyaç duymadan, doğrudan yerel ağınız üzerinden haberleşir. Kesintisiz otomasyonlar, canlı enerji ölçümleri ve internet kesilse de durmayan bir kontrol mimarisi.",
      primary: { label: "Windows · Linux · Android", href: "#downloads" },
      secondary: null,
      versionNote: "Güncel sürüm",
      shotAlt: "NEXUS uygulama ekranı",
      trust: [
        "Ücretsiz, sınırsız cihaz",
        "Kontrol için bulut şart değil",
        "Windows · Linux · Android",
      ],
    },
    features: {
      heading: "Güçlü yerel altyapı. Zahmetsiz kontrol.",
      lead: "Tüm cihaz durumları, ölçümler ve senaryolar bulut sunucularına bağımlı olmadan doğrudan yerel ağınızda işlenir.",
      items: [
        [
          "zap",
          "Kesintisiz Yerel Otomasyonlar",
          "Saat ve gün batımı tetikleyicili senaryolar cihazlarınızda doğrudan yerel olarak yürütülür; masaüstünde arka planda sessizce çalışmaya devam eder.",
        ],
        [
          "gauge",
          "Canlı Enerji Ölçümleri",
          "Desteklenen akıllı priz ve anahtarlardan anlık watt ve güç tüketimi verilerini kendi yerel ağınız üzerinden gerçek zamanlı izleyin.",
        ],
        [
          "wifi",
          "Yerel Ağ Hızı",
          "Entegrasyonlar bölümündeki markalarla HTTP, TCP ve UDP üzerinden doğrudan yerel iletişim. Komut yolunda bulut yok.",
        ],
        [
          "lock",
          "Tasarımdan Gelen Gizlilik",
          "Ev düzenin ve cihaz verilerin yerel cihazında işlenir. NEXUS için hesap gerekir; senkron, kurulumunu satır bazlı erişim denetimi (RLS) korumalı kendi hesap satırına taşır. Cihaz komutları yine yerel ağında kalır.",
        ],
        [
          "sparkles",
          "NEXUS AI Asistanı",
          "Yerel akıllı ev komutları her zaman ücretsiz ve anında yanıt verir. İsteğe bağlı bulut yapay zekâsı ihtiyaç duyduğunuz her an yanınızda.",
        ],
        [
          "layers",
          "Açık Yerel Protokoller",
          "Doğrudan bağlayıcılar yerel ağında konuşur. Matter ve Zigbee kendi Home Assistant sunucun üzerinden katılır — hangisinin doğrudan olduğunu Entegrasyonlar listeler.",
        ],
      ],
    },
    how: {
      heading: "İndirmeden bağlanmaya dakikalar.",
      steps: [
        [
          "1",
          "Kur ve aç",
          "Platformuna uygun kurulum dosyasını indir (Windows, Linux veya Android). Sonra giriş yap: NEXUS için hesap gerekir; kurulumun da ekranlar arasında eşitlenir.",
        ],
        [
          "2",
          "Cihazlarını ekle",
          "Markanı seç, yerel ağı tara veya IP gir. Doğrudan bağlayıcısı olan markalar kendi protokolünde konuşur; o yolda üretici bulutu yok.",
        ],
        [
          "3",
          "Evinin tadını çıkar",
          "Sahneler, zamanlanmış otomasyonlar ve gerçek enerji okumaları — telefonundaki mobil uygulamadan veya bilgisayarındaki masaüstü programından.",
        ],
      ],
    },
    integrations: {
      heading: "Elindeki cihazlarla çalışır.",
      lead: "Önce ücretsiz, yerel protokoller. Doğrudan bağlayıcısı olmayan her şey Home Assistant köprüsüyle çalışır.",
      groups: [
        [
          "Yerel HTTP — her platformda",
          [
            "Shelly Gen1 & Gen2+",
            "Tasmota",
            "WLED",
            "ESPHome",
            "Philips Hue köprüsü",
            "Home Assistant",
          ],
        ],
        ["Yerel TCP — masaüstü uygulamasında", ["TP-Link Kasa", "Yeelight"]],
      ],
      more: "Eksik bir şey mi var? Bağlayıcı iste",
      moreHref: "javascript:nxOpenContactModal('Cihaz & Bağlayıcı İsteği')",
    },
    pricing: {
      heading: "Ücretsiz kullan. Daha fazlasını istersen NEXUS+",
      lead: "",
      currencyNote: "Fiyatlar TL cinsinden",
      plans: [
        {
          name: "Ücretsiz",
          price: "₺0",
          period: "sonsuza dek",
          features: [
            "Sınırsız cihaz ve oda — desteklenen tüm yerel protokoller",
            "Sıfır bulut bağımlılığı: Kendi yerel ağınızda kesintisiz çalışma",
            "Günde 30 NEXUS AI komutu ve yerel cihaz kontrolü",
            "Zamanlanmış yerel otomasyonlar ve özel sahneler",
            "Çoklu cihaz hesap senkronizasyonu (odalar, cihazlar, sahneler)",
            "Tam gizlilik: Reklam izleyicisi ve veri ticareti yok",
          ],
          cta: { label: "Windows · Linux · Android", href: "#downloads" },
        },
        {
          name: "NEXUS+",
          price: null,
          period: "aylık",
          badge: "En çok tercih edilen",
          features: [
            "Ücretsiz plandaki tüm özellikler dahil",
            "Günde 30 yerine ayda 2.000 NEXUS AI yanıtı",
            "NEXUS AI ile doğal dille senaryo kur ve evin hakkında soru sor",
            "Tek hesap, tüm NEXUS cihazlarında geçerli",
            "3 gün (aylık) / 7 gün (yıllık) deneme; dönem sonunda iptal",
          ],
          cta: { label: "Ücretsiz denemeyi başlat", monthlyLabel: "3 gün ücretsiz dene", yearlyLabel: "7 gün ücretsiz dene", href: "https://whop.com/checkout/plan_fAMBHwTVE0hR2", yearlyHref: "https://whop.com/checkout/plan_UEXO1F5mjIgWB" },
        },
        {
          name: "Aile",
          price: "Ücretsiz",
          period: "evinizle birlikte dahil",
          badge: "Tüm ev için",
          features: [
            "Rol bazlı ev halkı yönetimi — üye sayısı sınırı yok",
            "Ev sahibi, üye ve misafir rolleri",
            "Üye başına kontrol, davet ve ayar yetkileri",
            "Sahneler ve otomasyonlar giriş yaptığın tüm cihazlarında senkron",
            "Tüm platformlarda (Android mobil, Windows ve Linux masaüstü) aktif",
            "Evinizle birlikte tamamen ücretsiz ve sınırsız",
          ],
          cta: { label: "Uygulamada Dahil", href: "#downloads" },
          soon: false,
        },
      ],
      manageNote: "İptal, uygulamadaki Faturalandırma'dan veya bu sitedeki hesabından yapılır. Dönem sonunda geçerli olur.",
    },
    downloads: {
      heading: "Her masaüstünde yerli, telefonunda evinde.",
      lead: "Hepsi ücretsiz. Kurulum dosyaları sağlama (checksum) değerleriyle GitHub Releases üzerinden sunulur.",
      cards: [
        ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
        ["linux", "terminal", "Linux", "Debian ve Ubuntu · .deb", "NEXUS-linux.deb", ".deb"],
        [
          "android",
          "smartphone",
          "Android",
          "Android 8.0+ · imzalı APK",
          "NEXUS-Android.apk",
          ".apk",
        ],
      ],
      versionLabel: "Sürüm",
      sizeLabel: "Boyut",
      webCard: {
        title: "Tek hesap, kurduğun her ekranda",
        desc: "Windows ve Linux için masaüstü programı, Android için mobil uygulama. Giriş yaptığında odaların, cihazların, sahnelerin ve otomasyonların hepsinde aynı kalır.",
        cta: { label: "İndir", href: "#downloads" },
      },
      otherOs:
        "Mac, iPhone veya başka bir sistemdeysen de Windows, Linux ve Android kurulumlarını buradan indirebilirsin. O sistem için ayrı bir paket henüz yok.",
      smartScreenNote:
        "Windows imzasız kurulumlar için uyarı verebilir (“bilinmeyen yayıncı”). Dosya güvenlidir — sağlama değerlerine bak.",
    },
    faq: {
      heading: "Önemli sorular, net yanıtlar.",
      items: [
        [
          "Verilerim ve ev kontrollerim gerçekten yerel mi çalışır?",
          "Evet. NEXUS, yerel-öncelikli (local-first) mimariyle çalışır. Cihazlarınız, odalarınız, otomasyonlarınız ve sensör verileriniz doğrudan kendi ev ağınızdaki donanımlarınız arasında işlenir. İnternet bağlantınız kesilse dahi tüm yerel anahtarlar, sahneler ve otomasyonlar anında çalışmaya devam eder. Giriş yaptığında ise kurulumun TLS ve satır bazlı erişim denetimi (RLS) altındaki kendi hesabına senkronize olur; kontrol için bu senkron zorunlu değildir.",
        ],
        [
          "NEXUS'ı tarayıcıdan kullanabilir miyim, yoksa program veya mobil uygulama kurmak şart mı?",
          "Masaüstü programını (Windows veya Linux) ya da Android uygulamasını kurman gerekir. NEXUS ayrı bir tarayıcı uygulaması olarak sunulmuyor. Cihaz komutları kendi yerel ağından gider. Shelly, Philips Hue, ESPHome, Tasmota, WLED ve Home Assistant yerel HTTP ile masaüstünde ve Android'de çalışır. TP-Link Kasa ve Yeelight ham TCP istediği için masaüstü programındadır. Bu site hesap, indirme ve faturalandırma içindir.",
        ],
        [
          "NEXUS+ aboneliği tam olarak ne sağlar?",
          "Temel akıllı ev yönetimi, sınırsız cihaz, oda ve yerel otomasyon ücretsizdir. NEXUS+ ücretsiz plandaki her şeyi, NEXUS AI ile doğal dille senaryo ve soruyu, ayda 2.000 yanıtı ve tüm cihazlarında geçerli tek hesabı kapsar; aylıkta 3, yıllıkta 7 gün deneme vardır. Cihaz komutları yerelde çalışır. Ev halkı rolleri evinle birlikte ücretsizdir.",
        ],
        [
          "Otomasyonlar ve zamanlanmış kurallar nasıl çalışır?",
          "NEXUS otomasyon motoru kurallarını ve zamanlayıcılarını NEXUS'u çalıştırdığın cihazda yürütür: masaüstü programı sistem tepsisinde arka planda kalarak gün boyu izler ve uygular, böylece aydınlatma, enerji ve güvenlik rutinleri bulutu beklemez. Telefondan tetiklediğin sahneler ve zamanlayıcılar yerel ağndan anında uygulanır. Yeni olaylar, Anlık Bildirimler sayfasında açtığın kanallara dağıtılır: uygulama içi bildirim şeridi, sistem bildirimi, ntfy, Telegram veya kendi HTTPS webhook'un.",
        ],
        [
          "Hangi cihazlar ve markalar destekleniyor?",
          "NEXUS; Shelly (Gen1 ve Gen2+), Tasmota, WLED, ESPHome, Philips Hue ve Home Assistant'ı her platformda yerel HTTP ile, TP-Link Kasa ve Yeelight'i masaüstü uygulamasında yerel TCP ile yönetir. Matter veya Zigbee cihazları kendi Home Assistant sunucun üzerinden katılır; NEXUS onu tek bir yerel merkez görür. Yerel IP keşfi cihazları bulut aracı olmadan anında eşleştirir.",
        ],
        [
          "Güvenlik kameraları ve sensörler nasıl entegre edilir?",
          "NEXUS; güvenlik kameralarınızın durumunu, gizlilik modlarını, hareket dedektörlerini ve kapı/pencere sensörlerini birleşik güvenlik merkezinde sunar. 'Evden Ayrılış' modunda kameraları ve sensörleri devreye sokabilir, 'Evdeyim' modunda gizlilik perdelerini otomatik kapatabilir, tüm güvenlik olaylarını anlık yerel bildirimlerle takip edebilirsiniz.",
        ],
        [
          "NEXUS+ aboneliğimi dilediğim an iptal edebilir miyim?",
          "Evet, hiçbir taahhüt ve bağlayıcılık yoktur. Aboneliğinizi dilediğiniz an tek tıkla iptal edebilirsiniz: İster uygulama içerisindeki Hesap & Faturalandırma menüsünden, ister web sitemizden, isterseniz de sipariş e-posta makbuzunuz üzerinden hemen yönetebilirsiniz. İptal ettiğinizde mevcut döneminiz boyunca tüm ayrıcalıklarınız korunur ve sonraki dönem için hiçbir ücret alınmaz.",
        ],
      ],
    },
    about: {
      title: "NEXUS Hakkında",
      lead: "Akıllı evinizin kontrolü yalnızca sizin elinizde olmalıdır. Hız, sıfır bulut bağımlılığı ve tavizsiz gizlilik için inşa edilen yeni nesil yerel akıllı ev platformu.",
      manifesto: {
        heading: "Neden NEXUS Doğdu?",
        text: "Modern akıllı ev pazarı ne yazık ki kullanıcıları üretici bulutlarına, zorunlu abonelik duvarlarına ve gecikmeli sunucu yanıtlarına hapsetti. İnternetiniz koptuğunda evinizdeki ışığın yanmaması veya salonunuzdaki kameranın yabancı sunuculara veri aktarması kabul edilemez. NEXUS; evinize ait tüm kontrolün, senaryoların ve sensör verilerinin sadece sizin yerel ağınızda (LAN) ve donanımlarınızda kalması gerektiği inancıyla bağımsız olarak geliştirildi.",
      },
      pillars: [
        {
          title: "Tavizsiz Yerel Hız",
          desc: "Tüm komutlar ve otomasyonlar milisaniyeler içinde doğrudan cihazın yerel IP adresine iletilir. Sıfır bulut gecikmesi, internetten bağımsız kesintisiz çalışma.",
        },
        {
          title: "Gerçek Veri Mahremiyeti",
          desc: "Evinizin kat planı, oda isimleri ve kullanım alışkanlıklarınız satılmaz, profillenmez ve reklam hedeflemesi için kullanılmaz. NEXUS için hesap gerekir; senkron listesindeki tanımlar kendi hesabına taşınır. Cihaz komutları yerel ağında kalır.",
        },
        {
          title: "Sıfır Marka Kilidi",
          desc: "Shelly, Hue, ESPHome, Tasmota ve WLED doğrudan yerel protokolleriyle tek panodan yönetilir; Sonoff, Matter ve Zigbee cihazları ise kendi Home Assistant sunucun üzerinden katılır.",
        },
        {
          title: "Dürüst ve Şeffaf Model",
          desc: "Temel akıllı ev kontrolü, sınırsız oda ve cihaz herkes için ücretsizdir. NEXUS+ NEXUS AI planıdır ve o bulut kullanımının maliyetini karşılar.",
        },
      ],
      architecture: {
        heading: "Güvenilirlik Odaklı Mühendislik",
        lead: "NEXUS; masaüstünde sistem tepsisinde 7/24 arka planda nöbet tutan ultra hafif çekirdeği ve mobilde optimize edilmiş yerel köprüleriyle evinizi her an senkronize tutar.",
        items: [
          { icon: "layers", title: "Masaüstü", desc: "Windows ve Linux uygulaması sistem tepsisinde kalır; bilgisayar açıkken yerel zamanlayıcılar ve sensör kuralları çalışmaya devam eder." },
          { icon: "wifi", title: "Telefon", desc: "Android uygulaması aynı yerel ağa açılır; cihaz komutları yine LAN üzerinden gider." },
          { icon: "lock", title: "Hesap", desc: "Hesap gerekir ki odalar, cihazlar ve sahneler her ekranda aynı olsun. Cihaz komutları ev ağından çıkmaz." },
        ],
      },
      linksTitle: "Pratik bağlantılar",
    },
    footer: {
      tagline:
        "Tüm akıllı ev cihazlarınızı bulut aracı olmadan, doğrudan yerel ağınızda birleştiren modern kontrol platformu. NEXUS için hesap gerekir; giriş yaptıktan sonra kurulumun kendi hesabına senkronize olur. Cihaz komutları yerel ağında kalır.",
      product: "Ürün",
      productLinks: [
        ["Özellikler", "#features"],
        ["Fiyatlar", "#pricing"],
        ["İndir", "#downloads"],
        ["SSS", "#faq"],
        ["Hakkında", "/tr/about"],
      ],
      account: "Müşteri & Destek",
      accountLinks: [
        ["İletişim ve Teknik Destek", "javascript:nxOpenContactModal('Teknik Destek')"],
        ["Sürüm Notları ve Topluluk", RELEASES_URL],
        ["Uygulama İndir", "#downloads"],
      ],
      legal: "Yasal",
      legalLinks: [
        ["Gizlilik", "/tr/privacy"],
        ["Şartlar", "/tr/terms"],
        ["İade", "/tr/refund"],
      ],
      rights: "Tüm hakları saklıdır.",
      langSwitchLabel: "English",
      langSwitchHref: "/",
    },
  },
};

export function priceFor(lang) {
  // Türkçe arayüz TL, diğer diller USD (cloud-sync.js ile aynı kural)
  return lang === "tr" ? PRICES.TRY : PRICES.USD;
}

export { brand };
