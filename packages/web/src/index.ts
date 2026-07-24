/**
 * Nexus AI — Web demo assembly (FAZ 9/10/18)
 *
 * Wires the renderer to real building blocks: it builds the navigation, Today
 * dashboard and device list from the @nexus/interface view-models, seeds the
 * @nexus/infra version-info service with sample releases, and emits one
 * standalone HTML document. `renderDemoDocument` is what `build.ts` writes to
 * disk so the design can finally be *seen*, and what the tests assert against.
 */

import { getTheme, type ThemeName } from "@nexus/design-system";
import {
  buildBillingModel,
  buildDeviceListModel,
  buildFamilyModel,
  buildHomeStateModel,
  buildNavigation,
  buildPersonalizationModel,
  buildSkillsModel,
  buildSuggestionsModel,
  buildTodayModel,
  type NavContext,
  type ScreenId,
} from "@nexus/interface";
import { computeChecksum, VersionInfoService } from "@nexus/infra";
import {
  escapeHtml,
  faviconDataUri,
  renderBilling,
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
  renderRichFooter,
  renderSkills,
  renderStyles,
  renderSuggestions,
  renderToday,
  renderTodayPanel,
  CURRENT_LOCALE,
} from "./render.js";
import { renderHead, type SeoConfig } from "./seo.js";

import { DeviceManager, InMemoryConnector } from "@nexus/devices";

export * from "./render.js";
export * from "./seo.js";

/** Canonical origin for the marketing/app site (SEO canonical + sitemap base). */
export const SITE_URL = "https://nexus-ai.example.com/";

const deviceManager = new DeviceManager();
deviceManager.registerConnector(
  new InMemoryConnector("system", [
    { id: "lamp", name: "Living room ambient lamp", room: "Living room", capabilities: [] },
    { id: "tv", name: "Living room 4K OLED TV", room: "Living room", capabilities: [] },
    { id: "ac", name: "Bedroom Climate AC", room: "Bedroom", capabilities: [] },
    { id: "lock", name: "Front Door Smart Lock", room: "Entrance", capabilities: [] },
    { id: "speaker", name: "Studio Dolby Soundbar", room: "Studio", capabilities: [] },
    { id: "camera", name: "Garden Security Camera", room: "Garden", capabilities: [] },
    { id: "thermostat", name: "Hallway Smart Thermostat", room: "Hallway", capabilities: [] },
    { id: "curtain", name: "Bedroom Motorized Shades", room: "Bedroom", capabilities: [] },
  ])
);

/** Seed the version-info service exactly as a real release pipeline would. */
export function demoReleases(): VersionInfoService {
  const svc = new VersionInfoService();
  svc.publish({
    platform: "windows",
    version: "3.14.2",
    minOs: "Windows 10 and later",
    checksumSha256: "642c097c01c7a7597e8725bb494cbcb0e43be7e63c7c8d20ac1c829b9ea10287",
    downloadUrl: "https://cdn.nexus-ai.com/nexus-setup-3.14.2.exe",
  });
  svc.publish({
    platform: "macos",
    version: "3.14.2",
    minOs: "macOS 12 and later",
    checksumSha256: computeChecksum("nexus-3.14.2-macos"),
    downloadUrl: "https://cdn.nexus-ai.com/nexus-3.14.2.dmg",
  });
  svc.publish({
    platform: "linux",
    version: "3.14.2",
    minOs: "Ubuntu 22.04 and later",
    checksumSha256: computeChecksum("nexus-3.14.2-linux"),
    downloadUrl: "https://cdn.nexus-ai.com/nexus-3.14.2.AppImage",
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
  readonly billing: ReturnType<typeof buildBillingModel>;
  readonly personalization: ReturnType<typeof buildPersonalizationModel>;
}

/** Build the shared demo view-models (platform-agnostic; no HTML here). */
export function buildDemoScreens(): DemoScreens {
  const isTr = CURRENT_LOCALE === "tr";
  const ctx: NavContext = { authenticated: true, plan: "family", role: "admin" };
  
  const devices = [
    { id: "lamp", nameKey: isTr ? "Salon Ortam Lambası" : "Living room ambient lamp", room: isTr ? "Salon" : "Living room", online: true },
    { id: "tv", nameKey: isTr ? "Salon 4K OLED TV" : "Living room 4K OLED TV", room: isTr ? "Salon" : "Living room", online: true },
    { id: "ac", nameKey: isTr ? "Yatak Odası Kliması" : "Bedroom Climate AC", room: isTr ? "Yatak Odası" : "Bedroom", online: true },
    { id: "lock", nameKey: isTr ? "Ön Kapı Akıllı Kilit" : "Front Door Smart Lock", room: isTr ? "Giriş" : "Entrance", online: false },
    { id: "speaker", nameKey: isTr ? "Stüdyo Dolby Soundbar" : "Studio Dolby Soundbar", room: isTr ? "Stüdyo" : "Studio", online: true },
    { id: "camera", nameKey: isTr ? "Bahçe Güvenlik Kamerası" : "Garden Security Camera", room: isTr ? "Bahçe" : "Garden", online: false },
    { id: "thermostat", nameKey: isTr ? "Koridor Akıllı Termostat" : "Hallway Smart Thermostat", room: isTr ? "Koridor" : "Hallway", online: true },
    { id: "curtain", nameKey: isTr ? "Yatak Odası Motorlu Perde" : "Bedroom Motorized Shades", room: isTr ? "Yatak Odası" : "Bedroom", online: true },
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
    home: buildHomeStateModel(devices.map((d) => ({ room: d.room, online: d.online }))),
    devices: buildDeviceListModel(devices),
    releases: demoReleases(),
    suggestions: buildSuggestionsModel(
      isTr
        ? [
            { id: "s1", textKey: "Akşam 19:00'da salon aydınlatmasını %40 seviyesine düşür", at: "19:00" },
            { id: "s2", textKey: "Sabah 07:30'da haber özetini ve hava durumunu seslendir", at: "07:30" },
            { id: "s3", textKey: "Sıcaklık 24°C üzerine çıktığında klimayı otomatik başlat", at: "Otomatik" },
          ]
        : [
            { id: "s1", textKey: "Dim living room lights to 40% at 19:00", at: "19:00" },
            { id: "s2", textKey: "Read morning news briefing & weather at 07:30", at: "07:30" },
            { id: "s3", textKey: "Auto-start AC when temperature exceeds 24°C", at: "Auto" },
          ],
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
    ),
    family: buildFamilyModel(
      isTr
        ? [
            { id: "m1", nameKey: "Ana Profil (Yönetici)", role: "admin" },
            { id: "m2", nameKey: "Aile Üyesi (Standart Erişimi)", role: "member" },
            { id: "m3", nameKey: "Çocuk Profili (Korumalı)", role: "member" },
            { id: "m4", nameKey: "Misafir Hesabı (Geçici)", role: "guest" },
          ]
        : [
            { id: "m1", nameKey: "Primary Profile (Admin)", role: "admin" },
            { id: "m2", nameKey: "Family Member (Standard)", role: "member" },
            { id: "m3", nameKey: "Child Profile (Restricted)", role: "member" },
            { id: "m4", nameKey: "Guest Account (Temporary)", role: "guest" },
          ],
    ),
    billing: buildBillingModel("family"),
    personalization: buildPersonalizationModel({
      assistantName: "Nexus AI",
      userAddress: isTr ? "Sistem Yöneticisi" : "System Administrator",
      language: CURRENT_LOCALE,
    }),
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
    billing,
    personalization,
  } = buildDemoScreens();

  const section = (id: string, html: string): string => `<section id="${id}">${html}</section>`;

  const isTr = CURRENT_LOCALE === "tr";
  return `<!doctype html>
<html lang="${CURRENT_LOCALE}" data-theme="${escapeHtml(themeName)}">
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
${section("today", renderTodayPanel(today))}
${section("home-state", renderHomeState(home))}
${section("suggestions", renderSuggestions(suggestions))}
${section("skills", renderSkills(skills))}
${section("devices", renderDevices(devices))}
${section("family", renderFamily(family))}
${section("personalization", renderPersonalization(personalization))}
${section("billing", renderBilling(billing))}
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
    case "devices":
      return renderDevices(s.devices);
    case "personalization":
      return renderPersonalization(s.personalization);
    case "billing":
      return renderBilling(s.billing);
    case "download-center":
      return renderDownloadCenter(s.releases, userAgent, surface);
  }
}

export const moduleName = "web" as const;
export const implemented = true;
