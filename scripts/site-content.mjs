// NEXUS tanıtım sitesi — tek içerik kaynağı (TR/EN) (issue #2)
// ------------------------------------------------------------
// scripts/site-build.mjs bu modülden index + about sayfalarını üretir.
// Fiyatlar cloud-sync.js PRICES ile birebir aynı olmak zorundadır
// (packages/core/src/site-pricing.test.ts denetler — CLAUDE.md kural 4).

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
      "NEXUS is a local-first smart home app for Windows, Linux, Android and the web. Real device control over your own network, automations that actually run, and honest energy readings. Free; optional NEXUS+ AI plan.",
    nav: [
      ["#features", "Features"],
      ["#how", "How it works"],
      ["#integrations", "Integrations"],
      ["#pricing", "Pricing"],
      ["#downloads", "Download"],
      ["#faq", "FAQ"],
    ],
    navCta: { label: "Open web app", href: APP_URL },
    hero: {
      eyebrow: "Local-first smart home",
      h1a: "Your home.",
      h1b: "Quietly in your control.",
      lead: "One app for your lights, climate, covers and sensors — talking straight to your devices over your own network. Automations that genuinely run, energy numbers that are genuinely measured, and a privacy model where your home data stays yours.",
      primary: { label: "Download NEXUS", href: "#downloads" },
      secondary: { label: "Open in browser", href: APP_URL },
      versionNote: "Latest version",
      shotAlt: "NEXUS home screen on a phone",
      trust: [
        "Free, unlimited devices",
        "No cloud required for control",
        "Windows · Linux · Android · Web",
      ],
    },
    features: {
      heading: "Powerful underneath. Honest on the surface.",
      lead: "Everything you see in NEXUS reflects what your devices actually report. If something isn't supported yet, the app says so.",
      items: [
        [
          "zap",
          "Automations that really run",
          "Time- and sunset-triggered scenarios execute on your devices — on desktop they keep running from the system tray. Missed triggers while offline are logged honestly, never faked.",
        ],
        [
          "gauge",
          "Real energy readings",
          "If your plug or switch meters power (like Shelly PM devices), the Energy screen shows live watts read from your own network. No meter? No made-up numbers.",
        ],
        [
          "wifi",
          "Local-network control",
          "Shelly, Tasmota, WLED, ESPHome, Hue, Home Assistant and more — spoken to directly over HTTP, TCP and UDP. Desktop apps add TCP/UDP bridges for Kasa, Yeelight, WiZ, LIFX and Govee.",
        ],
        [
          "lock",
          "Private by design",
          "Your home layout and device states live on your machine. Cloud sync is opt-in, end-to-end scoped, and never required to control your home.",
        ],
        [
          "sparkles",
          "NEXUS AI, where you want it",
          "Local commands are free forever. Optional cloud chat (Workers AI) answers in Turkish and English; free tier includes 30 answers a day.",
        ],
        [
          "languages",
          "Turkish & English",
          "The whole app, both languages, switched in one tap — prices and payment currency follow your language.",
        ],
      ],
    },
    how: {
      heading: "From download to connected in minutes.",
      steps: [
        [
          "1",
          "Install & open",
          "Grab the installer for your platform — or open the web app right now. Create an account only if you want cross-device sync.",
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
      lead: "No device limits, no account fees. The optional NEXUS+ plan adds a much larger NEXUS AI allowance.",
      currencyNote: "Prices in USD",
      plans: [
        {
          name: "Free",
          price: "$0",
          period: "forever",
          features: [
            "Unlimited devices & rooms",
            "Scenes & scheduled automations",
            "Real energy readings",
            "30 NEXUS AI answers a day",
            "Local commands, always free",
          ],
          cta: null,
        },
        {
          name: "NEXUS+",
          price: null, // dile göre dolar/TL (aşağıda doldurulur)
          period: "per month",
          badge: "Most popular",
          features: [
            "2,000 NEXUS AI answers a month",
            "Everything in Free",
            "3-day free trial, cancel anytime",
          ],
          cta: { label: "Start free trial", href: APP_URL + "/stitch-plus.html" },
        },
        {
          name: "Family",
          price: "—",
          period: "coming soon",
          features: [
            "Home members & permissions — already free in the app",
            "Shared plan for up to 6 members — in preparation",
          ],
          cta: null,
          soon: true,
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
      lead: "NEXUS is an independent, local-first smart home project. It is built around one rule: the app never pretends. Devices report real state, automations really execute, and anything not supported yet is said out loud.",
      body: [
        "The project is developed in the open with a public issue tracker. Feedback from real homes shapes the roadmap — you can follow along or chip in on GitHub.",
        "Sustainability comes before scale: the free tier runs on generous platform quotas, the optional NEXUS+ plan pays for cloud AI, and there are no ads and no data brokerage — ever.",
      ],
      linksTitle: "Practical links",
    },
    footer: {
      tagline: "Local-first smart home, honestly built.",
      product: "Product",
      productLinks: [
        ["Features", "#features"],
        ["Pricing", "#pricing"],
        ["Download", "#downloads"],
        ["FAQ", "#faq"],
        ["About", "/about.html"],
      ],
      account: "Account",
      accountLinks: [
        ["Open web app", APP_URL],
        ["Manage subscription", MANAGE_URL],
      ],
      legal: "Legal",
      legalLinks: [
        ["Privacy", "/privacy.html"],
        ["Terms", "/terms.html"],
        ["Refunds", "/refund.html"],
      ],
      project: "Project",
      projectLinks: [
        ["Issue tracker", ISSUES_URL],
        ["Releases & checksums", RELEASES_URL],
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
      "NEXUS; Windows, Linux, Android ve web için yerel-öncelikli akıllı ev uygulaması. Cihazlarınla kendi ağında konuşan gerçek kontrol, gerçekten çalışan otomasyonlar ve dürüst enerji ölçümleri. Ücretsiz; isteğe bağlı NEXUS+ yapay zekâ planı.",
    nav: [
      ["#features", "Özellikler"],
      ["#how", "Nasıl çalışır"],
      ["#integrations", "Entegrasyonlar"],
      ["#pricing", "Fiyatlar"],
      ["#downloads", "İndir"],
      ["#faq", "SSS"],
    ],
    navCta: { label: "Web uygulamasını aç", href: APP_URL },
    hero: {
      eyebrow: "Yerel-öncelikli akıllı ev",
      h1a: "Evini.",
      h1b: "Sessizce kontrol et.",
      lead: "Işıkların, iklimin, perdelerin ve sensörlerin tek uygulamada — cihazlarınla doğrudan, kendi ağın üzerinden konuşarak. Gerçekten çalışan otomasyonlar, gerçekten ölçülen enerji rakamları ve ev verisinin senin kalan bir gizlilik anlayışı.",
      primary: { label: "NEXUS'u indir", href: "#downloads" },
      secondary: { label: "Tarayıcıda aç", href: APP_URL },
      versionNote: "Güncel sürüm",
      shotAlt: "Telefonda NEXUS ana ekranı",
      trust: [
        "Ücretsiz, sınırsız cihaz",
        "Kontrol için bulut şart değil",
        "Windows · Linux · Android · Web",
      ],
    },
    features: {
      heading: "Altında güçlü, üstünde dürüst.",
      lead: "NEXUS'ta gördüğün her şey cihazlarının gerçekten bildirdiği durumdur. Henüz desteklenmeyen bir şey varsa uygulama bunu açıkça söyler.",
      items: [
        [
          "zap",
          "Gerçekten çalışan otomasyonlar",
          "Saat ve gün batımı tetikleyicili senaryolar cihazlarında yürür — masaüstünde tepsideyken de devam eder. Çevrimdışı kaçan tetiklemeler dürüstçe günlüğe yazılır, asla uydurulmaz.",
        ],
        [
          "gauge",
          "Gerçek enerji ölçümü",
          "Prizin veya anahtarın güç ölçüyorsa (Shelly PM cihazları gibi) Enerji ekranı kendi ağından okunan anlık watt'ı gösterir. Ölçüm yok? Uydurma rakam da yok.",
        ],
        [
          "wifi",
          "Yerel ağ kontrolü",
          "Shelly, Tasmota, WLED, ESPHome, Hue, Home Assistant ve dahası — HTTP, TCP ve UDP üzerinden doğrudan. Masaüstü uygulaması Kasa, Yeelight, WiZ, LIFX ve Govee için TCP/UDP köprüleri ekler.",
        ],
        [
          "lock",
          "Tasarımdan gizlilik",
          "Ev düzenin ve cihaz durumların makinenizde yaşar. Bulut senkronuz isteğe bağlıdır ve evini kontrol etmek için asla gerekmez.",
        ],
        [
          "sparkles",
          "NEXUS AI, istediğin yerde",
          "Yerel komutlar sonsuza dek ücretsiz. İsteğe bağlı bulut sohbeti (Workers AI) Türkçe ve İngilizce yanıtlar; ücretsiz katman günde 30 yanıt içerir.",
        ],
        [
          "languages",
          "Türkçe ve İngilizce",
          "Tüm uygulama, iki dilde, tek dokunuşla — fiyatlar ve ödeme para birimi dilini takip eder.",
        ],
      ],
    },
    how: {
      heading: "İndirmeden bağlanmaya dakikalar.",
      steps: [
        [
          "1",
          "Kur ve aç",
          "Platformuna uygun kurulumu al — ya da web uygulamasını hemen aç. Hesap yalnızca cihazlar arası senkron istersen gerekir.",
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
      lead: "Cihaz sınırı yok, hesap ücreti yok. İsteğe bağlı NEXUS+ planı çok daha büyük bir NEXUS AI kotası ekler.",
      currencyNote: "Fiyatlar TL cinsinden",
      plans: [
        {
          name: "Ücretsiz",
          price: "₺0",
          period: "sonsuza dek",
          features: [
            "Sınırsız cihaz ve oda",
            "Sahneler ve zamanlanmış otomasyonlar",
            "Gerçek enerji okumaları",
            "Günde 30 NEXUS AI yanıtı",
            "Yerel komutlar hep ücretsiz",
          ],
          cta: null,
        },
        {
          name: "NEXUS+",
          price: null,
          period: "aylık",
          badge: "En çok tercih edilen",
          features: [
            "Ayda 2.000 NEXUS AI yanıtı",
            "Ücretsiz plandaki her şey",
            "3 günlük ücretsiz deneme, dilediğin an iptal",
          ],
          cta: { label: "Ücretsiz denemeyi başlat", href: APP_URL + "/stitch-plus.html" },
        },
        {
          name: "Aile",
          price: "—",
          period: "yakında",
          features: [
            "Ev üyeleri ve izinler — uygulamada zaten ücretsiz",
            "6 üyeye kadar ortak plan — hazırlanıyor",
          ],
          cta: null,
          soon: true,
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
      lead: "NEXUS bağımsız, yerel-öncelikli bir akıllı ev projesidir. Tek bir ilkeyle geliştirilir: uygulama asla rol yapmaz. Cihazlar gerçek durumu bildirir, otomasyonlar gerçekten yürür, henüz desteklenmeyen şey açıkça söylenir.",
      body: [
        "Proje, herkese açık bir issue takibiyle açık geliştirilir. Gerçek evlerden gelen geri bildirim yol haritasını şekillendirir — GitHub'dan takip edebilir ya da katkı verebilirsin.",
        "Ölçekten önce sürdürülebilirlik: ücretsiz katman cömert platform kotalarıyla çalışır, isteğe bağlı NEXUS+ planı bulut yapay zekâyı karşılar; reklam yok, veri ticareti asla yok.",
      ],
      linksTitle: "Pratik bağlantılar",
    },
    footer: {
      tagline: "Yerel-öncelikli akıllı ev, dürüstçe yapıldı.",
      product: "Ürün",
      productLinks: [
        ["Özellikler", "#features"],
        ["Fiyatlar", "#pricing"],
        ["İndir", "#downloads"],
        ["SSS", "#faq"],
        ["Hakkında", "/about.html"],
      ],
      account: "Hesap",
      accountLinks: [
        ["Web uygulamasını aç", APP_URL],
        ["Aboneliği yönet", MANAGE_URL],
      ],
      legal: "Yasal",
      legalLinks: [
        ["Gizlilik", "/privacy.html"],
        ["Şartlar", "/terms.html"],
        ["İade", "/refund.html"],
      ],
      project: "Proje",
      projectLinks: [
        ["Issue takibi", ISSUES_URL],
        ["Sürümler ve sağlama", RELEASES_URL],
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
