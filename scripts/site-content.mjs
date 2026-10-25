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
export const ISSUES_URL = "https://github.com/Enard52/NEXUS/issues";
export const MANAGE_URL = "https://whop.com/@me/settings/memberships/";

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
    description:
      "NEXUS is a local-first smart home app for Windows, Linux, Android and the web. Direct device control over your own local network, responsive automations, and live energy metrics. Free forever; optional NEXUS+ AI plan.",
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
      lead: "One unified app for your lights, climate, covers and sensors — communicating directly with devices on your local network. Responsive automations, live power metering, and a privacy architecture where your data never leaves your devices.",
      primary: { label: "Download NEXUS", href: "#downloads" },
      secondary: null,
      versionNote: "Latest version",
      shotAlt: "NEXUS home screen on a phone",
      trust: [
        "Free, unlimited devices",
        "No cloud required for control",
        "Windows · Linux · Android · Web",
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
          "Direct LAN communication with Shelly, Tasmota, WLED, ESPHome, Philips Hue and Home Assistant via HTTP, TCP and UDP. Zero cloud lag.",
        ],
        [
          "lock",
          "Privacy By Design",
          "Your home configuration and device telemetry stay strictly on your local hardware. Optional sync is end-to-end scoped and never required for control.",
        ],
        [
          "sparkles",
          "NEXUS AI Intelligence",
          "Local smart home commands are instant and free forever. Optional cloud AI assistant provides intelligent suggestions whenever you need guidance.",
        ],
        [
          "layers",
          "Matter, Zigbee & Ecosystem Ready",
          "Shelly, Home Assistant, WLED, MQTT and Matter bridges unite under one intuitive interface — giving you complete hardware freedom.",
        ],
      ],
    },
    how: {
      heading: "From download to connected in minutes.",
      steps: [
        [
          "1",
          "Install & open",
          "Download the native installer for your platform (Windows, Linux, or Android). Create an account to securely sync your setup across all your screens.",
        ],
        [
          "2",
          "Add your devices",
          "Pick your brand, scan the local network or enter an IP. NEXUS talks the device's own protocol; no vendor bridge needed.",
        ],
        [
          "3",
          "Live your home",
          "Control panels, scenes, scheduled automations and real energy readings — from your pocket, your desktop or your browser.",
        ],
      ],
    },
    integrations: {
      heading: "Works with what you already have.",
      lead: "Free, local protocols first. Anything without a direct connector still works through the Home Assistant bridge.",
      groups: [
        [
          "HTTP — everywhere",
          [
            "Shelly Gen1 & Gen2+",
            "Tasmota",
            "WLED",
            "ESPHome",
            "Philips Hue bridge",
            "Home Assistant",
            "Sonoff DIY",
          ],
        ],
        ["TCP / UDP — desktop app", ["TP-Link Kasa", "Yeelight", "WiZ", "LIFX", "Govee LAN"]],
      ],
      more: "Something missing? Request a connector",
      moreHref: ISSUES_URL,
    },
    pricing: {
      heading: "Free to use. NEXUS+ when you want more.",
      lead: "No device or room limits — core smart home control is always free. NEXUS+ expands your cloud AI allowance with priority model access.",
      currencyNote: "Prices in USD",
      plans: [
        {
          name: "Free",
          price: "$0",
          period: "forever",
          features: [
            "Unlimited devices & rooms (Shelly, HomeKit, WLED, etc.)",
            "Zero cloud dependence: runs locally on your own LAN",
            "30 daily NEXUS AI commands & device actions",
            "Scheduled local automations & custom scenes",
            "Multi-device account sync (rooms, devices, scenes)",
            "100% private: no tracking, no data harvesting",
          ],
          cta: { label: "Download NEXUS", href: "#downloads" },
        },
        {
          name: "NEXUS+",
          price: null,
          period: "per month",
          badge: "Most popular",
          features: [
            "Everything in Free tier included",
            "2,000 monthly NEXUS AI responses & automation creation",
            "Priority Cloudflare Workers AI model access & low latency",
            "Early access to new AI features & beta connectors",
            "Direct support for independent, ad-free development",
            "Priority VIP customer support & 3-day free trial",
          ],
          cta: { label: "Start 3-day free trial", href: "https://whop.com/checkout/plan_HIySYESquBqlg", yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU" },
        },
        {
          name: "Family",
          price: "Free",
          period: "included with your home",
          badge: "Whole home",
          features: [
            "Household management for up to 6 members",
            "Admin, member, and guest permission roles",
            "Per-room and per-device custom access control",
            "Shared family automations & synchronized scenes",
            "Active across mobile, desktop, and web apps",
            "Completely included and free with your home",
          ],
          cta: { label: "Included in NEXUS", href: "#downloads" },
          soon: false,
        },
      ],
      manageNote: "Manage or cancel your subscription anytime from Billing in the app.",
    },
    downloads: {
      heading: "Native on every desktop. At home on your phone.",
      lead: "Always free. Installers are served from GitHub Releases with published checksums.",
      cards: [
        ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
        ["linux", "terminal", "Linux", "AppImage & .deb", "NEXUS-linux.AppImage", ".AppImage"],
        [
          "android",
          "smartphone",
          "Android",
          "Android 8+ · signed APK",
          "NEXUS-Android.apk",
          ".apk",
        ],
      ],
      versionLabel: "Version",
      sizeLabel: "Size",
      webCard: {
        title: "Web & iOS (PWA)",
        desc: "Nothing to install — or add it to your home screen from the browser for an app-like experience.",
        cta: { label: "Open web app", href: APP_URL },
      },
      smartScreenNote:
        "Windows may warn about unsigned installers (“unknown publisher”). The file is safe — see checksums.",
    },
    faq: {
      heading: "The important questions, answered.",
      items: [
        [
          "Is my data really local?",
          "Yes. Devices, rooms, scenes and automations are stored on your device. Optional account sync (Supabase) only carries your profile and app settings if you sign in. Device control itself never needs the cloud.",
        ],
        [
          "What does NEXUS+ actually add?",
          "A larger allowance for the optional cloud AI chat: 2,000 answers a month instead of 30 a day. Everything else — devices, scenes, automations, energy readings — is free and stays free.",
        ],
        [
          "Do automations run when the app is closed?",
          "On desktop, yes while NEXUS stays in the system tray (its default). On Android and the web, automations run while the app is open — the interface says this plainly. Full background scheduling on Android is on the roadmap.",
        ],
        [
          "Which devices are supported?",
          "Shelly, Tasmota, WLED, ESPHome, Philips Hue (bridge), Sonoff DIY and Home Assistant work everywhere; Kasa, Yeelight, WiZ, LIFX and Govee LAN use desktop TCP/UDP bridges. Matter/Zigbee devices work via the Home Assistant bridge.",
        ],
        [
          "Is there a camera view?",
          "The Cameras screen lists your real camera devices with status and privacy state. Live video streaming (RTSP) is not built in yet — the app tells you so instead of showing placeholders.",
        ],
        [
          "Can I cancel NEXUS+ anytime?",
          "Yes — from Billing in the app or your Whop account. Your home keeps working exactly the same; only the AI allowance returns to the free tier.",
        ],
      ],
    },
    about: {
      title: "About NEXUS",
      lead: "NEXUS is an independent, local-first smart home platform designed for speed, privacy, and true device ownership. By communicating directly with your hardware over the local network, NEXUS delivers instant responsiveness with zero cloud dependencies.",
      body: [
        "The platform puts privacy and sustainability first: your devices and routines remain strictly on your own hardware, without telemetry tracking, data harvesting, or mandatory subscription fees.",
        "The optional NEXUS+ subscription powers cloud-assisted AI features, keeping the core smart home infrastructure free, robust, and accessible for everyone.",
      ],
      linksTitle: "Practical links",
    },
    footer: {
      tagline: "Local-first smart home platform, privacy-focused and built for speed.",
      product: "Product",
      productLinks: [
        ["Features", "#features"],
        ["Pricing", "#pricing"],
        ["Download", "#downloads"],
        ["FAQ", "#faq"],
        ["About", "/about.html"],
      ],
      account: "Customer & Account",
      accountLinks: [
        ["Manage Subscriptions & Billing", MANAGE_URL],
        ["License Keys", MANAGE_URL],
        ["Order & Invoice History", MANAGE_URL],
        ["Customer & License Support", "https://github.com/Enard52/NEXUS/issues"],
        ["Community & Discussions", "https://github.com/Enard52/NEXUS/discussions"],
      ],
      legal: "Legal",
      legalLinks: [
        ["Privacy", "/privacy.html"],
        ["Terms", "/terms.html"],
        ["Refunds", "/refund.html"],
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
    description:
      "NEXUS; Windows, Linux, Android ve web için yerel-öncelikli akıllı ev uygulaması. Cihazlarınızla yerel ağınızda doğrudan iletişim, kesintisiz çalışan otomasyonlar ve anlık enerji ölçümleri. Ücretsiz; isteğe bağlı NEXUS+ yapay zekâ planı.",
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
      lead: "Işıklarınız, iklimlendirmeniz, perdeleriniz ve sensörleriniz tek uygulamada — bulut aracılarına ihtiyaç duymadan, doğrudan yerel ağınız üzerinden haberleşir. Kesintisiz otomasyonlar, canlı enerji ölçümleri ve ev verinizin yalnızca sizde kaldığı güvenli mimari.",
      primary: { label: "NEXUS'u indir", href: "#downloads" },
      secondary: null,
      versionNote: "Güncel sürüm",
      shotAlt: "Telefonda NEXUS ana ekranı",
      trust: [
        "Ücretsiz, sınırsız cihaz",
        "Kontrol için bulut şart değil",
        "Windows · Linux · Android · Web",
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
          "Shelly, Tasmota, WLED, ESPHome, Philips Hue ve Home Assistant ile HTTP, TCP ve UDP üzerinden doğrudan iletişim. Sıfır gecikme.",
        ],
        [
          "lock",
          "Tasarımdan Gelen Gizlilik",
          "Ev düzeniniz ve cihaz verileriniz cihazınızda saklanır. İsteğe bağlı hesap senkronizasyonu uçtan uca güvenlidir ve kontrol için asla zorunlu değildir.",
        ],
        [
          "sparkles",
          "NEXUS AI Asistanı",
          "Yerel akıllı ev komutları her zaman ücretsiz ve anında yanıt verir. İsteğe bağlı bulut yapay zekâsı ihtiyaç duyduğunuz her an yanınızda.",
        ],
        [
          "layers",
          "Matter, Zigbee ve Köprü Uyumu",
          "Shelly, Home Assistant, WLED, MQTT ve Matter köprüleri tek bir sezgisel arayüzde birleşir; dilediğiniz donanımı özgürce seçin.",
        ],
      ],
    },
    how: {
      heading: "İndirmeden bağlanmaya dakikalar.",
      steps: [
        [
          "1",
          "Kur ve aç",
          "Platformuna uygun kurulum dosyasını indir (Windows, Linux veya Android). Cihazlar arası güvenli senkronizasyon için hesabını oluştur.",
        ],
        [
          "2",
          "Cihazlarını ekle",
          "Markanı seç, yerel ağı tara veya IP gir. NEXUS cihazın kendi protokolüyle konuşur; üretici köprüsü gerekmez.",
        ],
        [
          "3",
          "Evinin tadını çıkar",
          "Kontrol panelleri, sahneler, zamanlanmış otomasyonlar ve gerçek enerji okumaları — telefonundan, masaüstünden veya tarayıcından.",
        ],
      ],
    },
    integrations: {
      heading: "Elindeki cihazlarla çalışır.",
      lead: "Önce ücretsiz, yerel protokoller. Doğrudan bağlayıcısı olmayan her şey Home Assistant köprüsüyle çalışır.",
      groups: [
        [
          "HTTP — her yerde",
          [
            "Shelly Gen1 & Gen2+",
            "Tasmota",
            "WLED",
            "ESPHome",
            "Philips Hue köprüsü",
            "Home Assistant",
            "Sonoff DIY",
          ],
        ],
        ["TCP / UDP — masaüstü", ["TP-Link Kasa", "Yeelight", "WiZ", "LIFX", "Govee LAN"]],
      ],
      more: "Eksik bir şey mi var? Bağlayıcı iste",
      moreHref: ISSUES_URL,
    },
    pricing: {
      heading: "Ücretsiz kullan. Daha fazlasını istersen NEXUS+.",
      lead: "Cihaz veya oda sınırı yok, temel kullanım hep ücretsiz. NEXUS+ ile bulut yapay zekâ kotanızı artırın ve öncelikli model erişimi kazanın.",
      currencyNote: "Fiyatlar TL cinsinden",
      plans: [
        {
          name: "Ücretsiz",
          price: "₺0",
          period: "sonsuza dek",
          features: [
            "Sınırsız cihaz ve oda (Shelly, HomeKit, WLED, ESPHome vb.)",
            "Sıfır bulut bağımlılığı: Kendi yerel ağınızda kesintisiz çalışma",
            "Günde 30 NEXUS AI komutu ve yerel cihaz kontrolü",
            "Zamanlanmış yerel otomasyonlar ve özel sahneler",
            "Çoklu cihaz hesap senkronizasyonu (odalar, cihazlar, sahneler)",
            "Tam gizlilik: Reklam izleyicisi ve veri ticareti yok",
          ],
          cta: { label: "NEXUS'u İndir", href: "#downloads" },
        },
        {
          name: "NEXUS+",
          price: null,
          period: "aylık",
          badge: "En çok tercih edilen",
          features: [
            "Ücretsiz plandaki tüm özellikler dahil",
            "Ayda 2.000 NEXUS AI yanıtı (Doğal dille senaryo ve kural üretimi)",
            "Öncelikli Cloudflare Workers AI model erişimi ve düşük gecikme",
            "Yeni AI yeteneklerine ve beta entegrasyonlara erken erişim",
            "Bağımsız, reklamsız ve açık standartlı gelişime doğrudan destek",
            "Öncelikli VIP e-posta destek hattı",
            "3 günlük ücretsiz deneme (Aylık) / 7 gün (Yıllık), dilediğin an iptal",
          ],
          cta: { label: "3 gün ücretsiz dene", href: "https://whop.com/checkout/plan_fAMBHwTVE0hR2", yearlyHref: "https://whop.com/checkout/plan_UEXO1F5mjIgWB" },
        },
        {
          name: "Aile",
          price: "Ücretsiz",
          period: "evinizle birlikte dahil",
          badge: "Tüm ev için",
          features: [
            "6 üyeye kadar aile ve ev halkı yönetimi",
            "Yönetici, üye ve misafir yetki rolleri",
            "Oda ve cihaz bazlı özel erişim izinleri",
            "Ortak otomasyonlar ve paylaşılan aile sahneleri",
            "Tüm platformlarda (Android, masaüstü, web) aktif",
            "Evinizle birlikte tamamen ücretsiz ve sınırsız",
          ],
          cta: { label: "Uygulamada Dahil", href: "#downloads" },
          soon: false,
        },
      ],
      manageNote: "Aboneliğini dilediğin an uygulamadaki Faturalandırma'dan yönet veya iptal et.",
    },
    downloads: {
      heading: "Her masaüstünde yerli, telefonunda evinde.",
      lead: "Hepsi ücretsiz. Kurulum dosyaları sağlama (checksum) değerleriyle GitHub Releases üzerinden sunulur.",
      cards: [
        ["windows", "monitor", "Windows", "Windows 10/11 · 64-bit", "NEXUS-Setup.exe", ".exe"],
        ["linux", "terminal", "Linux", "AppImage ve .deb", "NEXUS-linux.AppImage", ".AppImage"],
        [
          "android",
          "smartphone",
          "Android",
          "Android 8+ · imzalı APK",
          "NEXUS-Android.apk",
          ".apk",
        ],
      ],
      versionLabel: "Sürüm",
      sizeLabel: "Boyut",
      webCard: {
        title: "Web ve iOS (PWA)",
        desc: "Kurulum yok — ya da tarayıcıdan ana ekrana ekleyerek uygulama deneyimi yaşa.",
        cta: { label: "Web uygulamasını aç", href: APP_URL },
      },
      smartScreenNote:
        "Windows imzasız kurulumlar için uyarı verebilir (“bilinmeyen yayıncı”). Dosya güvenlidir — sağlama değerlerine bak.",
    },
    faq: {
      heading: "Önemli sorular, net yanıtlar.",
      items: [
        [
          "Verim gerçekten yerel mi?",
          "Evet. Cihazlar, odalar, sahneler ve otomasyonlar cihazında saklanır. İsteğe bağlı hesap senkronu (Supabase) yalnızca giriş yaparsan profil ve uygulama ayarlarını taşır. Cihaz kontrolünün kendisi bulut gerektirmez.",
        ],
        [
          "NEXUS+ tam olarak ne ekliyor?",
          "İsteğe bağlı bulut AI sohbeti için daha büyük kota: günde 30 yanıt yerine ayda 2.000 yanıt. Diğer her şey — cihazlar, sahneler, otomasyonlar, enerji okumaları — ücretsiz ve ücretsiz kalacak.",
        ],
        [
          "Uygulama kapalıyken otomasyonlar çalışır mı?",
          "Masaüstünde evet — NEXUS tepside kaldığı sürece (varsayılan davranış). Android ve web'de otomasyonlar uygulama açıkken çalışır; arayüz bunu açıkça yazar. Android'de tam arka plan zamanlama yol haritasında.",
        ],
        [
          "Hangi cihazlar destekli?",
          "Shelly, Tasmota, WLED, ESPHome, Philips Hue (köprü), Sonoff DIY ve Home Assistant her yerde çalışır; Kasa, Yeelight, WiZ, LIFX ve Govee LAN masaüstü TCP/UDP köprüleriyle. Matter/Zigbee cihazları Home Assistant köprüsüyle çalışır.",
        ],
        [
          "Kamera görüntüsü var mı?",
          "Kameralar ekranı gerçek kamera cihazlarını durum ve gizlilik bilgisiyle listeler. Canlı video akışı (RTSP) henüz yok — uygulama yerine tutucu göstermek yerine bunu açıkça söyler.",
        ],
        [
          "NEXUS+'ı dilediğim an iptal edebilir miyim?",
          "Evet — uygulamadaki Faturalandırma'dan veya Whop hesabından. Ev aynı şekilde çalışmaya devam eder; yalnızca AI kotası ücretsiz katmana döner.",
        ],
      ],
    },
    about: {
      title: "NEXUS Hakkında",
      lead: "NEXUS; hız, gizlilik ve gerçek cihaz sahipliği odaklı, bağımsız ve yerel-öncelikli bir akıllı ev platformudur. Cihazlarınızla doğrudan yerel ağınız üzerinden haberleşerek bulut bağımlılığını ortadan kaldırır.",
      body: [
        "Gizlilik ve sürdürülebilirlik ilk önceliğimizdir: ev düzeniniz ve verileriniz yalnızca sizin donanımınızda saklanır; veri ticareti ya da zorunlu abonelikler yer almaz.",
        "İsteğe bağlı NEXUS+ aboneliği bulut yapay zekâ özelliklerini karşılarken, temel akıllı ev altyapısı herkes için ücretsiz, bağımsız ve açık kalır.",
      ],
      linksTitle: "Pratik bağlantılar",
    },
    footer: {
      tagline: "Yerel-öncelikli akıllı ev platformu, gizlilik odaklı ve hızlı.",
      product: "Ürün",
      productLinks: [
        ["Özellikler", "#features"],
        ["Fiyatlar", "#pricing"],
        ["İndir", "#downloads"],
        ["SSS", "#faq"],
        ["Hakkında", "/tr/about.html"],
      ],
      account: "Müşteri & Hesap",
      accountLinks: [
        ["Abonelik ve Fatura Yönetimi", MANAGE_URL],
        ["Lisans Anahtarlarım", MANAGE_URL],
        ["Satın Alma ve Fatura Geçmişi", MANAGE_URL],
        ["Müşteri ve Lisans Desteği", "https://github.com/Enard52/NEXUS/issues"],
        ["Topluluk ve Yardımlaşma", "https://github.com/Enard52/NEXUS/discussions"],
      ],
      legal: "Yasal",
      legalLinks: [
        ["Gizlilik", "/tr/privacy.html"],
        ["Şartlar", "/tr/terms.html"],
        ["İade", "/tr/refund.html"],
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
