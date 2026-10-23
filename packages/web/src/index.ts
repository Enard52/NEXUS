/**
 * Nexus AI — Web demo assembly
 *
 * Wires the renderer to real building blocks: it builds the navigation, Today
 * dashboard and device list from the @nexus/interface view-models, seeds the
 * @nexus/infra version-info service with sample releases, and emits one
 * standalone HTML document. `renderDemoDocument` is what `build.ts` writes to
 * disk so the design can finally be *seen*, and what the tests assert against.
 */

import { getTheme, type ThemeName } from "@nexus/design-system";
import {
  buildAdminDashboardModel,
  buildAgentsModel,
  buildBillingManageModel,
  buildBillingModel,
  buildDeviceListModel,
  buildFamilyModel,
  buildHomeStateModel,
  buildNavigation,
  buildPersonalizationModel,
  buildPlatformModel,
  buildSkillsModel,
  buildSuggestionsModel,
  buildTodayModel,
  type DeviceRow,
  type NavContext,
  type ScreenId,
} from "@nexus/interface";
import { computeChecksum, VersionInfoService } from "@nexus/infra";
import {
  escapeHtml,
  faviconDataUri,
  renderAddDevice,
  renderAdminDashboard,
  renderAgents,
  renderBilling,
  renderBillingManage,
  renderDevices,
  renderDownloadCenter,
  renderFamily,
  renderFaq,
  renderFeatures,
  renderHeader,
  renderHero,
  renderHomeState,
  renderNav,
  renderPersonalization,
  renderPlatform,
  renderRichFooter,
  renderSkills,
  renderStyles,
  renderSuggestions,
  renderToday,
  renderTodayPanel,
  renderPricing as _renderPricing,
  renderTestimonials as _renderTestimonials,
  CURRENT_LOCALE,
} from "./render.js";
import { renderHead, type SeoConfig } from "./seo.js";

import { isRtl, type Locale } from "@nexus/i18n";
import { DeviceManager, InMemoryConnector } from "@nexus/devices";

export * from "./render.js";
export * from "./seo.js";

/** Canonical origin for the marketing/app site (SEO canonical + sitemap base). */
export const SITE_URL = "https://nexus-ai.app/";

const deviceManager = new DeviceManager();
deviceManager.registerConnector(
  new InMemoryConnector("system", [
    {
      id: "lamp",
      name: "Philips Hue Play Gradient Lightstrip",
      room: "Living room",
      capabilities: [],
    },
    { id: "tv", name: 'LG C3 65" 4K OLED Smart TV', room: "Living room", capabilities: [] },
    { id: "ac", name: "Daikin Sensira 18000 BTU Inverter AC", room: "Bedroom", capabilities: [] },
    { id: "lock", name: "August Smart Lock Pro + Connect", room: "Entrance", capabilities: [] },
    { id: "speaker", name: "Sonos Arc Dolby Atmos Soundbar", room: "Studio", capabilities: [] },
    {
      id: "camera",
      name: "Arlo Pro 4 Spotlight Security Camera",
      room: "Garden",
      capabilities: [],
    },
    {
      id: "thermostat",
      name: "Ecobee Smart Thermostat Premium",
      room: "Hallway",
      capabilities: [],
    },
    {
      id: "curtain",
      name: "Somfy Tahoma Motorized Smart Shades",
      room: "Bedroom",
      capabilities: [],
    },
  ]),
);

/** Seed the version-info service exactly as a real release pipeline would. */
export function demoReleases(): VersionInfoService {
  const svc = new VersionInfoService();
  svc.publish({
    platform: "android",
    version: "3.14.2",
    minOs: "Android 12 and later",
    checksumSha256: "642c097c01c7a7597e8725bb494cbcb0e43be7e63c7c8d20ac1c829b9ea10287",
    downloadUrl: "/downloads/NEXUS-3.14.2.apk",
  });
  svc.publish({
    platform: "ios",
    version: "3.14.2",
    minOs: "iOS 17 and later",
    checksumSha256: computeChecksum("nexus-3.14.2-ios"),
    downloadUrl: "https://apps.apple.com/app/id0000000000",
  });
  return svc;
}

export interface DemoOptions {
  readonly theme?: ThemeName;
  /** User-Agent used to feature the right download button. */
  readonly userAgent?: string;
}

/** SEO contract for the site. Kept as data so it is testable and reusable. */
export function demoSeo(themeColor: string): SeoConfig {
  return {
    title: "Nexus — Your personal operating system",
    description:
      "Nexus is a voice-first, privacy-focused personal operating system that controls " +
      "your devices, learns your routines, and works across Windows, macOS, Linux, iOS and Android.",
    url: SITE_URL,
    siteName: "NEXUS",
    locale: "en_US",
    alternates: [
      { lang: "en", url: SITE_URL },
      { lang: "tr", url: `${SITE_URL}tr/` },
    ],
    // Raster PNG is the primary social card (Facebook/LinkedIn/X need raster);
    // og-cover.svg is the deterministic vector source it is rendered from.
    image: `${SITE_URL}og-cover.png`,
    keywords: [
      "personal AI",
      "voice assistant",
      "smart home",
      "privacy",
      "cross-platform",
      "automation",
      "routines",
    ],
    themeColor,
    robots: "index,follow",
    twitterSite: "@nexusai",
  };
}

/**
 * Progressive-enhancement nav: without JS every screen is a visible, crawlable
 * section (great for SEO); with JS the nav switches between them like an app.
 */
const NAV_SCRIPT = `
document.documentElement.classList.add("js-tabs");
var sections = Array.prototype.slice.call(document.querySelectorAll("main > section"));
var links = Array.prototype.slice.call(document.querySelectorAll("nav a[data-nav]"));
function show(id) {
  sections.forEach(function (s) { s.hidden = s.id !== id; });
  var activeText = "";
  links.forEach(function (a) {
    var on = a.getAttribute("data-nav") === id;
    a.classList.toggle("active", on);
    if (on) { 
      a.setAttribute("aria-current", "page"); 
      activeText = a.textContent;
    } else { 
      a.removeAttribute("aria-current"); 
    }
  });
  if (activeText) {
    document.title = activeText + " — NEXUS";
  }
}
function fromHash() {
  var id = location.hash.replace("#", "");
  show(sections.some(function (s) { return s.id === id; }) ? id : sections[0].id);
}
links.forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    var id = a.getAttribute("data-nav");
    if (history.replaceState) { history.replaceState(null, "", "#" + id); } else { location.hash = id; }
    show(id);
  });
});
window.addEventListener("hashchange", fromHash);
// Expose show to be called after translation
window.updateNavTitle = fromHash;
fromHash();
`.trim();

/**
 * The assembled view-models for every core NEXUS surface. Built once from the
 * @nexus/interface builders so the web, desktop and mobile front ends all render
 * the exact same data through their own platform shells.
 */
export interface DemoScreens {
  readonly nav: ReturnType<typeof buildNavigation>;
  readonly today: ReturnType<typeof buildTodayModel>;
  readonly home: ReturnType<typeof buildHomeStateModel>;
  readonly devices: ReturnType<typeof buildDeviceListModel>;
  readonly releases: VersionInfoService;
  readonly suggestions: ReturnType<typeof buildSuggestionsModel>;
  readonly skills: ReturnType<typeof buildSkillsModel>;
  readonly family: ReturnType<typeof buildFamilyModel>;
  readonly agents: ReturnType<typeof buildAgentsModel>;
  readonly billing: ReturnType<typeof buildBillingModel>;
  readonly billingManage: ReturnType<typeof buildBillingManageModel>;
  readonly personalization: ReturnType<typeof buildPersonalizationModel>;
  readonly platform: ReturnType<typeof buildPlatformModel>;
  readonly adminDashboard: ReturnType<typeof buildAdminDashboardModel>;
}

/** Real product photos — Wikimedia Commons allows hotlinking (unlike Unsplash
 * et al., which 403 on hotlinks). Renderers keep the gradient+logo tile as an
 * onerror fallback, so a broken CDN never leaves an empty square. */
const productPhoto = (file: string): string =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=160`;

/** Build the shared demo view-models (platform-agnostic; no HTML here). */
export function buildDemoScreens(): DemoScreens {
  const isTr = CURRENT_LOCALE === "tr";
  const ctx: NavContext = { authenticated: true, plan: "family", role: "admin" };

  const devices: DeviceRow[] = [
    {
      id: "lamp",
      nameKey: isTr
        ? "Philips Hue Play Gradient Aydınlatma"
        : "Philips Hue Play Gradient Lightstrip",
      room: isTr ? "Salon" : "Living room",
      online: true,
      manufacturer: "Philips",
      model: "Hue Play Gradient",
      type: "lamp",
      imageUrl: productPhoto("Philips Hue white bulb - June 2018 (1944).jpg"),
      capabilities: [
        { kind: "brightness", value: 72, min: 0, max: 100 },
        { kind: "colorTemp", value: 3400, min: 2700, max: 6500 },
        { kind: "color", value: "#ffb86b" },
      ],
      firmwareVersion: "1.93.11",
      ipAddress: "192.168.1.104",
      macAddress: "00:17:88:01:00:FF",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      analytics: {
        dailyUsageWh: [12, 15, 14, 18, 12, 11, 14],
        weeklyUsageWh: [84, 92, 88, 95],
        anomalyDetected: false,
      },
    },
    {
      id: "tv",
      nameKey: isTr ? 'LG C3 65" 4K OLED TV' : 'LG C3 65" 4K OLED Smart TV',
      room: isTr ? "Salon" : "Living room",
      online: true,
      manufacturer: "LG",
      model: "OLED65C3PUA",
      type: "tv",
      imageUrl: productPhoto("LG OLED TV.jpg"),
      capabilities: [
        { kind: "volume", value: 35, min: 0, max: 100 },
        { kind: "channel", value: 7 },
        { kind: "source", value: "HDMI1", options: ["HDMI1", "HDMI2", "Streaming"] },
      ],
      firmwareVersion: "03.20.14",
      ipAddress: "192.168.1.108",
      macAddress: "A4:B3:C2:11:00:AA",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      analytics: {
        dailyUsageWh: [200, 180, 250, 300, 150, 190, 220],
        weeklyUsageWh: [1400, 1500, 1300, 1450],
        anomalyDetected: false,
      },
    },
    {
      id: "ac",
      nameKey: isTr ? "Daikin Sensira Inverter Klima" : "Daikin Sensira 18000 BTU Inverter AC",
      room: isTr ? "Yatak Odası" : "Bedroom",
      online: true,
      manufacturer: "Daikin",
      model: "FTXC50C",
      type: "ac",
      imageUrl: productPhoto("DAIKIN AIR CONDITIONER INDOOR UNIT (4).jpg"),
      capabilities: [
        { kind: "temperature", value: 22, min: 16, max: 30 },
        { kind: "mode", value: "cool", options: ["cool", "heat", "auto", "dry"] },
        { kind: "fanSpeed", value: "auto", options: ["low", "medium", "high", "auto"] },
      ],
      firmwareVersion: "1.0.4",
      ipAddress: "192.168.1.115",
      macAddress: "00:22:33:44:55:66",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      analytics: {
        dailyUsageWh: [800, 900, 850, 1000, 750, 800, 950],
        weeklyUsageWh: [6000, 5800, 6200, 5900],
        anomalyDetected: true,
      },
    },
    {
      id: "lock",
      nameKey: isTr ? "August Smart Lock Pro Akıllı Kilit" : "August Smart Lock Pro + Connect",
      room: isTr ? "Giriş" : "Entrance",
      online: false,
      manufacturer: "August",
      model: "Smart Lock Pro",
      type: "lock",
      imageUrl: productPhoto("August 2nd-gen smart lock.jpg"),
      capabilities: [{ kind: "lockState", value: "locked", options: ["locked", "unlocked"] }],
      firmwareVersion: "1.2.3",
      ipAddress: "192.168.1.120",
      macAddress: "AA:BB:CC:DD:EE:FF",
      connectionStatus: "offline",
      lastSeen: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "speaker",
      nameKey: isTr ? "Sonos Arc Soundbar" : "Sonos Arc Dolby Atmos Soundbar",
      room: isTr ? "Stüdyo" : "Studio",
      online: true,
      manufacturer: "Sonos",
      model: "Arc",
      type: "speaker",
      imageUrl: productPhoto("Sonos One speaker white - vertical (40299333622).jpg"),
      capabilities: [
        { kind: "volume", value: 48, min: 0, max: 100 },
        { kind: "switch", value: true },
      ],
      firmwareVersion: "15.1.1",
      ipAddress: "192.168.1.130",
      macAddress: "11:22:33:44:55:66",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
    },
    {
      id: "camera",
      nameKey: isTr ? "Arlo Pro 4 Güvenlik Kamerası" : "Arlo Pro 4 Spotlight Security Camera",
      room: isTr ? "Bahçe" : "Garden",
      online: false,
      manufacturer: "Arlo",
      model: "Pro 4",
      type: "camera",
      imageUrl: productPhoto("Interior Arlo Camera for Verisure.jpg"),
      capabilities: [
        { kind: "privacyMode", value: false },
        { kind: "quality", value: "2K", options: ["720p", "1080p", "2K"] },
      ],
      firmwareVersion: "1.090",
      ipAddress: "192.168.1.140",
      macAddress: "99:88:77:66:55:44",
      connectionStatus: "error",
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "thermostat",
      nameKey: isTr ? "Ecobee Akıllı Termostat Premium" : "Ecobee Smart Thermostat Premium",
      room: isTr ? "Koridor" : "Hallway",
      online: true,
      manufacturer: "Ecobee",
      model: "Premium",
      type: "thermostat",
      imageUrl: productPhoto("Ecobee Pro Thermostat.jpg"),
      capabilities: [
        { kind: "temperature", value: 21, min: 10, max: 30 },
        { kind: "mode", value: "heat", options: ["heat", "cool", "auto"] },
      ],
      firmwareVersion: "4.7.5",
      ipAddress: "192.168.1.150",
      macAddress: "44:55:66:77:88:99",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
      analytics: {
        dailyUsageWh: [100, 110, 105, 95, 120, 115, 100],
        weeklyUsageWh: [700, 750, 720, 740],
        anomalyDetected: false,
      },
    },
    {
      id: "curtain",
      nameKey: isTr ? "Somfy Tahoma Motorlu Perde" : "Somfy Tahoma Motorized Smart Shades",
      room: isTr ? "Yatak Odası" : "Bedroom",
      online: true,
      manufacturer: "Somfy",
      model: "Tahoma",
      type: "curtain",
      capabilities: [{ kind: "position", value: 65, min: 0, max: 100 }],
      firmwareVersion: "2.1.0",
      ipAddress: "192.168.1.160",
      macAddress: "22:33:44:55:66:77",
      connectionStatus: "online",
      lastSeen: new Date().toISOString(),
    },
  ];

  return {
    nav: buildNavigation(ctx),
    today: buildTodayModel({
      devicesOnline: devices.filter((d) => d.online).length,
      devicesTotal: devices.length,
      energyWhToday: 2720,
      activeRoutines: 5,
      pendingSuggestions: 3,
    }),
    home: buildHomeStateModel(devices.map((d) => ({ room: d.room ?? "Home", online: d.online }))),
    devices: buildDeviceListModel(devices),
    releases: demoReleases(),
    suggestions: buildSuggestionsModel(
      isTr
        ? [
            {
              id: "s1",
              textKey: "Akşam 19:00'da salon aydınlatmasını %40 seviyesine düşür",
              at: "19:00",
            },
          ]
        : [{ id: "s1", textKey: "Dim living room lights to 40% at 19:00", at: "19:00" }],
    ),
    skills: buildSkillsModel(
      isTr
        ? [
            { id: "k2", nameKey: "Günaydın Rutini", usageCount: 88 },
            { id: "k3", nameKey: "Evden Çıkış", usageCount: 65 },
            { id: "k5", nameKey: "Gece Güvenlik Modu", usageCount: 54 },
            { id: "k1", nameKey: "Sinema Modu", usageCount: 42 },
            { id: "k4", nameKey: "Çalışma Odası Odaklanma", usageCount: 31 },
          ]
        : [
            { id: "k2", nameKey: "Good Morning Routine", usageCount: 88 },
            { id: "k3", nameKey: "Leaving Home", usageCount: 65 },
            { id: "k5", nameKey: "Night Security", usageCount: 54 },
            { id: "k1", nameKey: "Movie Night Mode", usageCount: 42 },
            { id: "k4", nameKey: "Study Focus Mode", usageCount: 31 },
          ],
      isTr
        ? [
            {
              id: "skill_security",
              nameKey: "Güvenlik Modu",
              descriptionKey: "Hareket algılandığında kameraları kayda alır ve ışıkları yakar.",
              icon: "shield",
              tags: ["güvenlik", "lokal"],
            },
            {
              id: "skill_energy",
              nameKey: "Enerji Tasarrufu",
              descriptionKey: "Boş odalardaki cihazları otomatik kapatır.",
              icon: "leaf",
              tags: ["enerji", "otomasyon"],
            },
            {
              id: "skill_movie",
              nameKey: "Sinema Modu",
              descriptionKey: "TV açıldığında ışıkları kısar ve perdeleri kapatır.",
              icon: "film",
              tags: ["eğlence", "aydınlatma"],
            },
          ]
        : [
            {
              id: "skill_security",
              nameKey: "Security Mode",
              descriptionKey: "Records cameras and turns on lights when motion is detected.",
              icon: "shield",
              tags: ["security", "local"],
            },
            {
              id: "skill_energy",
              nameKey: "Energy Saver",
              descriptionKey: "Automatically turns off devices in empty rooms.",
              icon: "leaf",
              tags: ["energy", "automation"],
            },
            {
              id: "skill_movie",
              nameKey: "Movie Mode",
              descriptionKey: "Dims lights and closes shades when the TV is turned on.",
              icon: "film",
              tags: ["entertainment", "lighting"],
            },
          ],
    ),
    family: buildFamilyModel(
      isTr
        ? [
            { id: "m1", nameKey: "Ensar", role: "admin" },
            { id: "m2", nameKey: "Eray", role: "member" },
          ]
        : [
            { id: "m1", nameKey: "Ensar", role: "admin" },
            { id: "m2", nameKey: "Eray", role: "member" },
          ],
    ),
    billing: buildBillingModel("family"),
    billingManage: buildBillingManageModel("family"),
    agents: buildAgentsModel(
      isTr
        ? [
            { id: "a1", nameKey: "Enerji Yöneticisi", icon: "zap", status: "active" },
            { id: "a2", nameKey: "Güvenlik Gözcüsü", icon: "shield", status: "active" },
            { id: "a3", nameKey: "Konfor Asistanı", icon: "thermometer", status: "learning" },
            { id: "a4", nameKey: "Rutin Planlayıcı", icon: "clipboard", status: "sleeping" },
          ]
        : [
            { id: "a1", nameKey: "Energy Manager", icon: "zap", status: "active" },
            { id: "a2", nameKey: "Security Watcher", icon: "shield", status: "active" },
            { id: "a3", nameKey: "Comfort Assistant", icon: "thermometer", status: "learning" },
            { id: "a4", nameKey: "Routine Planner", icon: "clipboard", status: "sleeping" },
          ],
    ),
    personalization: buildPersonalizationModel({
      assistantName: "NEXUS AI",
      userAddress: "Boss",
      language: CURRENT_LOCALE,
    }),
    platform: buildPlatformModel(),
    adminDashboard: buildAdminDashboardModel(),
  };
}

/** Build one standalone, themed HTML page rendering the core NEXUS surfaces. */
export function renderDemoDocument(options: DemoOptions = {}): string {
  const themeName: ThemeName = options.theme ?? "dark";
  const userAgent = options.userAgent ?? "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
  const theme = getTheme(themeName);

  const {
    nav,
    today,
    home,
    devices,
    releases,
    suggestions,
    skills,
    family,
    agents,
    billing,
    billingManage,
    personalization,
    platform,
    adminDashboard,
  } = buildDemoScreens();

  const section = (id: string, html: string): string => `<section id="${id}">${html}</section>`;

  const isTr = CURRENT_LOCALE === "tr";
  return `<!doctype html>
<html lang="${CURRENT_LOCALE}" data-theme="${escapeHtml(themeName)}"${isRtl(CURRENT_LOCALE as Locale) ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${renderHead(demoSeo(theme.color.primary))}
<link rel="icon" href="${faviconDataUri(theme.color.primary)}" />
<link rel="apple-touch-icon" href="icon.svg" />
<link rel="manifest" href="manifest.webmanifest" />
<style>${renderStyles(theme)}</style>
<script>document.documentElement.classList.add("js-tabs");</script>
</head>
<body>
<a class="skip" href="#main">${isTr ? "İçeriğe atla" : "Skip to content"}</a>
${renderHeader(theme.color.primary)}
<div class="wrap">
${renderHero()}
${renderNav(nav, "today")}
<main id="main">
${section("today", renderToday(today))}
${section("home-state", renderHomeState(home))}
${section("suggestions", renderSuggestions(suggestions))}
${section("skills", renderSkills(skills))}
${section("devices", renderDevices(devices))}
${section("family", renderFamily(family))}
${section("agents", renderAgents(agents))}
${section("personalization", renderPersonalization(personalization))}
${section("platform", renderPlatform(platform))}
${section("billing", renderBilling(billing))}
${section("billing-manage", renderBillingManage(billingManage))}
${section("add-device", renderAddDevice())}
${section("admin-dashboard", renderAdminDashboard(adminDashboard))}
${section("download-center", renderDownloadCenter(releases, userAgent))}
</main>
${renderFeatures()}
${renderFaq()}
</div>
${renderRichFooter(theme.color.primary)}
<script>${NAV_SCRIPT}</script>
</body>
</html>`;
}

/** Render one screen's body HTML by id — shared by the web, desktop and mobile shells. */
export function renderScreenBody(
  id: ScreenId,
  s: DemoScreens,
  userAgent: string,
  surface: "web" | "desktop" | "mobile" = "web",
): string {
  switch (id) {
    case "today":
      return renderTodayPanel(s.today);
    case "home-state":
      return renderHomeState(s.home);
    case "suggestions":
      return renderSuggestions(s.suggestions);
    case "skills":
      return renderSkills(s.skills);
    case "family":
      return renderFamily(s.family);
    case "agents":
      return renderAgents(s.agents);
    case "devices":
      return renderDevices(s.devices);
    case "personalization":
      return renderPersonalization(s.personalization);
    case "platform":
      return renderPlatform(s.platform);
    case "billing":
      return renderBilling(s.billing);
    case "billing-manage":
      return renderBillingManage(s.billingManage);
    case "add-device":
      return renderAddDevice();
    case "admin-dashboard":
      return renderAdminDashboard(s.adminDashboard);
    case "download-center":
      return renderDownloadCenter(s.releases, userAgent, surface);
    default:
      return "";
  }
}

export const moduleName = "web" as const;
export const implemented = true;
