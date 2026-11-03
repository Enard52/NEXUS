import { RELEASES_URL } from "./site-constants.mjs";

export const en = {
  lang: "en",
  htmlLang: "en",
  canonical: "/",
  alternate: { en: "/", tr: "/tr/" },
  title: "NEXUS — Your smart home, managed on your own network",
  ogImageAlt: "NEXUS smart home ecosystem on desktop and mobile",
  description:
    "NEXUS is a local-first smart home ecosystem for Windows, macOS, Linux, Android and iOS. Direct device control over your own local network, responsive automations, and live energy metrics. Free forever; optional NEXUS+ plan.",
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
      [
        "Local network, no account or key — desktop app",
        ["TP-Link Kasa", "Yeelight", "WiZ", "Sonoff (DIY mode)", "Wake-on-LAN"],
      ],
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
        cta: {
          label: "Start your free trial",
          monthlyLabel: "Start 3-day free trial",
          yearlyLabel: "Start 7-day free trial",
          href: "https://whop.com/checkout/plan_HIySYESquBqlg",
          yearlyHref: "https://whop.com/checkout/plan_XlA3SacShoiJU",
        },
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
    manageNote:
      "Cancel anytime from Billing in the app or from your account on this site. Cancellation takes effect at the end of the current period.",
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
        "Essential smart home control—unlimited devices, rooms, offline automations, and local dashboards—is free. NEXUS+ includes everything in Free, NEXUS AI for scenes and questions in plain language, 2,000 replies a month, advanced connections for adding Home Assistant devices, and one account on every device, with a 3-day monthly or 7-day yearly trial. Device commands still run locally. Household roles are included with your home at no extra cost.",
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
        "NEXUS speaks each device's own local protocol: Shelly (Gen1 and Gen2+), Tasmota, WLED, ESPHome, Philips Hue and Home Assistant over local HTTP on every platform, plus TP-Link Kasa, Yeelight, WiZ, Sonoff (DIY mode) and Wake-on-LAN over the local network in the desktop app, with no account or key. Everything else — Matter or Zigbee gear — joins through your own Home Assistant server, which NEXUS treats as a single local hub. Local IP discovery pairs devices instantly, with no vendor cloud in between.",
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
        "NEXUS only supports devices with a documented local protocol; cloud-only devices are not supported because NEXUS never talks to a vendor cloud. The compatibility list (docs/COMPATIBILITY.md) also includes Sonoff in DIY mode, WiZ, LIFX, Govee (LAN) and Wake-on-LAN. Each of these has automated protocol tests, but a model counts as verified only when someone reports that it worked on a real device. Write to us through the contact form on this site (choose “New Device / Connector Request”) or by e-mail: the brand and model, what you expected and what happened. Telling us that a model worked on your real device is what marks it verified; never include passwords, local keys or tokens.",
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
        {
          icon: "layers",
          title: "Desktop",
          desc: "The Windows, macOS and Linux apps stay in the system tray and keep local schedules and sensor rules running while the computer is on. Windows and Linux ship as ready installers; macOS is built from source (unsigned: right-click → Open).",
        },
        {
          icon: "wifi",
          title: "Phone",
          desc: "The Android and iOS apps open onto the same local network; device commands still go across your LAN. Android ships as a signed APK; iOS is built from source with Xcode and a free Apple ID.",
        },
        {
          icon: "lock",
          title: "Account",
          desc: "An account is required so rooms, devices and scenes match on every screen. Device commands do not leave your home network.",
        },
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
};
