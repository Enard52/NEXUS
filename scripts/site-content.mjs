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

// Kasıtlı olarak kapatılmış eski web uygulaması adresi: verify-site.mjs canlı sitenin
// bu adrese bağlantı vermediğini bu değerle denetler. Canlı site adresiyle değiştirmeyin.
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
    ogImageAlt: "NEXUS smart home ecosystem on desktop and mobile",
    description:
      "NEXUS is a local-first smart home ecosystem for Windows, macOS, Linux, Android and iOS. Direct device control over your own local network, responsive automations, and live energy metrics. Free forever; optional NEXUS+ AI plan.",
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
      lead: "One unified ecosystem for your lights, climate, covers and sensors — talking directly to the devices on your own local network. Responsive automations, live power metering, and control that keeps working when the internet goes down.",
      primary: { label: "Windows · Linux · Android", href: "#downloads" },
      secondary: null,
      versionNote: "Latest version",
      // Etiket her ekranla birlikte "— <ekran adı>" olarak tamamlanır; bu yüzden
      // "home screen" gibi tek ekrana sabitlenmiş bir metin kullanılmaz.
      shotAlt: "NEXUS interface and control center",
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
          "Scenes, scheduled automations and real energy readings — unified control across desktop and mobile.",
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
            "Everything in Free tier, plus:",
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
          period: "for the whole family",
          badge: "Whole home",
          features: [
            "Household members with role-based access — no member cap",
            "Owner, member, and guest roles",
            "Per-member control, invite, and settings permissions",
            "Scenes and automations sync across your own signed-in devices",
            "Active across the entire ecosystem (desktop and mobile)",
            "Completely free with your home",
          ],
          cta: { label: "Start with Family", href: "#downloads" },
          soon: false,
        },
      ],
      manageNote: "Cancel anytime from Billing in the app or from your account on this site. Cancellation takes effect at the end of the current period.",
    },
    downloads: {
      heading: "Native on every desktop. At home on your phone.",
      lead: "Always free. Every installer ships with a published SHA-256 checksum so you can verify what you install.",
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
        title: "One account, across your entire ecosystem",
        desc: "Windows and Linux desktop programs and the Android app. Signed in, your rooms, devices, scenes and automations stay seamlessly synchronized across your screens.",
        cta: { label: "Download NEXUS", href: "#downloads" },
      },
        smartScreenNote:
        "On Windows the easiest route is the Microsoft Store: the package is signed by Microsoft and updates come through the Store. The direct .exe is unsigned, so Windows may warn about an “unknown publisher” — see checksums.",
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
          "Which account does my NEXUS+ subscription belong to?",
          "The email address used at checkout. Sign in on this site or in the app before you pay: checkout then opens with your account's email filled in, and the subscription shows up on every device you sign in to. NEXUS+ cannot be bought without an account. If you pay with a different email, the subscription is stored under that email and will not appear on your account until you sign in with it.",
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
        [
          "Can I control my home when I am away?",
          "Not through a NEXUS cloud: NEXUS talks to your devices directly on your home network and has no relay. To reach it from outside, put your phone or laptop on the home network with a VPN such as Tailscale (subnet router) or WireGuard on your router; NEXUS then works exactly as it does at home. NEXUS has no hub-address setting yet, so the VPN must make your local address range reachable, and scanning for new devices only works on the home network. Never expose a device to the internet with port forwarding. The step-by-step guide is docs/REMOTE-ACCESS.md in the repository.",
        ],
        [
          "Is there an iPhone version?",
          "There is no App Store app, because NEXUS does not use a paid Apple Developer account. With a Mac and a free Apple ID you can build it for your own iPhone (guide: docs/IOS-BUILD.md), and a release may also attach an unsigned IPA that AltStore or Sideloadly can sign for you; that path has not been verified on a real iPhone yet. A free Apple ID expires the app after 7 days, and notifications while the app is closed are not available on iOS. The home hub is still the desktop app; the iPhone is a client.",
        ],
        [
          "My device is not on the list. What can I do?",
          "NEXUS only supports devices with a documented local protocol; cloud-only devices are not supported because NEXUS never talks to a vendor cloud. The compatibility list (docs/COMPATIBILITY.md) also includes TP-Link Tapo, Sonoff in DIY mode, WiZ, LIFX, Govee (LAN), Tuya with local keys and Wake-on-LAN. Each of these has automated protocol tests, but a model counts as verified only when someone reports that it worked on a real device. Write to us through the contact form on this site (choose “New Device / Connector Request”) or by e-mail: the brand and model, what you expected and what happened. Telling us that a model worked on your real device is what marks it verified; never include passwords, local keys or tokens.",
        ],
        [
          "Do I need an account? What happens if the server is down?",
          "Yes: you sign in once with a free email account to open NEXUS. After that, controlling devices and running automations happens on your own network and keeps working without the internet. The account adds sync across your devices, Family and the AI assistant, which use free cloud services with limits. When one of those is unavailable, for example when the free Supabase project has paused after about a week without activity, the cloud screens say the server is unreachable instead of showing something as saved; devices, automations and the tray keep working. If the AI quota or service is exhausted, the assistant says it could not reply.",
        ],
        [
          "Can I back up my settings and move them to another device?",
          "Yes. Settings has a backup section where you can export your settings and automations to a JSON file and import it on another device or after a reinstall. Passwords, tokens and local keys are stripped from the paired device list in the file, so re-enter them after restoring. Keep the backup file private.",
        ],
        [
          "Can I export my energy data?",
          "Yes. The Energy page can export the latest real power readings from your devices as a CSV or JSON file. NEXUS only has data for devices that actually report power; with none paired, there is nothing to export.",
        ],
        [
          "Why does Windows warn me when I run the installer?",
          "Install from the Microsoft Store and you will not see this warning: Microsoft signs that package during certification and delivers updates through the Store. The direct .exe download is not yet signed with a commercial certificate, so SmartScreen may show “unknown publisher”. You can compare the file with the checksums listed in the downloads section before running it. Our code signing policy is linked from the site footer.",
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
          { icon: "layers", title: "Desktop", desc: "The Windows, macOS and Linux apps stay in the system tray and keep local schedules and sensor rules running while the computer is on. Windows and Linux ship as ready installers; macOS is built from source (unsigned: right-click → Open)." },
          { icon: "wifi", title: "Phone", desc: "The Android and iOS apps open onto the same local network; device commands still go across your LAN. Android ships as a signed APK; iOS is built from source with Xcode and a free Apple ID." },
          { icon: "lock", title: "Account", desc: "An account is required so rooms, devices and scenes match on every screen. Device commands do not leave your home network." },
        ],
      },
      linksTitle: "Practical links",
    },
    footer: {
      tagline:
        "Control your entire smart home directly over your local network — with zero vendor lock-in and no cloud dependency. Even when the internet goes down, your home never stops.",
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
        ["Code signing", "/code-signing"],
        ["Contribute", "/contribute"],
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
    ogImageAlt: "Masaüstü ve mobilde NEXUS akıllı ev ekosistemi",
    description:
      "NEXUS; Windows, macOS, Linux, Android ve iOS üzerinde çalışan yerel-öncelikli akıllı ev ekosistemi. Cihazlarınızla yerel ağınızda doğrudan iletişim, kesintisiz çalışan otomasyonlar ve anlık enerji ölçümleri. Ücretsiz; isteğe bağlı NEXUS+ yapay zekâ planı.",
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
      lead: "Işıklarınız, iklimlendirmeniz, perdeleriniz ve sensörleriniz tek bir ekosistemde — bulut aracılarına ihtiyaç duymadan, doğrudan yerel ağınız üzerinden haberleşir. Kesintisiz otomasyonlar, canlı enerji ölçümleri ve internet kesilse de durmayan bir kontrol mimarisi.",
      primary: { label: "Windows · Linux · Android", href: "#downloads" },
      secondary: null,
      versionNote: "Güncel sürüm",
      shotAlt: "NEXUS kontrol merkezi ve arayüzü",
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
          "Sahneler, zamanlanmış otomasyonlar ve gerçek enerji okumaları — bilgisayarından ve telefonundan tümleşik kontrol.",
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
        ["Yerel TCP — masaüstü programında", ["TP-Link Kasa", "Yeelight"]],
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
            "Ücretsiz plandaki tüm özelliklere ek olarak",
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
          period: "tüm aile için",
          badge: "Tüm ev için",
          features: [
            "Rol bazlı ev halkı yönetimi — üye sayısı sınırı yok",
            "Ev sahibi, üye ve misafir rolleri",
            "Üye başına kontrol, davet ve ayar yetkileri",
            "Sahneler ve otomasyonlar giriş yaptığın tüm cihazlarında senkron",
            "Tüm ekosistemde (masaüstü ve mobil) aktif",
            "Evinizle birlikte tamamen ücretsiz ve sınırsız",
          ],
          cta: { label: "Ailenle Başla", href: "#downloads" },
          soon: false,
        },
      ],
      manageNote: "İptal; uygulamadaki Faturalandırma menüsünden veya bu sitedeki hesabınızdan dilediğiniz an tek tıkla yapılır. İptal, dönem sonunda geçerli olur.",
    },
    downloads: {
      heading: "Bilgisayarında yerel, telefonunda evinde.",
      lead: "Hepsi ücretsiz. Her kurulum dosyası, doğrulayabilmen için SHA-256 sağlama değeriyle birlikte sunulur.",
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
        title: "Tek hesap, tüm ekosisteminizde",
        desc: "Windows ve Linux masaüstü programı ve Android mobil uygulaması. Giriş yaptığınızda odalarınız, cihazlarınız, sahneleriniz ve otomasyonlarınız tüm ekranlarınızda eksiksiz senkronize olur.",
        cta: { label: "NEXUS'u İndir", href: "#downloads" },
      },
        smartScreenNote:
        "Windows için en kolay yol Microsoft Store: kurulum Microsoft tarafından imzalanır ve güncellemeler Store'dan gelir. Doğrudan .exe imzasızdır; Windows “bilinmeyen yayıncı” uyarısı verebilir — sağlama değerlerine bak.",
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
          "NEXUS+ aboneliğim hangi hesaba tanımlanır?",
          "Ödemede kullanılan e-posta adresine. Ödemeden önce bu sitede ya da uygulamada giriş yap: ödeme sayfası hesabının e-postasıyla dolu açılır ve abonelik giriş yaptığın her cihazda görünür. NEXUS+ hesap olmadan satın alınamaz. Başka bir e-postayla ödersen abonelik o e-postanın altında saklanır ve o e-postayla giriş yapana kadar hesabında görünmez.",
        ],
        [
          "Otomasyonlar ve zamanlanmış kurallar nasıl çalışır?",
          "NEXUS otomasyon motoru kurallarını ve zamanlayıcılarını NEXUS'u çalıştırdığın cihazda yürütür: masaüstü programı sistem tepsisinde arka planda kalarak gün boyu izler ve uygular, böylece aydınlatma, enerji ve güvenlik rutinleri bulutu beklemez. Telefondan tetiklediğin sahneler ve zamanlayıcılar yerel ağından anında uygulanır. Yeni olaylar, Anlık Bildirimler sayfasında açtığın kanallara dağıtılır: uygulama içi bildirim şeridi, sistem bildirimi, ntfy, Telegram veya kendi HTTPS webhook'un.",
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
          "Evet, hiçbir taahhüt ve bağlayıcılık yoktur. Aboneliğinizi dilediğiniz an tek tıkla iptal edebilirsiniz: İster uygulamadaki Hesap & Faturalandırma menüsünden, ister bu sitedeki hesabınızdan, isterseniz de sipariş e-posta makbuzunuz üzerinden hemen yönetebilirsiniz. İptal ettiğinizde mevcut döneminiz boyunca tüm ayrıcalıklarınız korunur ve sonraki dönem için hiçbir ücret alınmaz.",
        ],
        [
          "Evden uzaktayken evimi kontrol edebilir miyim?",
          "NEXUS bulut üzerinden değil: cihazlarınla doğrudan ev ağında konuşur ve aracı bir sunucusu yoktur. Dışarıdan erişmek için telefonunu veya dizüstünü Tailscale (alt ağ yönlendirici) ya da router'ındaki WireGuard gibi bir VPN ile ev ağına bağla; NEXUS evdeki gibi çalışır. NEXUS'ta henüz merkez adresi ayarı yok, bu yüzden VPN yerel adres aralığını erişilebilir kılmalı; yeni cihaz taraması da yalnızca ev ağında çalışır. Cihazları port yönlendirmeyle asla internete açma. Adım adım rehber depodaki docs/REMOTE-ACCESS.md dosyasındadır.",
        ],
        [
          "iPhone sürümü var mı?",
          "App Store uygulaması yok; çünkü NEXUS ücretli Apple Developer hesabı kullanmaz. Bir Mac ve ücretsiz Apple ID ile kendi iPhone'un için derleyebilirsin (rehber: docs/IOS-BUILD.md); bir sürümde imzasız IPA da yer alabilir ve AltStore veya Sideloadly bunu senin için imzalar. Bu yol gerçek bir iPhone'da henüz doğrulanmadı. Ücretsiz Apple ID ile uygulama 7 günde sona erer ve iOS'ta uygulama kapalıyken telefona bildirim gelmez. Ev merkezi yine masaüstü uygulamasıdır; iPhone bir istemcidir.",
        ],
        [
          "Cihazım listede yok, ne yapabilirim?",
          "NEXUS yalnızca belgelenmiş yerel protokolü olan cihazları destekler; yalnızca buluttan çalışan cihazlar desteklenmez, çünkü NEXUS hiçbir üretici bulutuyla konuşmaz. Uyumluluk listesinde (docs/COMPATIBILITY.md) TP-Link Tapo, DIY modunda Sonoff, WiZ, LIFX, Govee (LAN), yerel anahtarlı Tuya ve Wake-on-LAN de yer alır. Hepsinin otomatik protokol testi vardır, ancak bir model ancak biri gerçek cihazda çalıştığını bildirdiğinde doğrulanmış sayılır. Bu sitedeki iletişim formundan (“Yeni Cihaz & Bağlayıcı İsteği” konusu) ya da e-postayla yaz: marka ve model, ne beklediğin ve ne olduğu. Bir modelin senin gerçek cihazında çalıştığını bildirmen, onu doğrulanmış işaretlememizi sağlar; şifre, yerel anahtar veya token yazma.",
        ],
        [
          "Hesap açmak zorunda mıyım? Sunucu kapanırsa ne olur?",
          "Evet: NEXUS'u açmak için ücretsiz bir e-posta hesabıyla bir kez giriş yaparsın. Sonrasında cihaz kontrolü ve otomasyonlar kendi ağında çalışır, internet kesilse de sürer. Hesap; cihazlar arası eşitleme, Aile ve yapay zekâ asistanını ekler ve bunlar sınırları olan ücretsiz bulut hizmetlerini kullanır. Bunlardan biri kullanılamazsa — örneğin ücretsiz Supabase projesi yaklaşık bir hafta etkinlik olmayınca duraklatılırsa — bulut ekranları kaydedilmiş gibi göstermek yerine sunucuya ulaşılamadığını söyler; cihazlar, otomasyonlar ve tepsi çalışmaya devam eder. Yapay zekâ kotası veya hizmeti tükenirse asistan yanıt veremediğini belirtir.",
        ],
        [
          "Ayarlarımı yedekleyip başka cihaza taşıyabilir miyim?",
          "Evet. Ayarlar'daki yedek bölümünden ayarlarını ve otomasyonlarını JSON dosyası olarak dışa aktarıp başka bir cihazda veya yeniden kurulumdan sonra içe aktarabilirsin. Dosyada eşleşmiş cihaz listesinden şifreler, token'lar ve yerel anahtarlar çıkarılır; geri yükledikten sonra bunları yeniden gir. Yedek dosyasını gizli tut.",
        ],
        [
          "Enerji verilerimi dışa aktarabilir miyim?",
          "Evet. Enerji sayfası, cihazlarının bildirdiği en son gerçek güç ölçümlerini CSV veya JSON olarak dışa aktarabilir. NEXUS yalnızca güç bildiren cihazlar için veriye sahiptir; hiç cihaz eşleşmemişse aktarılacak bir şey yoktur.",
        ],
        [
          "Windows kurulum dosyasını açarken neden uyarı alıyorum?",
          "Microsoft Store'dan kurarsan bu uyarıyı görmezsin: o paketi Microsoft sertifikasyon sırasında imzalar ve güncellemeleri Store üzerinden iletir. Doğrudan indirilen .exe ise henüz ticari bir sertifikayla imzalı değil; bu yüzden SmartScreen “bilinmeyen yayıncı” gösterebilir. Çalıştırmadan önce dosyayı indirmeler bölümündeki sağlama değerleriyle karşılaştırabilirsin. Kod imzalama politikamız sitenin alt bilgisinden bağlantılıdır.",
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
          { icon: "layers", title: "Masaüstü", desc: "Windows, macOS ve Linux uygulaması sistem tepsisinde kalır; bilgisayar açıkken yerel zamanlayıcılar ve sensör kuralları çalışmaya devam eder. Windows ve Linux hazır kurulumla gelir; macOS kaynaktan derlenir (imzasız: sağ tık → Aç)." },
          { icon: "wifi", title: "Telefon", desc: "Android ve iOS uygulamaları aynı yerel ağa açılır; cihaz komutları yine LAN üzerinden gider. Android imzalı APK olarak gelir; iOS, Xcode ve ücretsiz bir Apple ID ile kaynaktan derlenir." },
          { icon: "lock", title: "Hesap", desc: "Hesap gerekir ki odalar, cihazlar ve sahneler her ekranda aynı olsun. Cihaz komutları ev ağından çıkmaz." },
        ],
      },
      linksTitle: "Pratik bağlantılar",
    },
    footer: {
      tagline:
        "Tüm akıllı evinizi tek bir merkezden, üretici bulutlarına bağımlı olmadan ve doğrudan yerel ağınız üzerinden yönetin. İnternet kesilse bile eviniz kusursuz çalışmaya devam eder.",
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
        ["NEXUS'u İndir", "#downloads"],
      ],
      legal: "Yasal",
      legalLinks: [
        ["Gizlilik", "/tr/privacy"],
        ["Şartlar", "/tr/terms"],
        ["İade", "/tr/refund"],
        ["Kod imzalama", "/tr/code-signing"],
        ["Katkı verin", "/tr/contribute"],
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
