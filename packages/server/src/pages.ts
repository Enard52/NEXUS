/**
 * NEXUS AI — Server-rendered pages (FAZ 18)
 *
 * Both the login gate and the signed-in dashboard are drawn with the project's
 * real design system: the same `renderStyles` tokens, the same `renderNav`,
 * `renderScreenBody` and `renderAvatar` the web/desktop/mobile shells use. No
 * look-alike reconstruction — this *is* the shared UI, now fed by real
 * per-user data instead of demo fixtures.
 */

import { getTheme, type ThemeName } from "@nexus/design-system";
import {
  buildAdminDashboardModel,
  buildAgentsModel,
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
  type NavContext,
  type ScreenDescriptor,
} from "@nexus/interface";
import {
  demoReleases,
  escapeHtml,
  faviconDataUri,
  label,
  renderAvatar,
  renderCookieBanner,
  renderFeatures,
  renderLogo,
  renderNav,
  renderRichFooter,
  renderScreenBody,
  renderStyles,
  renderTodayPanel,
  renderHomeState,
  renderDevices,
  renderFamily,
  renderSkills,
  renderSuggestions,
  buildDemoScreens,
  setLocale,
  type DemoScreens,
  renderHead,
  demoSeo,
  renderPricing,
  renderTestimonials,
  renderFaq,
} from "@nexus/web";
import type { Account } from "@nexus/accounts";
import { renderMobileDocument } from "@nexus/mobile";
import { renderDesktopDocument } from "@nexus/desktop";
import { SkillDiscoveryService } from "@nexus/skills";
import type { OAuthProviderMeta } from "./oauth.js";
import type { UserData } from "./userdata.js";

const skillDiscovery = new SkillDiscoveryService();

/** Extra styles for the two surfaces this server owns: the auth card and the app top bar. */
function extraCss(): string {
  return `
.auth-body { min-height: 100vh; display: grid; place-items: center; padding: 24px;
  background: radial-gradient(80% 80% at 50% -10%, var(--tint), transparent 60%), var(--bg); }
.auth-card { width: 100%; max-width: 400px; background: var(--surface);
  border: 1px solid var(--border-strong); border-radius: var(--radius-lg);
  padding: 32px; box-shadow: var(--elev); }
.auth-brand { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px; }
.auth-brand svg { width: 38px; height: 38px; }
.auth-brand .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.04em; }
.auth-card h1 { font-size: 22px; margin: 16px 0 4px; letter-spacing: -0.02em; text-align: center; }
.auth-card .lede { color: var(--muted); font-size: 13px; margin: 0 0 24px; text-align: center; }
.auth-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.auth-field label { font-size: 12px; font-weight: 600; color: var(--muted); }
.auth-field input { background: var(--bg); border: 1px solid var(--border-strong);
  border-radius: var(--radius); padding: 12px 14px; color: var(--text); font-size: 14px;
  outline: none; transition: border-color .15s, box-shadow .15s; }
.auth-field input:focus { border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent); }
.auth-hint { color: var(--muted); font-size: 11px; margin-top: 2px; }
.auth-submit { width: 100%; justify-content: center; padding: 12px; font-size: 14px;
  font-weight: 600; margin-top: 4px; }
.auth-error { display: none; background: color-mix(in srgb, #ef4444 14%, var(--surface));
  border: 1px solid color-mix(in srgb, #ef4444 40%, transparent); color: #fca5a5;
  border-radius: var(--radius); padding: 10px 14px; font-size: 12px; margin-bottom: 16px; }
.auth-error.show { display: block; }
.auth-toggle { display: block; text-align: center; margin-top: 20px; font-size: 13px;
  color: var(--primary); background: none; border: none; cursor: pointer; width: 100%; }
.auth-toggle:hover { text-decoration: underline; }
.auth-lang { text-align: center; margin-top: 16px; font-size: 12px; }
.auth-lang a { color: var(--muted); text-decoration: none; }
.auth-lang a.active { color: var(--primary); font-weight: 700; }
/* Social / federated sign-in buttons + "or" divider */
.oauth-list { display: grid; gap: 10px; margin: 4px 0 0; }
.oauth-btn { display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 11px 14px; border-radius: var(--radius);
  border: 1px solid var(--border-strong); background: var(--bg); color: var(--text);
  font-size: 14px; font-weight: 600; text-decoration: none;
  transition: border-color .15s, background .15s, transform .05s; }
.oauth-btn:hover { border-color: var(--primary); background: var(--surface); }
.oauth-btn:active { transform: translateY(1px); }
.oauth-btn .oauth-ic { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; }
.oauth-btn.oauth-apple .oauth-ic { color: var(--text); }
.auth-divider { display: flex; align-items: center; gap: 12px; color: var(--muted);
  font-size: 12px; margin: 18px 0; }
.auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: var(--border); }
/* Guest / anonymous access — a low-commitment way to explore the product */
.auth-guest { margin-top: 12px; }
.auth-guest-hint { text-align: center; color: var(--muted); font-size: 11px; margin: 8px 0 0; }

.app-topbar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center;
  gap: 16px; padding: 12px 24px; background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid color-mix(in srgb, var(--border-strong) 40%, transparent); }
.app-topbar .brand-group { display: flex; align-items: center; gap: 12px; }
.app-topbar .brand { font-weight: 800; font-size: 18px; letter-spacing: 0.05em; }
.app-topbar .spacer { flex: 1; }
.app-user { display: flex; align-items: center; gap: 10px; }
.app-user .who { font-size: 13px; font-weight: 600; }
.app-lang { display: inline-flex; gap: 4px; font-size: 12px; margin-right: 4px; }
.app-lang a { color: var(--muted); text-decoration: none; }
.app-lang a.active { color: var(--primary); font-weight: 700; }
.app-logout { font-size: 12px; padding: 8px 14px; border-radius: 999px;
  border: 1px solid var(--border-strong); background: transparent; color: var(--text);
  cursor: pointer; transition: all .15s ease; }
.app-logout:hover { border-color: var(--primary); color: var(--primary); }
@media (max-width: 600px) { .app-user .who { display: none; } .app-topbar { padding: 10px 14px; } }
`.trim();
}

/** Compose the same DemoScreens shape the shared renderers expect — from real user data. */
export function buildUserScreens(
  account: Account,
  data: UserData,
): { screens: DemoScreens; nav: readonly ScreenDescriptor[] } {
  const ctx: NavContext = { authenticated: true, plan: data.plan, role: account.role };
  const devicesOnline = data.devices.filter((d) => d.online).length;

  const screens: DemoScreens = {
    nav: buildNavigation(ctx),
    today: buildTodayModel({
      devicesOnline,
      devicesTotal: data.devices.length,
      energyWhToday: data.energyWhToday,
      activeRoutines: data.routines.length,
      pendingSuggestions: data.suggestions.length,
    }),
    home: buildHomeStateModel(data.devices.map((d) => ({ room: d.room, online: d.online }))),
    devices: buildDeviceListModel(
      data.devices.map((d) => ({ id: d.id, nameKey: d.name, online: d.online })),
    ),
    releases: demoReleases(),
    suggestions: buildSuggestionsModel(
      data.suggestions.map((s) => ({ id: s.id, textKey: s.text, at: s.at })),
    ),
    skills: buildSkillsModel(
      data.routines.map((r) => ({ id: r.id, nameKey: r.name, usageCount: r.usageCount })),
      skillDiscovery.getDiscoverableSkills(),
    ),
    family: buildFamilyModel(data.family.map((m) => ({ id: m.id, nameKey: m.name, role: m.role }))),
    agents: buildAgentsModel([]),
    billing: buildBillingModel(data.plan),
    personalization: buildPersonalizationModel({
      assistantName: data.assistantName,
      userAddress: data.displayName,
      language: data.language,
    }),
    platform: buildPlatformModel(),
    adminDashboard: buildAdminDashboardModel(),
  };
  return { screens, nav: screens.nav };
}

const APP_SCRIPT = `
document.documentElement.classList.add("js-tabs");
var sections = Array.prototype.slice.call(document.querySelectorAll("main > section"));
var links = Array.prototype.slice.call(document.querySelectorAll("nav a[data-nav]"));
function show(id) {
  sections.forEach(function (s) { s.hidden = s.id !== id; });
  links.forEach(function (a) {
    var on = a.getAttribute("data-nav") === id;
    a.classList.toggle("active", on);
    if (on) { a.setAttribute("aria-current", "page"); } else { a.removeAttribute("aria-current"); }
  });
}
function fromHash() {
  var id = location.hash.replace("#", "");
  show(sections.some(function (s) { return s.id === id; }) ? id : (sections[0] && sections[0].id));
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
fromHash();
var out = document.getElementById("app-logout");
if (out) { out.addEventListener("click", function () {
  fetch("/api/logout", { method: "POST" }).then(function () { location.href = "/login"; });
}); }
window.nexusCommand = function(utterance, confirm) {
  var url = confirm ? "/api/command/confirm" : "/api/command";
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ utterance: utterance })
  }).then(function(r) { return r.json(); });
};
if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js").catch(function(){}); }
document.body.addEventListener("click", function(e) {
  var btn = e.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.closest(".mockup-content") || btn.closest(".hero-mockup")) return;
  var action = btn.getAttribute("data-action");
  var id = btn.getAttribute("data-id");
  if (action === "accept-suggestion") {
    fetch("/api/suggestions/" + encodeURIComponent(id) + "/accept", { method: "POST" }).then(function() { location.reload(); });
  } else if (action === "dismiss-suggestion") {
    fetch("/api/suggestions/" + encodeURIComponent(id) + "/dismiss", { method: "POST" }).then(function() { location.reload(); });
  } else if (action === "billing-subscribe") {
    var plan = btn.getAttribute("data-plan") || "premium";
    fetch("/api/billing/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan }) }).then(function() { location.reload(); });
  } else if (action === "billing-cancel") {
    fetch("/api/billing/cancel", { method: "POST" }).then(function() { location.reload(); });
  }
});
`.trim();

/** Brand glyph for a social provider (inline so no external asset is fetched). */
function providerIcon(id: string): string {
  if (id === "google") {
    return `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>`;
  }
  // Apple mark — uses currentColor so it adapts to the theme.
  return `<svg width="16" height="18" viewBox="0 0 16 18" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true"><path d="M13.09 9.54c-.02-1.9 1.55-2.81 1.62-2.86-.88-1.29-2.26-1.47-2.75-1.49-1.17-.12-2.28.69-2.87.69-.59 0-1.5-.67-2.47-.65-1.27.02-2.44.74-3.09 1.87-1.32 2.29-.34 5.68.95 7.54.63.9 1.38 1.92 2.36 1.88.95-.04 1.31-.61 2.45-.61s1.47.61 2.47.59c1.02-.02 1.66-.92 2.28-1.83.72-1.05 1.02-2.07 1.03-2.12-.02-.01-1.97-.76-1.99-3.01zM11.2 3.9c.52-.64.88-1.51.78-2.4-.75.03-1.67.5-2.21 1.13-.48.56-.91 1.46-.79 2.32.84.07 1.69-.42 2.22-1.05z"/></svg>`;
}

/** Social sign-in buttons + an "or" divider, or empty when no providers are offered. */
function renderSocialAuth(providers: readonly OAuthProviderMeta[] | undefined): string {
  if (!providers || providers.length === 0) return "";
  const buttons = providers
    .map(
      (p) =>
        `<a class="oauth-btn oauth-${escapeHtml(p.id)}" href="/api/oauth/${escapeHtml(p.id)}/start">` +
        `<span class="oauth-ic">${providerIcon(p.id)}</span>` +
        `<span>${escapeHtml(label(p.labelKey))}</span></a>`,
    )
    .join("");
  return (
    `<div class="oauth-list">${buttons}</div>` +
    `<div class="auth-divider"><span>${escapeHtml(label("auth.social.divider"))}</span></div>`
  );
}

/** Options for the login gate: which social providers to show and any OAuth notice. */
export interface LoginOptions {
  readonly providers?: readonly OAuthProviderMeta[];
  readonly notice?: "unavailable" | "error";
  readonly theme?: ThemeName;
}

/** The login / registration gate. No app content is reachable without passing it. */
export function renderLoginDocument(locale: string, opts: LoginOptions = {}): string {
  setLocale(locale);
  const theme = opts.theme ?? "dark";
  const t = getTheme(theme);
  const other = locale === "tr" ? "en" : "tr";
  const notice = opts.notice
    ? `<div class="auth-error show">${escapeHtml(label(opts.notice === "unavailable" ? "auth.social.unavailable" : "auth.social.error"))}</div>`
    : "";
  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(label("auth.signInTitle"))} — NEXUS</title>
<link rel="icon" href="${faviconDataUri(t.color.primary)}" />
<style>${renderStyles(t)}${extraCss()}</style>
</head>
<body class="auth-body">
<main class="auth-card">
    <a href="/" class="auth-brand" style="text-decoration:none;">${renderLogo()}<span class="brand">NEXUS</span></a>
<h1 id="auth-title">${escapeHtml(label("auth.signInTitle"))}</h1>
<p class="lede">${escapeHtml(label("auth.tagline"))}</p>
${notice}
${renderSocialAuth(opts.providers)}
<div class="auth-error" id="auth-error" role="alert"></div>
<form id="auth-form" autocomplete="on">
<div class="auth-field">
<label for="email">${escapeHtml(label("auth.email"))}</label>
<input id="email" name="email" type="email" required autocomplete="email" />
</div>
<div class="auth-field">
<label for="password">${escapeHtml(label("auth.password"))}</label>
<input id="password" name="password" type="password" required autocomplete="current-password" minlength="8" />
<span class="auth-hint" id="pw-hint" hidden>${escapeHtml(label("auth.passwordHint"))}</span>
</div>
<button type="submit" class="btn primary auth-submit" id="auth-submit">${escapeHtml(label("auth.signInButton"))}</button>
</form>
<button type="button" class="oauth-btn auth-guest" id="auth-guest"><span>${escapeHtml(label("auth.guest"))}</span></button>
<p class="auth-guest-hint">${escapeHtml(label("auth.guestHint"))}</p>
<button type="button" class="auth-toggle" id="auth-toggle">${escapeHtml(label("auth.switchToSignUp"))}</button>
<p class="auth-lang"><a href="?lang=${locale}" class="active">${locale.toUpperCase()}</a> · <a href="?lang=${other}">${other.toUpperCase()}</a></p>
</main>
<script>${loginScript(label("auth.signInTitle"), label("auth.signUpTitle"), label("auth.signInButton"), label("auth.signUpButton"), label("auth.switchToSignUp"), label("auth.switchToSignIn"), label("auth.genericError"))}</script>
</body>
</html>`;
}

/** Client script: toggles sign-in/up, posts credentials, redirects home on success. */
function loginScript(
  signInTitle: string,
  signUpTitle: string,
  signInBtn: string,
  signUpBtn: string,
  toSignUp: string,
  toSignIn: string,
  genericError: string,
): string {
  const j = (s: string) => JSON.stringify(s);
  return `
(function () {
  var mode = "signin";
  var form = document.getElementById("auth-form");
  var title = document.getElementById("auth-title");
  var submit = document.getElementById("auth-submit");
  var toggle = document.getElementById("auth-toggle");
  var errorBox = document.getElementById("auth-error");
  var pwHint = document.getElementById("pw-hint");
  var pw = document.getElementById("password");
  function apply() {
    var signup = mode === "signup";
    title.textContent = signup ? ${j(signUpTitle)} : ${j(signInTitle)};
    submit.textContent = signup ? ${j(signUpBtn)} : ${j(signInBtn)};
    toggle.textContent = signup ? ${j(toSignIn)} : ${j(toSignUp)};
    pw.setAttribute("autocomplete", signup ? "new-password" : "current-password");
    if (pwHint) pwHint.hidden = !signup;
    errorBox.classList.remove("show");
  }
  toggle.addEventListener("click", function () { mode = mode === "signin" ? "signup" : "signin"; apply(); });
  var guest = document.getElementById("auth-guest");
  if (guest) guest.addEventListener("click", function () {
    errorBox.classList.remove("show");
    guest.disabled = true;
    fetch("/api/guest", { method: "POST" }).then(function (r) {
      if (r.ok) { location.href = "/app"; return; }
      guest.disabled = false;
      errorBox.textContent = ${j(genericError)};
      errorBox.classList.add("show");
    }).catch(function () {
      guest.disabled = false;
      errorBox.textContent = ${j(genericError)};
      errorBox.classList.add("show");
    });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.classList.remove("show");
    submit.disabled = true;
    var body = JSON.stringify({ email: form.email.value, password: form.password.value });
    fetch(mode === "signup" ? "/api/register" : "/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: body,
    }).then(function (r) {
      return r.json().then(function (data) { return { ok: r.ok, data: data }; });
    }).then(function (res) {
      if (res.ok) { location.href = "/app"; return; }
      errorBox.textContent = (res.data && res.data.error) || ${j(genericError)};
      errorBox.classList.add("show");
      submit.disabled = false;
    }).catch(function () {
      errorBox.textContent = ${j(genericError)};
      errorBox.classList.add("show");
      submit.disabled = false;
    });
  });
  apply();
})();
`.trim();
}

/** The signed-in dashboard, rendered from the user's real (possibly empty) data. */
export function renderAppDocument(
  account: Account,
  data: UserData,
  userAgent: string,
  theme: ThemeName = "dark",
): string {
  const locale = data.language;
  setLocale(locale);
  const t = getTheme(theme);
  const { screens, nav } = buildUserScreens(account, data);
  const other = locale === "tr" ? "en" : "tr";

  const first = nav[0]?.id ?? "today";
  const sections = nav
    .map((s) => {
      const body = renderScreenBody(s.id, screens, userAgent, "web");
      return `<section id="${s.id}"${s.id === first ? "" : " hidden"}>${body}</section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(label("screen.today"))} — NEXUS</title>
<link rel="icon" href="${faviconDataUri(t.color.primary)}" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="${t.color.bg}" />
<style>${renderStyles(t)}${extraCss()}</style>
</head>
<body>
<header class="app-topbar">
<a href="/" class="brand-group" style="text-decoration:none;">${renderLogo()}<span class="brand">NEXUS</span></a>
<div class="spacer"></div>
<span class="app-lang"><a href="?lang=${locale}" class="active">${locale.toUpperCase()}</a> · <a href="?lang=${other}">${other.toUpperCase()}</a></span>
<div class="app-user">${renderAvatar(undefined, data.displayName)}<span class="who">${escapeHtml(data.displayName)}</span></div>
<button class="app-logout" id="app-logout">${escapeHtml(label("auth.logout"))}</button>
</header>
<div class="wrap">
${renderNav(nav, first)}
<main id="main">${sections}</main>
</div>
${renderRichFooter(t.color.primary)}
<script>${APP_SCRIPT}</script>
</body>
</html>`;
}

/**
 * The signed-in mobile app: the same real user data as {@link renderAppDocument},
 * drawn through the authentic phone shell (status bar + bottom tab bar) with
 * authenticated chrome (language switch + logout) and installable-PWA wiring.
 */
export function renderMobileAppDocument(
  account: Account,
  data: UserData,
  theme: ThemeName = "dark",
): string {
  setLocale(data.language);
  const { screens } = buildUserScreens(account, data);
  return renderMobileDocument({
    theme,
    screens,
    displayName: data.displayName,
    locale: data.language,
    authenticated: true,
  });
}

/**
 * The signed-in desktop app: the same real user data as {@link renderAppDocument},
 * drawn through the authentic windowed shell (title bar + persistent sidebar) with
 * authenticated chrome (language switch + letter avatar + logout) and PWA wiring.
 */
export function renderDesktopAppDocument(
  account: Account,
  data: UserData,
  theme: ThemeName = "dark",
): string {
  setLocale(data.language);
  const { screens } = buildUserScreens(account, data);
  return renderDesktopDocument({
    theme,
    screens,
    displayName: data.displayName,
    locale: data.language,
    authenticated: true,
  });
}

/** Marketing-only styles: hero, stats, desktop showcase, how-it-works, CTA. */
function marketingCss(): string {
  return `
html { scroll-behavior: smooth; }
.mkt { max-width: 1140px; margin: 0 auto; padding: 0 24px 24px; position: relative; z-index: 1; }
.mkt-anchor, #desktop, #mobile, #faq { scroll-margin-top: 84px; }

/* ── Rich background mesh ── */
body {
  background-color: var(--bg);
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--primary) 24%, transparent), transparent),
    radial-gradient(ellipse 60% 45% at 85% 75%, color-mix(in srgb, var(--primary) 14%, transparent), transparent),
    radial-gradient(ellipse 50% 35% at 10% 65%, color-mix(in srgb, var(--primary) 10%, transparent), transparent),
    radial-gradient(circle 300px at 50% 50%, color-mix(in srgb, var(--accent, var(--primary)) 5%, transparent), transparent);
  background-attachment: fixed;
}
/* ── Section background accents ── */
.mkt-anchor { position: relative; }
.mkt-anchor::before {
  content: ''; position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
  width: 700px; height: 450px; border-radius: 50%; pointer-events: none; z-index: -1;
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 70%);
}
#features::before { top: -80px; width: 900px; height: 550px; background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 16%, transparent) 0%, transparent 70%); }
#pricing::before { width: 800px; height: 500px; background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 18%, transparent) 0%, transparent 70%); }
.mkt-testimonials::before { content: ''; position: absolute; top: -40px; left: 50%; transform: translateX(-50%); width: 600px; height: 400px; border-radius: 50%; pointer-events: none; z-index: -1; background: radial-gradient(ellipse at center, color-mix(in srgb, var(--accent, var(--primary)) 10%, transparent) 0%, transparent 70%); }
.mkt-testimonials { position: relative; }
#mobile::before { width: 700px; height: 450px; background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 70%); }
#desktop::before { width: 800px; height: 500px; background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 70%); }

/* ── Theme toggle ── */
.theme-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  color: var(--muted); cursor: pointer; transition: all 0.2s ease;
  backdrop-filter: blur(8px); flex: none;
}
.theme-toggle:hover { color: var(--primary); border-color: var(--primary); background: var(--tint); }
.theme-toggle .icon-moon { display: none; }
.theme-toggle .icon-sun  { display: block; }
[data-theme="light"] .theme-toggle .icon-moon { display: block; }
[data-theme="light"] .theme-toggle .icon-sun  { display: none; }

/* ── Hero ── */
.hero { position: relative; overflow: hidden; padding: 72px 0 48px; border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); margin-bottom: 40px; }
.hero-inner { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 56px; align-items: center; }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 12px;
  font-weight: 700; color: var(--primary); background: color-mix(in srgb, var(--primary) 12%, transparent);
  padding: 8px 16px; border-radius: 999px; margin-bottom: 28px; letter-spacing: 0.04em;
  box-shadow: 0 0 24px color-mix(in srgb, var(--primary) 30%, transparent); border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent); }
.hero-badge .plat-ic { display: inline-flex; gap: 6px; margin-left: 4px; }
.hero-badge .plat-ic svg { opacity: 0.85; }
.hero h1 { color: var(--text); font-size: 52px; line-height: 1.06; letter-spacing: -0.035em; margin: 0 0 22px; font-weight: 800; }
.hero .lede { color: var(--muted); font-size: 18px; line-height: 1.7; max-width: 48ch; margin: 0 0 32px; }
.hero .btn.primary { color: var(--on-primary); background: var(--gradient); box-shadow: 0 8px 28px color-mix(in srgb, var(--primary) 45%, transparent); transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease; font-size: 14px; padding: 12px 24px; }
.hero .btn.primary:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 14px 36px color-mix(in srgb, var(--primary) 60%, transparent); }
.hero .actions { display: flex; gap: 10px; flex-wrap: wrap; }
.hero .actions .btn.primary { flex: none; }
.hero .trust { color: var(--muted); font-size: 12px; margin-top: 16px; }
@media (prefers-reduced-motion: no-preference) {
  .hero .btn.primary { animation: nxPulseRing 2.8s ease-in-out infinite; }
}
@keyframes nxPulseRing {
  0%, 100% { box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent), 0 0 0 0 color-mix(in srgb, var(--primary) 30%, transparent); }
  50% { box-shadow: 0 12px 32px color-mix(in srgb, var(--primary) 60%, transparent), 0 0 0 8px color-mix(in srgb, var(--primary) 0%, transparent); }
}
/* Scroll indicator */
.scroll-hint { margin-top: 28px; display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 12px; }
.scroll-hint .mouse { width: 20px; height: 32px; border: 2px solid color-mix(in srgb, var(--muted) 60%, transparent); border-radius: 12px; position: relative; }
.scroll-hint .mouse::after { content: ""; position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 4px; height: 8px; border-radius: 999px; background: var(--muted); animation: nxScrollDot 1.6s ease-in-out infinite; }
@keyframes nxScrollDot { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, 10px); } }

/* Hero mockup */
.hero-mockup { position: relative; }
.hero-mockup .mockup-frame {
  border: 1px solid color-mix(in srgb, var(--border-strong) 30%, transparent);
  border-radius: 16px; overflow: hidden;
  background: color-mix(in srgb, var(--surface) 92%, transparent); backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
  box-shadow:
    0 2px 4px rgba(0,0,0,0.08),
    0 8px 24px rgba(0,0,0,0.12),
    0 32px 80px color-mix(in srgb, var(--primary) 12%, transparent),
    0 0 0 1px rgba(255,255,255,0.06) inset,
    0 1px 0 rgba(255,255,255,0.1) inset;
  transition: box-shadow 0.4s ease;
}
.hero-mockup .mockup-frame:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.14), 0 48px 96px color-mix(in srgb, var(--primary) 16%, transparent), 0 0 0 1px rgba(255,255,255,0.06) inset; }
.mockup-bar { display: flex; align-items: center; gap: 7px; padding: 14px 18px;
  background: color-mix(in srgb, var(--bg) 70%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); }
.mockup-bar .wctl { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.mockup-bar .wctl-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: var(--muted); }
.mockup-bar .wctl-icon:hover { background: color-mix(in srgb, var(--text) 8%, transparent); color: var(--text); }
.mockup-bar .wctl-icon.close:hover { background: #ef4444; color: #fff; }
.mockup-bar .murl { flex: 1; text-align: center; font-size: 11px; color: var(--muted); font-weight: 600; letter-spacing: 0.03em; }
.mockup-body { padding: 0; max-height: 380px; overflow: hidden; }
/* Mockup panel switching */
.mockup-panel { display: none; animation: mockupFadeIn 0.25s ease; }
.mockup-panel.active { display: block; }
.phone-panel { display: none; animation: mockupFadeIn 0.25s ease; }
.phone-panel.active { display: flex; flex-direction: column; gap: 10px; }
@keyframes mockupFadeIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
/* Mockup mini-screens */
.mock-room-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mock-room { background: color-mix(in srgb, var(--surface) 70%, transparent); border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); border-radius: 12px; padding: 14px; }
.mock-room .room-name { font-size: 11px; font-weight: 700; color: var(--text); }
.mock-room .room-count { font-size: 10px; color: var(--muted); margin-top: 4px; }
.mock-device-list { display: flex; flex-direction: column; gap: 8px; }
.mock-device { display: flex; align-items: center; gap: 10px; background: color-mix(in srgb, var(--surface) 70%, transparent); border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); border-radius: 10px; padding: 12px; }
.mock-device .dev-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--tint); display: flex; align-items: center; justify-content: center; color: var(--primary); }
.mock-device .dev-info { flex: 1; }
.mock-device .dev-name { font-size: 11px; font-weight: 600; color: var(--text); }
.mock-device .dev-room { font-size: 9px; color: var(--muted); }
.mock-device .dev-status { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
@media (prefers-reduced-motion: no-preference) {
  .hero-mockup { animation: nxFloat 6s ease-in-out infinite; }
  @keyframes nxFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
}
@media (max-width: 860px) { .hero-inner { grid-template-columns: 1fr; } .hero-mockup { display: none; } }

/* ── Stats strip ── */
.mkt-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
  margin: 20px 0; padding: 36px; border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: var(--radius-lg); background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.05); }
.mkt-stats .stat { text-align: center; transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.mkt-stats .stat:hover { transform: translateY(-5px) scale(1.03); }
.mkt-stats .stat-num { display: block; font-size: 34px; font-weight: 800; letter-spacing: -0.02em; color: var(--primary); }
.mkt-stats .stat-label { display: block; color: var(--muted); font-size: 12px; margin-top: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }

/* ── Section headings ── */
.mkt-heading { text-align: center; margin: 96px 0 18px; }
.mkt-heading h2 { font-size: 38px; letter-spacing: -0.025em; margin: 0; color: var(--text); font-weight: 800; }
.mkt-heading p { color: var(--muted); font-size: 16px; margin: 14px auto 0; max-width: 52ch; line-height: 1.7; }
.eyebrow { display: block; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: var(--accent); margin-bottom: 12px; }

/* ── Testimonials ── */
.mkt-testimonials { max-width: 1080px; margin: 80px auto 40px; display: flex; flex-direction: column; align-items: center; padding: 0 24px; }
.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; width: 100%; margin-top: 24px; }
.testimonial-card {
  padding: 32px; border-radius: 24px;
  background: color-mix(in srgb, var(--surface) 80%, transparent); backdrop-filter: blur(16px);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  box-shadow: 0 16px 32px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 20px;
  transition: transform 0.3s ease, border-color 0.3s ease;
}
.testimonial-card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--primary) 40%, transparent); }
.testimonial-card .stars { display: flex; gap: 4px; color: #F59E0B; }
.testimonial-card p { font-size: 16px; font-weight: 500; line-height: 1.6; color: var(--text); margin: 0; font-style: italic; flex: 1; }
.testimonial-card .author-info { display: flex; align-items: center; gap: 16px; margin-top: auto; }
.testimonial-card .author-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--gradient); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 18px; object-fit: cover; }
.testimonial-card .author-name { font-size: 15px; font-weight: 700; color: var(--text); }
.testimonial-card .author-role { font-size: 13px; color: var(--muted); }

/* ── Desktop showcase ── */
.desktop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: 44px; }
.dsk-card {
  display: flex; flex-direction: column; gap: 18px; align-items: center; text-align: center;
  background: color-mix(in srgb, var(--surface) 70%, transparent); backdrop-filter: blur(16px);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); border-radius: var(--radius-lg);
  padding: 36px 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.06); transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, border-color 0.3s ease;
  position: relative; overflow: hidden;
}
.dsk-card:hover { transform: translateY(-8px); box-shadow: 0 28px 56px color-mix(in srgb, var(--primary) 20%, transparent); border-color: color-mix(in srgb, var(--primary) 40%, transparent); }
.dsk-card-icon { display: flex; align-items: center; justify-content: center; width: 68px; height: 68px; border-radius: var(--radius-lg); background: var(--tint); margin-bottom: 10px; transition: background 0.3s ease; }
.dsk-card:hover .dsk-card-icon { background: color-mix(in srgb, var(--primary) 20%, transparent); }
.dsk-card-icon svg, .dsk-plat-logo-lg svg { width: 32px; height: 32px; }
.dsk-card .dsk-info { display: flex; flex-direction: column; gap: 8px; }
.dsk-plat-header { display: flex; align-items: center; justify-content: center; gap: 10px; }
.dsk-plat-header h3 { font-size: 18px; font-weight: 700; margin: 0; }
.dsk-plat-logo { flex: none; display: inline-flex; align-items: center; }
.dsk-card .dsk-info p { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.6; }
.dsk-card .dsk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 22px; border-radius: var(--radius); font-size: 13px; font-weight: 600; text-decoration: none; background: var(--gradient); color: #ffffff; box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 40%, transparent); transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease; margin-top: auto; }
.dsk-card .dsk-btn:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 55%, transparent); }
@media (max-width: 860px) { .desktop-grid { grid-template-columns: 1fr; max-width: 480px; margin-left: auto; margin-right: auto; } }

/* ── Integrations strip ── */
.mkt-integrations { margin-top: 80px; padding: 40px 0; overflow: hidden; border-top: 1px solid color-mix(in srgb, var(--border) 40%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); text-align: center; background: color-mix(in srgb, var(--surface) 30%, transparent); }
.integration-title { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 28px; }
.brand-logos { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px 0; }
.brand-logo-pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 18px; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  font-size: 13px; font-weight: 700; color: var(--text);
  margin: 6px; transition: all 0.2s; cursor: default;
}
.brand-logo-pill:hover { border-color: color-mix(in srgb, var(--primary) 40%, transparent); color: var(--primary); background: var(--tint); }
.brand-logo-pill svg, .brand-logo-pill img { flex: none; display: block; }
.brand-logo-img { width: 18px; height: 18px; object-fit: contain; }

/* ── Closing CTA band ── */
.cta-band { margin: 96px 0 0; padding: 64px 40px; text-align: center;
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 16%, var(--surface)), color-mix(in srgb, var(--accent) 6%, var(--surface)));
  border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent); border-radius: var(--radius-lg);
  box-shadow: 0 24px 56px color-mix(in srgb, var(--primary) 14%, transparent); }
.cta-band .cta-logo { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.cta-band .cta-logo .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.05em; }
.cta-band h2 { font-size: 32px; margin: 0 0 14px; letter-spacing: -0.025em; color: var(--text); font-weight: 800; }
.cta-band p { color: var(--muted); font-size: 16px; margin: 0 0 32px; line-height: 1.65; }
.cta-band .btn.primary { font-size: 16px; padding: 16px 40px; background: var(--gradient); color: #ffffff; box-shadow: 0 8px 28px color-mix(in srgb, var(--primary) 45%, transparent); transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease; }
.cta-band .btn.primary:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 14px 36px color-mix(in srgb, var(--primary) 60%, transparent); }

/* ── How It Works ── */
.how-section { margin: 96px 0 0; }
.how-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 36px; margin-top: 44px; }

/* ── Product Explainer ── */
.product-explainer { margin: 80px 0 0; }
.explainer-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px; margin-top: 44px; }
.explainer-card {
  padding: 36px; border-radius: 20px;
  background: color-mix(in srgb, var(--surface) 70%, transparent); backdrop-filter: blur(16px);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  display: flex; flex-direction: column; gap: 16px;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, border-color 0.3s ease;
}
.explainer-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px color-mix(in srgb, var(--primary) 14%, transparent); border-color: color-mix(in srgb, var(--primary) 30%, transparent); }
.explainer-icon { width: 48px; height: 48px; border-radius: 14px; background: color-mix(in srgb, var(--primary) 12%, transparent); display: flex; align-items: center; justify-content: center; color: var(--primary); }
.explainer-card h3 { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
.explainer-card p { font-size: 14px; color: var(--muted); margin: 0; line-height: 1.7; }
@media (max-width: 720px) { .explainer-grid { grid-template-columns: 1fr; } }
.how-step {
  text-align: center; padding: 36px 28px;
  background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); border-radius: var(--radius-lg);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease;
}
.how-step:hover { transform: translateY(-6px); box-shadow: 0 20px 48px color-mix(in srgb, var(--primary) 14%, transparent); }
.how-num { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: var(--gradient); color: #ffffff; font-size: 17px; font-weight: 800; margin-bottom: 18px; box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 35%, transparent); }
.how-step h3 { font-size: 18px; font-weight: 700; margin: 0 0 10px; color: var(--text); }
.how-step p { font-size: 14px; color: var(--muted); margin: 0; line-height: 1.6; }
@media (max-width: 720px) { .how-steps { grid-template-columns: 1fr; max-width: 360px; margin-left: auto; margin-right: auto; } }

/* ── Download center (kept for direct links) ── */
.mkt-download h2 { text-align: center; font-size: 36px; letter-spacing: -0.02em; margin: 80px 0 24px; color: var(--text); }
.mkt-download { text-align: center; }
.mkt-download table { text-align: left; margin-top: 32px; background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(12px); border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.02); }
.mkt-download th, .mkt-download td { border-color: color-mix(in srgb, var(--border) 40%, transparent); }

/* ── Cookie banner ── */
.cookie-banner {
  display: none; position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  max-width: 520px; width: calc(100% - 32px); z-index: 9999;
  background: color-mix(in srgb, var(--surface) 95%, transparent); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: var(--radius-lg); padding: 22px 26px;
  box-shadow: 0 24px 56px rgba(0,0,0,0.22);
  align-items: center; gap: 16px; flex-wrap: wrap;
}
.cookie-banner .cb-content { flex: 1; min-width: 200px; }
.cookie-banner .cb-content strong { font-size: 14px; color: var(--text); font-weight: 700; }
.cookie-banner .cb-content p { font-size: 13px; color: var(--muted); margin: 6px 0 0; line-height: 1.55; }
.cookie-banner .cb-actions { display: flex; gap: 10px; flex: none; }
.cookie-banner .cb-actions .btn { font-size: 13px; padding: 9px 18px; border-radius: var(--radius); }
.cookie-banner .cb-actions .btn.primary { background: var(--gradient); color: #ffffff; }

@media (max-width: 720px) { .mkt-stats { grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 20px; } }

/* Scroll-reveal — .nx-reveal is added by JS only, so no-JS visitors see everything */
@media (prefers-reduced-motion: no-preference) {
  .nx-reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s cubic-bezier(.2,.8,.2,1), transform .7s cubic-bezier(.2,.8,.2,1); transition-delay: var(--nx-d, 0ms); }
  .nx-reveal.nx-in { opacity: 1; transform: none; }
}

/* ── Mobile Showcase & Phone Mockup ── */
.mobile-showcase { display: flex; flex-direction: column; align-items: center; gap: 40px; margin-top: 48px; }
.phone-mockup { position: relative; }
.phone-frame {
  width: 360px; height: 720px; border-radius: 44px;
  background: var(--bg);
  border: 10px solid #1a1a1e;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08) inset,
    0 0 0 1.5px #0d0d0f,
    0 4px 8px rgba(0,0,0,0.15),
    0 16px 40px rgba(0,0,0,0.25),
    0 48px 80px rgba(0,0,0,0.35);
  display: flex; flex-direction: column; position: relative; overflow: hidden;
}
.phone-island {
  width: 90px; height: 24px; background: #000; border-radius: 14px;
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%); z-index: 10;
}
.phone-screen { flex: 1; padding: 44px 14px 12px; display: flex; flex-direction: column; gap: 12px; background: var(--bg); overflow: hidden; }
.phone-screen .phone-dash-preview { overflow-y: auto; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--muted) 30%, transparent) transparent; }
.phone-screen .phone-dash-preview::-webkit-scrollbar { width: 3px; }
.phone-screen .phone-dash-preview::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--muted) 40%, transparent); border-radius: 4px; }
.phone-screen .phone-dash-preview::-webkit-scrollbar-track { background: transparent; }
.phone-status-bar { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; color: var(--text); padding: 0 4px; }
.phone-status-bar .status-icons { display: flex; align-items: center; gap: 5px; }
.phone-status-bar .status-icons svg { display: block; }
.phone-app-header {
  display: flex; align-items: center; gap: 8px; font-size: 14px;
  padding: 8px 12px; margin: 0 -14px;
  background: rgba(15, 18, 28, 0.75); backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 18%, var(--surface));
  position: relative;
}
.phone-app-header::after {
  content: ''; position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 40%, transparent), transparent);
}
.phone-app-header .app-avatar {
  margin-left: auto; width: 26px; height: 26px; border-radius: 50%;
  background: var(--gradient); display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff;
}
.phone-dash-preview { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; flex: 1; overflow-y: auto; }
.phone-dash-preview .dash-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
.phone-dash-preview .card-label { font-size: 11px; color: var(--muted); display: block; }
.phone-dash-preview .card-stat { font-size: 18px; font-weight: 700; color: var(--primary); margin-top: 4px; }
.phone-home-bar { width: 110px; height: 4px; background: var(--text); border-radius: 2px; margin: auto auto 6px; opacity: 0.25; }
.phone-tabbar {
  flex: none; display: flex; align-items: center; justify-content: space-around;
  padding: 8px 6px 6px; background: color-mix(in srgb, var(--surface) 95%, transparent);
  border-top: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  backdrop-filter: blur(12px);
}
.phone-tabbar .ptab {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  font-size: 9px; color: var(--muted); text-decoration: none; transition: color 0.2s;
}
.phone-tabbar .ptab.active { color: var(--primary); }
.phone-tabbar .ptab svg { width: 18px; height: 18px; }
.phone-tabbar .ptab { cursor: pointer; }
/* ── Mockup desktop sidebar (faithful) ── */
.mockup-sidebar-full {
  width: 140px; flex: none; display: flex; flex-direction: column; gap: 8px;
  padding: 14px 10px; border-right: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  background: color-mix(in srgb, var(--surface) 60%, transparent);
}
.mockup-sidebar-full .ms-brand {
  display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800;
  color: var(--text); margin-bottom: 6px;
}
.mockup-sidebar-full .ms-brand svg { width: 18px; height: 18px; }
.mockup-sidebar-full .ms-nav { display: flex; flex-direction: column; gap: 2px; }
.mockup-sidebar-full .ms-item {
  display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 6px;
  font-size: 10px; font-weight: 500; color: var(--muted); text-decoration: none; transition: background 0.2s; cursor: pointer;
}
.mockup-sidebar-full .ms-item:hover { background: color-mix(in srgb, var(--surface) 80%, transparent); color: var(--text); }
.mockup-sidebar-full .ms-item.active {
  background: var(--tint); color: var(--primary); font-weight: 700;
}
.mockup-sidebar-full .ms-item svg { width: 14px; height: 14px; flex: none; }
.mockup-sidebar-full .ms-foot {
  margin-top: auto; font-size: 9px; color: var(--muted); padding: 4px 8px; opacity: 0.7;
}
@media (prefers-reduced-motion: no-preference) {
  .phone-mockup { animation: nxPhoneFloat 5s ease-in-out infinite; }
  @keyframes nxPhoneFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
}
.store-badges { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.store-badge-btn {
  display: inline-flex; align-items: center; gap: 12px; padding: 10px 20px;
  border-radius: var(--radius-lg); background: var(--surface); border: 1px solid var(--border-strong);
  color: var(--text); text-decoration: none; transition: transform 0.25s, box-shadow 0.25s;
}
.store-badge-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-color: var(--primary); }
.store-badge-btn .badge-text { display: flex; flex-direction: column; text-align: left; }
.store-badge-btn .badge-text .sub { font-size: 10px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1; margin-bottom: 2px; }
.store-badge-btn .badge-text .main { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; line-height: 1; }

/* ── Mockup Shared Styles ── */
.hero-mockup h2, .phone-mockup h2 { margin: 0 0 14px; font-size: 15px; font-weight: 800; color: var(--text); display: flex; justify-content: space-between; align-items: center; }
.hero-mockup .assistant-strip, .phone-mockup .assistant-strip { display: none; }
.hero-mockup .bento { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.phone-mockup .bento { display: grid; grid-template-columns: 1fr; gap: 10px; }
.hero-mockup .bento-tile, .phone-mockup .bento-tile {
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  border-radius: 14px; padding: 18px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.phone-mockup .bento-tile { padding: 14px; }
.hero-mockup .bento-tile.featured, .phone-mockup .bento-tile.featured { grid-column: 1 / -1; }
.hero-mockup .bento-tile.wide, .phone-mockup .bento-tile.wide { grid-column: 1 / -1; }
.hero-mockup .tile-head, .phone-mockup .tile-head { display: flex; align-items: center; gap: 8px; color: var(--muted); }
.hero-mockup .tile-head .cardicon, .phone-mockup .tile-head .cardicon { display: flex; color: var(--primary); }
.hero-mockup .tile-head .tile-title, .phone-mockup .tile-head .tile-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.hero-mockup .value, .phone-mockup .value { font-size: 26px; font-weight: 800; color: var(--text); letter-spacing: -0.03em; margin-top: auto; }
.phone-mockup .value { font-size: 22px; }
.hero-mockup .ring-wrap, .phone-mockup .ring-wrap { display: flex; align-items: center; gap: 16px; }
.hero-mockup .ring-meta, .phone-mockup .ring-meta { display: flex; flex-direction: column; }
.hero-mockup .ring-meta .value, .phone-mockup .ring-meta .value { font-size: 20px; margin: 0; }
.phone-mockup .ring-meta .value { font-size: 16px; }
.hero-mockup .ring-meta .label, .phone-mockup .ring-meta .label { font-size: 11px; color: var(--muted); margin-top: 3px; }
.phone-mockup .ring svg.ring { width: 60px; height: 60px; }

.phone-dash-preview .dash-card {
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
  border-radius: 12px; padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.phone-dash-preview .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); display: block; }
.phone-dash-preview .card-stat { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: var(--text); margin-top: 5px; }

/* ── Focus styles (accessibility) ── */
:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; border-radius: 4px; }
.btn:focus-visible { outline-offset: 4px; }
`.trim();
}

/**
 * The public marketing + download center at `/`. This is the *only* thing an
 * unauthenticated web visitor sees: the product is presented, then they are
 * pushed to download the desktop or mobile app. It reuses the shared design
 * system (navbar, hero, features, FAQ, footer, download center) so it stays
 * pixel-consistent with the app itself, and shows a live preview of the real
 * Today dashboard rendered from the shared view-models.
 */
export function renderMarketingDocument(
  locale: string,
  _userAgent: string,
  theme: ThemeName = "dark",
): string {
  setLocale(locale);
  const t = getTheme(theme);
  const releases = demoReleases();

  const winRelease = releases.all().find((r) => r.platform === "windows");
  const macRelease = releases.all().find((r) => r.platform === "macos");
  const linRelease = releases.all().find((r) => r.platform === "linux");
  const demoScreens = buildDemoScreens();

  const langSwitch =
    `<span class="nav-controls-pill"><span class="lang-switch-clean">` +
    `<a class="lang-opt ${locale === "en" ? "active" : ""}" href="?lang=en">EN</a>` +
    `<span class="lang-sep">/</span>` +
    `<a class="lang-opt ${locale === "tr" ? "active" : ""}" href="?lang=tr">TR</a>` +
    `</span></span>`;

  const themeToggle =
    `<button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme" type="button">` +
    `<svg class="icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>` +
    `<svg class="icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>` +
    `</button>`;

  const hamburger = `<button class="hamburger" aria-label="Menu" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>`;

  const navbar = `<div class="navbar" role="banner" id="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<nav class="nav-links" aria-label="Primary">
<a class="nav-link" href="/#features">${label("mkt.nav.features")}</a>
<a class="nav-link" href="/#pricing">${label("mkt.nav.pricing")}</a>
<a class="nav-link" href="/#integrations">${label("mkt.nav.integrations")}</a>
<a class="nav-link" href="/#faq">${label("mkt.nav.faq")}</a>
</nav>
<div class="nav-actions">${langSwitch}${themeToggle}<a class="btn btn-ghost nav-signin" href="/login">${label("mkt.nav.signIn")}</a>${hamburger}</div>
</div></div>`;

  const platformIcons = `<span class="plat-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5.5L10.5 4.5v7H3v-6zM3 12.5h7.5v7L3 18.5v-6zM12.5 4.2L21 3v8.5h-8.5v-7.3zM12.5 12.5H21V21l-8.5-1.2v-7.3z"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.7 17.3c-.5 1.1-.7 1.6-1.3 2.6-.9 1.4-2.1 3.2-3.7 3.2-1.4 0-1.7-.9-3.6-.9s-2.3.9-3.6.9c-1.6 0-2.7-1.6-3.6-3-2.5-3.8-2.8-8.3-1.2-10.7 1.1-1.7 2.8-2.7 4.5-2.7 1.7 0 2.7.9 4.1.9 1.3 0 2.1-.9 4-.9 1.4 0 2.9.8 4 2.1-3.5 1.9-2.9 6.9.4 8.5zM14.5 3.6c.8-1 1.4-2.4 1.3-3.8-1.3.1-2.8.9-3.7 1.9-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.7 3.7-1.8z"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/></svg></span>`;

  const heroMockup = `<div class="hero-mockup"><div class="mockup-frame">
<div class="mockup-bar"><span class="murl">NEXUS — ${label("mkt.hero.badge").includes("Kişisel") ? "Kişisel İşletim Sistemi" : "Personal Operating System"}</span><span class="wctl"><span class="wctl-icon"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="2" y1="6" x2="10" y2="6"/></svg></span><span class="wctl-icon"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="8" height="8" rx="1"/></svg></span><span class="wctl-icon close"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/></svg></span></span></div>
<div class="mockup-body" style="display:flex; gap:0;">
<div class="mockup-sidebar-full">
  <div class="ms-brand">${renderLogo()}<span>NEXUS</span></div>
  <nav class="ms-nav" id="desk-mock-nav">
    <a class="ms-item active" data-panel="desk-today"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg><span>Today</span></a>
    <a class="ms-item" data-panel="desk-home"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></svg><span>Home</span></a>
    <a class="ms-item" data-panel="desk-devices"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/></svg><span>Devices</span></a>
    <a class="ms-item" data-panel="desk-family"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0M15 20a5 5 0 0 1 7 0"/></svg><span>Family</span></a>
    <a class="ms-item" data-panel="desk-skills"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5Z"/></svg><span>Skills</span></a>
    <a class="ms-item" data-panel="desk-suggestions"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V17h6v-1.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3ZM9 20h6"/></svg><span>Suggestions</span></a>
  </nav>
  <div class="ms-foot">v3.14.2 · Family</div>
</div>
<div class="mockup-content" style="flex:1; padding:14px; overflow:hidden;">
  <div class="mockup-panel active" id="desk-today">
${renderTodayPanel(demoScreens.today)}
  </div>
  <div class="mockup-panel" id="desk-home">
${renderHomeState(demoScreens.home)}
  </div>
  <div class="mockup-panel" id="desk-devices">
${renderDevices(demoScreens.devices)}
  </div>
  <div class="mockup-panel" id="desk-family">
${renderFamily(demoScreens.family)}
  </div>
  <div class="mockup-panel" id="desk-skills">
${renderSkills(demoScreens.skills)}
  </div>
  <div class="mockup-panel" id="desk-suggestions">
${renderSuggestions(demoScreens.suggestions)}
  </div>
</div>
</div></div>`;

  const hero = `<section class="hero">
<div class="hero-inner">
<div class="hero-text">
<span class="hero-badge">${locale === "tr" ? "Windows · macOS · Linux · iOS · Android" : "Windows · macOS · Linux · iOS · Android"}${platformIcons}</span>
<h1>${label("mkt.hero.title")}</h1>
<p class="lede">${label("mkt.hero.desc")}</p>
<div class="actions" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
<a class="btn primary" href="/login" style="gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>${locale === "tr" ? "Hemen Dene" : "Try Now"}</a>
<a class="btn" href="#desktop" style="gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>${locale === "tr" ? "İndir" : "Download"}</a>
</div>
<p class="trust">${label("mkt.hero.trust")}</p>
<div class="scroll-hint"><span class="mouse"></span><span>Scroll to explore</span></div>
</div>
${heroMockup}
</div>
</section>`;

  const stats = `<section class="mkt-stats" aria-label="${label("mkt.stats.title")}">
<div class="stat"><span class="stat-num">500K+</span><span class="stat-label">${label("mkt.stats.users")}</span></div>
<div class="stat"><span class="stat-num">2,000+</span><span class="stat-label">${label("mkt.stats.devices")}</span></div>
<div class="stat"><span class="stat-num">100%</span><span class="stat-label">${label("mkt.stats.privacy")}</span></div>
<div class="stat"><span class="stat-num">4.9★</span><span class="stat-label">${label("mkt.stats.rating")}</span></div>
</section>`;

  // Inline OS platform logos (SVG)
  const osLogoWin = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="color:#0078D4"><path d="M3 5.5L10.5 4.5v7H3v-6zM3 12.5h7.5v7L3 18.5v-6zM12.5 4.2L21 3v8.5h-8.5v-7.3zM12.5 12.5H21V21l-8.5-1.2v-7.3z"/></svg>`;
  const osLogoMac = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.7 17.3c-.5 1.1-.7 1.6-1.3 2.6-.9 1.4-2.1 3.2-3.7 3.2-1.4 0-1.7-.9-3.6-.9s-2.3.9-3.6.9c-1.6 0-2.7-1.6-3.6-3-2.5-3.8-2.8-8.3-1.2-10.7 1.1-1.7 2.8-2.7 4.5-2.7 1.7 0 2.7.9 4.1.9 1.3 0 2.1-.9 4-.9 1.4 0 2.9.8 4 2.1-3.5 1.9-2.9 6.9.4 8.5zM14.5 3.6c.8-1 1.4-2.4 1.3-3.8-1.3.1-2.8.9-3.7 1.9-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.7 3.7-1.8z"/></svg>`;
  const osLogoLin = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z"/></svg>`;

  const desktopCard = (platform: string, _titleKey: string, descKey: string, downloadUrl: string, version: string) => {
    const osLogo = platform === "windows" ? osLogoWin : platform === "macos" ? osLogoMac : osLogoLin;
    const platformLabel = platform === "windows" ? "Windows" : platform === "macos" ? "macOS" : "Linux";
    return `<div class="dsk-card">
<div class="dsk-info">
<div class="dsk-plat-header"><span class="dsk-plat-logo">${osLogo}</span><h3>${platformLabel}</h3></div>
<p>${label(descKey)}</p>
<span class="dsk-version" style="font-size:11px; color:var(--muted); margin-top:8px; display:block;">v${escapeHtml(version)}</span>
</div>
<a class="dsk-btn" href="${escapeHtml(downloadUrl)}" download aria-label="${label("mkt.desktop.download")} ${platformLabel}"><span>${label("mkt.desktop.download")}</span></a>
</div>`;
  };

  const winUrl = winRelease?.downloadUrl ?? "/downloads/NEXUS-Setup-3.14.2.exe";
  const macUrl = macRelease?.downloadUrl ?? "/downloads/NEXUS-3.14.1.dmg";
  const linUrl = linRelease?.downloadUrl ?? "/downloads/NEXUS-3.13.8.AppImage";

  const desktopSection = `<section id="desktop" class="mkt-anchor">
<div class="mkt-heading"><span class="eyebrow">${label("mkt.desktop.eyebrow")}</span><h2>${label("mkt.desktop.title")}</h2><p>${label("mkt.desktop.desc")}</p></div>
<div class="desktop-showcase" style="width:100%; max-width:1200px; margin: 40px auto; border-radius:12px; overflow:hidden; box-shadow:0 30px 60px rgba(0,0,0,0.3); border:1px solid color-mix(in srgb,var(--border) 40%,transparent); background:var(--bg);">
  <iframe src="/preview/desktop" style="width:100%; height:800px; border:none; display:block;"></iframe>
</div>
<div class="desktop-grid">
${desktopCard("windows", "mkt.desktop.windows", "mkt.desktop.windowsDesc", winUrl, winRelease?.version ?? "3.14.2")}
${desktopCard("macos", "mkt.desktop.macos", "mkt.desktop.macosDesc", macUrl, macRelease?.version ?? "3.14.1")}
${desktopCard("linux", "mkt.desktop.linux", "mkt.desktop.linuxDesc", linUrl, linRelease?.version ?? "3.13.8")}
</div>
</section>`;

  // Mobile App Showcase Section (R2.1)
  const mobileSection = `<section id="mobile" class="mkt-anchor">
<div class="mkt-heading"><span class="eyebrow">${label("mkt.download.mobile.soon")}</span><h2>${label("mkt.download.mobile.title")}</h2><p>${label("mkt.download.mobile.desc")}</p></div>
<div class="mobile-showcase">
  <iframe src="/preview/mobile" style="width:100%; max-width: 500px; height:900px; border:none; display:block; margin:0 auto; background:transparent;"></iframe>
  <div class="store-badges">
    <a href="#" class="store-badge-btn" onclick="openQrModal('apple'); return false;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.7 17.3c-.5 1.1-.7 1.6-1.3 2.6-.9 1.4-2.1 3.2-3.7 3.2-1.4 0-1.7-.9-3.6-.9s-2.3.9-3.6.9c-1.6 0-2.7-1.6-3.6-3-2.5-3.8-2.8-8.3-1.2-10.7 1.1-1.7 2.8-2.7 4.5-2.7 1.7 0 2.7.9 4.1.9 1.3 0 2.1-.9 4-.9 1.4 0 2.9.8 4 2.1-3.5 1.9-2.9 6.9.4 8.5zM14.5 3.6c.8-1 1.4-2.4 1.3-3.8-1.3.1-2.8.9-3.7 1.9-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.7 3.7-1.8z"/></svg>
      <div class="badge-text"><span class="sub">${label("mkt.download.mobile.apple")}</span><span class="main">${label("mkt.download.mobile.appleStore")}</span></div>
    </a>
    <a href="#" class="store-badge-btn" onclick="openQrModal('google'); return false;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.05v-16.1c0-.44.5-.71.88-.47l12.44 8.05c.34.22.34.72 0 .94L3.88 20.52c-.38.24-.88-.03-.88-.47Z"/></svg>
      <div class="badge-text"><span class="sub">${label("mkt.download.mobile.google")}</span><span class="main">${label("mkt.download.mobile.googlePlay")}</span></div>
    </a>
  </div>
</div>
</section>`;

  // Expanded integration logos with real brand images from SimpleIcons CDN
  const brandLogos = [
    { name: "Apple Home", si: "apple" },
    { name: "Google Home", si: "googlehome" },
    { name: "SmartThings", si: "samsung" },
    { name: "Home Assistant", si: "homeassistant" },
    { name: "Philips Hue", si: "philipshue" },
    { name: "Sonos", si: "sonos" },
    { name: "IKEA", si: "ikea" },
    { name: "Zigbee", si: "zigbee" },
    { name: "Bose", si: "bose" },
    { name: "Xiaomi", si: "xiaomi" },
  ];
  const integrationStrip = `<section id="integrations" class="mkt-integrations mkt-anchor">
<p class="integration-title">${label("mkt.integrations.title")}</p>
<div class="brand-logos">
${brandLogos.map(b => `<span class="brand-logo-pill"><img src="https://cdn.simpleicons.org/${b.si}/ffffff" class="brand-logo-img" alt="${b.name}" width="18" height="18" loading="lazy" onerror="this.style.display='none'"><span>${b.name}</span></span>`).join("")}
</div>
</section>`;

  const ctaBand = `<section class="cta-band">
<div class="cta-logo">${renderLogo()}<span class="brand">NEXUS</span></div>
<h2>${label("mkt.cta.title")}</h2>
<p>${label("mkt.cta.desc")}</p>
<a class="btn primary" href="#desktop">${label("mkt.cta.button")}</a>
</section>`;

  const seoConfig = {
    ...demoSeo(t.color.primary),
    title: label("mkt.seo.title"),
    description: label("mkt.seo.desc"),
    alternates: [
      { lang: "en", url: "/?lang=en" },
      { lang: "tr", url: "/?lang=tr" },
    ],
  };

  const blockingThemeScript = `<script>(function(){var t=localStorage.getItem("nx-theme");if(t)document.documentElement.setAttribute("data-theme",t);})()</script>`;

  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${renderHead(seoConfig)}
<link rel="preload" href="/fonts/space-grotesk-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
<link rel="icon" href="${faviconDataUri(t.color.primary)}" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="${t.color.bg}" />
${blockingThemeScript}
<style>${renderStyles(t)}${marketingCss()}</style>
</head>
<body>
<a class="skip" href="#features">${label("mkt.skipToContent")}</a>
${navbar}
<div class="mkt">
${hero}
${stats}
<section class="product-explainer mkt-anchor" id="what-is-nexus">
<div class="mkt-heading"><span class="eyebrow">${locale === "tr" ? "NEXUS Nedir?" : "What is NEXUS?"}</span><h2>${locale === "tr" ? "Evinizin Kişisel İşletim Sistemi" : "The Personal Operating System for Your Home"}</h2><p>${locale === "tr" ? "NEXUS, tüm akıllı cihazlarınızı tek bir merkezden yöneten, tamamen cihaz üzerinde çalışan ve gizliliğinize saygı duyan sesle kontrol edilebilir bir platformdur." : "NEXUS is a voice-controlled platform that manages all your smart devices from one hub, runs entirely on-device, and respects your privacy."}</p></div>
<div class="explainer-grid">
  <div class="explainer-card"><div class="explainer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><h3>${locale === "tr" ? "%100 Yerel & Gizli" : "100% Local & Private"}</h3><p>${locale === "tr" ? "Verileriniz hiçbir zaman cihazınızdan ayrılmaz. Bulut yok, izleme yok, üçüncü taraflarla paylaşım yok." : "Your data never leaves your device. No cloud, no tracking, no third-party sharing."}</p></div>
  <div class="explainer-card"><div class="explainer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></div><h3>${locale === "tr" ? "Sesle Kontrol" : "Voice-First Control"}</h3><p>${locale === "tr" ? "Doğal dil komutlarıyla cihazlarınızı kontrol edin. Yapay zeka asistanımız sizi anlar." : "Control your devices with natural language commands. Our AI assistant understands you."}</p></div>
  <div class="explainer-card"><div class="explainer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div><h3>${locale === "tr" ? "Tüm Platformlar" : "All Platforms"}</h3><p>${locale === "tr" ? "Windows, macOS, Linux masaüstü uygulamaları ve iOS, Android mobil uygulamalar. Her yerde yanınızda." : "Windows, macOS, Linux desktop apps and iOS, Android mobile apps. With you everywhere."}</p></div>
  <div class="explainer-card"><div class="explainer-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div><h3>${locale === "tr" ? "2000+ Cihaz Desteği" : "2000+ Device Support"}</h3><p>${locale === "tr" ? "Zigbee, Z-Wave, Matter, WiFi — tüm popüler protokollerle çalışır. Markanıza bağımlı kalmayın." : "Works with Zigbee, Z-Wave, Matter, WiFi — all popular protocols. No vendor lock-in."}</p></div>
</div>
</section>
<div id="features" class="mkt-anchor">${renderFeatures()}</div>
<section class="how-section mkt-anchor" id="how">
<div class="mkt-heading"><h2>${label("mkt.how.title")}</h2></div>
<div class="how-steps">
<div class="how-step"><span class="how-num">1</span><h3>${label("mkt.how.step1.title")}</h3><p>${label("mkt.how.step1.desc")}</p></div>
<div class="how-step"><span class="how-num">2</span><h3>${label("mkt.how.step2.title")}</h3><p>${label("mkt.how.step2.desc")}</p></div>
<div class="how-step"><span class="how-num">3</span><h3>${label("mkt.how.step3.title")}</h3><p>${label("mkt.how.step3.desc")}</p></div>
</div>
</section>
${integrationStrip}
${renderTestimonials()}
${renderPricing()}
${desktopSection}
${mobileSection}
${renderFaq()}
${ctaBand}
</div>
${renderRichFooter(t.color.primary)}
<!-- Store QR modal: scanning opens the mobile app surface on the phone. -->
<div id="qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title" style="display:none; position:fixed; inset:0; z-index:1000; align-items:center; justify-content:center; background:rgba(0,0,0,0.6); backdrop-filter:blur(6px);">
  <div style="background:var(--surface, #14161c); color:var(--text, #f2f3f5); border:1px solid color-mix(in srgb,var(--border) 60%,transparent); border-radius:16px; padding:28px; width:min(360px, 90vw); text-align:center; box-shadow:0 30px 80px rgba(0,0,0,0.5); position:relative;">
    <button type="button" id="qr-modal-close" aria-label="${locale === "tr" ? "Kapat" : "Close"}" style="position:absolute; top:12px; right:12px; width:32px; height:32px; border-radius:8px; border:none; background:transparent; color:var(--muted, #a2a6ad); cursor:pointer; font-size:18px; line-height:1;">×</button>
    <h3 id="qr-modal-title" style="font-size:17px; font-weight:700; margin-bottom:6px;"></h3>
    <p style="font-size:13px; color:var(--muted, #a2a6ad); margin-bottom:18px;">${locale === "tr" ? "Telefonunuzla QR kodu okutun; NEXUS mobil deneyimi anında açılır." : "Scan the QR code with your phone to open the NEXUS mobile experience instantly."}</p>
    <div style="background:#fff; border-radius:12px; padding:12px; display:inline-block;">
      <img id="qr-modal-img" alt="QR code" width="200" height="200" style="display:block;" />
    </div>
    <p id="qr-modal-url" style="font-size:12px; color:var(--muted, #a2a6ad); margin-top:14px; word-break:break-all;"></p>
  </div>
</div>
<script>
(function(){
  var modal = document.getElementById('qr-modal');
  if (!modal) return;
  var img = document.getElementById('qr-modal-img');
  var title = document.getElementById('qr-modal-title');
  var urlLine = document.getElementById('qr-modal-url');
  var titles = {
    apple: ${JSON.stringify(locale === "tr" ? "iPhone/iPad için NEXUS" : "NEXUS for iPhone & iPad")},
    google: ${JSON.stringify(locale === "tr" ? "Android için NEXUS" : "NEXUS for Android")}
  };
  window.openQrModal = function(store){
    var target = location.origin + '/mobile';
    title.textContent = titles[store] || 'NEXUS Mobile';
    urlLine.textContent = target;
    // External QR service with a resilient inline-SVG fallback if unreachable.
    img.onerror = function(){
      img.onerror = null;
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#fff"/><text x="100" y="96" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#111">QR unavailable</text><text x="100" y="116" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#555">' + target.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</text></svg>');
    };
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=' + encodeURIComponent(target);
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };
  function closeModal(){ modal.style.display = 'none'; document.body.style.overflow = ''; }
  document.getElementById('qr-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });
})();
</script>
<script>
(function(){
  // ── Theme toggle ──
  var html = document.documentElement;
  var saved = localStorage.getItem('nx-theme');
  if (saved) html.setAttribute('data-theme', saved);
  var btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', function() {
    var cur = html.getAttribute('data-theme') || 'dark';
    var next = cur === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('nx-theme', next);
  });

  // ── Scroll reveal ──
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var sel = '.mkt-stats .stat, .feature-card, .how-step, .dsk-card, .cta-band, .mkt-heading, .brand-logo-pill';
    var revealEls = Array.prototype.slice.call(document.querySelectorAll(sel));
    revealEls.forEach(function(el){ el.classList.add('nx-reveal'); });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add('nx-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function(el){
      var sibs = el.parentElement ? Array.prototype.slice.call(el.parentElement.children).indexOf(el) : 0;
      el.style.setProperty('--nx-d', (Math.max(0, Math.min(sibs, 6)) * 60) + 'ms');
      io.observe(el);
    });
  }

  // ── Mobile nav hamburger ──
  var menuBtn = document.querySelector('.hamburger');
  if (menuBtn) {
    menuBtn.addEventListener('click', function() {
      var navLinks = document.querySelector('.nav-links');
      if (navLinks) navLinks.classList.toggle('open');
    });
  }

  // ── Scroll-aware navbar ──
  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 60) { navbar.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; }
      else { navbar.style.boxShadow = ''; }
    }, { passive: true });
  }

  // ── Close mobile nav on link click ──
  var navLinks2 = document.querySelector('.nav-links');
  if (navLinks2) {
    navLinks2.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { navLinks2.classList.remove('open'); });
    });
  }

  // ── Interactive mockup navigation ──
  function setupMockupNav(navSelector, panelClass) {
    var nav = document.querySelector(navSelector);
    if (!nav) return;
    nav.addEventListener('click', function(e) {
      var item = e.target.closest('[data-panel]');
      if (!item) return;
      var panelId = item.getAttribute('data-panel');
      // Update active tab/item
      nav.querySelectorAll('[data-panel]').forEach(function(el) { el.classList.remove('active'); });
      item.classList.add('active');
      // Show target panel
      var container = document.getElementById(panelId);
      if (!container) return;
      var siblings = container.parentElement.querySelectorAll('.' + panelClass);
      siblings.forEach(function(p) { p.classList.remove('active'); });
      container.classList.remove('active');
      void container.offsetWidth;
      container.classList.add('active');
    });
  }
  setupMockupNav('#desk-mock-nav', 'mockup-panel');
  setupMockupNav('#phone-mock-nav', 'phone-panel');
})();
</script>
${renderCookieBanner()}
<script>
(function(){
  var banner = document.getElementById('cookie-banner');
  if (!banner || localStorage.getItem('nx-cookies')) { if (banner) banner.remove(); return; }
  banner.style.display = 'flex';
  banner.querySelector('.cb-accept').addEventListener('click', function() { localStorage.setItem('nx-cookies','accepted'); banner.remove(); });
  banner.querySelector('.cb-decline').addEventListener('click', function() { localStorage.setItem('nx-cookies','declined'); banner.remove(); });
})();
</script>
</body>
</html>`;
}

/**
 * Renders a minimal legal page (Privacy Policy or Terms of Service).
 * Uses the same design system for visual consistency.
 */
export function renderLegalPage(
  locale: string,
  theme: ThemeName = "dark",
  page: "privacy" | "terms",
): string {
  setLocale(locale);
  const t = getTheme(theme);

  const titles = {
    privacy: { en: "Privacy Policy", tr: "Gizlilik Politikası" },
    terms: { en: "Terms of Service", tr: "Kullanım Koşulları" },
  };

  const contents: Record<string, Record<string, string>> = {
    privacy: {
      en: `<h2>Your Privacy Matters</h2>
<p>Welcome to NEXUS. We are deeply committed to protecting your privacy and security. Our fundamental principle is that your data belongs to you. This Privacy Policy details how we handle the information you provide when using our software, applications, and services.</p>
<h3>Data Collection</h3>
<p>We operate on a local-first architecture. This means we do not collect, store, or transmit any personal data, voice recordings, home layouts, or usage patterns to our servers. All voice commands, routines, connected device configurations, and telemetry data remain strictly within your local network or on your personal devices. The only data we process on our servers relates strictly to account authentication and billing, which is managed via industry-standard secure payment processors.</p>
<h3>Local Processing & AI</h3>
<p>NEXUS utilizes advanced on-device artificial intelligence. All machine learning inferences, including natural language processing (NLP), voice recognition, and predictive routine automation, occur entirely on the hardware you own. At no point are your voice samples sent to the cloud for transcription or analysis. No cloud dependency is required for core functionality, ensuring that your home remains operational and private even without internet connectivity.</p>
<h3>Third-Party Integrations</h3>
<p>When you choose to connect third-party smart home devices (e.g., Philips Hue, Sonos, Zigbee devices), NEXUS acts as a local hub. We do not share your NEXUS data with these manufacturers. However, these third-party devices may still communicate with their respective manufacturers' servers according to their own privacy policies. We encourage you to review the privacy practices of the devices you connect.</p>
<h3>Analytics and Telemetry</h3>
<p>To improve our services, we use privacy-respecting, cookie-free analytics on our website. These tools collect only aggregate page view counts and non-identifiable system metadata (such as generic OS version metrics). No personal identifiers, IP addresses, or device-specific fingerprints are tracked or stored.</p>
<h3>Changes to Privacy Policy</h3>
<p>We may update this Privacy Policy periodically to reflect changes in our practices or relevant laws. We will notify you of any significant updates via the NEXUS application interface.</p>
<h3>Contact Us</h3>
<p>If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact our privacy team at <a href="mailto:privacy@nexus-ai.example.com">privacy@nexus-ai.example.com</a>.</p>`,
      tr: `<h2>Gizliliğiniz Önemli</h2>
<p>NEXUS'a hoş geldiniz. Gizliliğinizi ve güvenliğinizi korumaya derinden bağlıyız. Temel prensibimiz, verilerinizin size ait olmasıdır. Bu Gizlilik Politikası, yazılımımızı, uygulamalarımızı ve hizmetlerimizi kullanırken sağladığınız bilgileri nasıl işlediğimizi detaylandırmaktadır.</p>
<h3>Veri Toplama</h3>
<p>Öncelikle yerel (local-first) bir mimariyle çalışıyoruz. Bu, kişisel verileri, ses kayıtlarını, ev yerleşimlerini veya kullanım alışkanlıklarını sunucularımızda toplamadığımız, saklamadığımız veya iletmediğimiz anlamına gelir. Tüm sesli komutlar, rutinler, bağlı cihaz yapılandırmaları ve telemetri verileri kesinlikle yerel ağınızda veya kişisel cihazlarınızda kalır. Sunucularımızda işlediğimiz tek veri, endüstri standardı güvenli ödeme işlemcileri aracılığıyla yönetilen hesap kimlik doğrulaması ve faturalandırma ile ilgilidir.</p>
<h3>Yerel İşleme ve Yapay Zeka</h3>
<p>NEXUS gelişmiş cihaz içi (on-device) yapay zeka kullanır. Doğal dil işleme (NLP), ses tanıma ve tahmine dayalı rutin otomasyonu da dahil olmak üzere tüm makine öğrenimi çıkarımları tamamen sahip olduğunuz donanım üzerinde gerçekleşir. Ses örnekleriniz hiçbir zaman yazıya dökülmek veya analiz edilmek üzere buluta gönderilmez. Temel işlevsellik için hiçbir bulut bağımlılığı gerekmez, bu da evinizin internet bağlantısı olmasa bile çalışır durumda ve gizli kalmasını sağlar.</p>
<h3>Üçüncü Taraf Entegrasyonları</h3>
<p>Üçüncü taraf cihazları (ör. akıllı ampuller, termostatlar) bağlarken NEXUS bir köprü görevi görür. Özel hub verilerinizi bu üçüncü taraf üreticilerle paylaşmasak da, lütfen bu cihazların kendi gizlilik politikalarına göre kendi sunucularıyla iletişim kurabileceğini unutmayın. Kullanıcılarımızı, bağlı tüm donanımların gizlilik ayarlarını doğrulamaya teşvik ediyoruz.</p>
<h3>Güvenlik Önlemleri</h3>
<p>Hub ve kontrol uygulamalarınız arasındaki tüm yerel iletişimler için güçlü şifreleme yöntemleri kullanıyoruz. Verileriniz evinizde kaldığı için, bulut sağlayıcılarını etkileyen büyük ölçekli veri ihlallerine karşı savunmasız değildir.</p>
<h3>Bize Ulaşın</h3>
<p>Gizlilik uygulamalarımızla ilgili herhangi bir sorunuz varsa veya daha fazla bilgiye ihtiyaç duyarsanız, lütfen <a href="mailto:privacy@nexus-ai.example.com">privacy@nexus-ai.example.com</a> adresinden gizlilik sorumlumuza ulaşın.</p>`,
    },
    terms: {
      en: `<h2>Terms of Service</h2>
<p>Last Updated: October 2026</p>
<p>By downloading, installing, accessing, or using the NEXUS application and related services (collectively, the "Services"), you explicitly agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.</p>
<h3>License and Usage</h3>
<p>NEXUS grants you a personal, non-exclusive, non-transferable, and revocable license to install and use the software on devices you own or control, strictly for personal and non-commercial home automation purposes. You may not distribute, lease, rent, or sub-license the software to any third party.</p>
<h3>Acceptable Use and Restrictions</h3>
<p>You agree to use NEXUS only for lawful purposes. You shall not reverse-engineer, decompile, disassemble, or attempt to derive the source code from the application, except to the extent that such activity is expressly permitted by applicable law. Furthermore, you shall not use the Services to create any product or service that competes directly with NEXUS, nor shall you exploit any bugs or vulnerabilities in the software.</p>
<h3>User Responsibilities</h3>
<p>You are solely responsible for maintaining the security of your home network, devices, and NEXUS account credentials. NEXUS operates locally and relies on the security of your own network infrastructure. We strongly advise using strong passwords and ensuring your router's firmware is up to date.</p>
<h3>Disclaimer of Warranties</h3>
<p>NEXUS is provided on an "as is" and "as available" basis without any warranties of any kind, either express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the software will be error-free, uninterrupted, or secure at all times.</p>
<h3>Limitation of Liability</h3>
<p>To the maximum extent permitted by law, in no event shall NEXUS, its developers, or affiliates be liable for any direct, indirect, incidental, special, consequential, or punitive damages (including loss of data, property damage, or security breaches) arising out of or related to your use or inability to use the Services, even if advised of the possibility of such damages.</p>
<h3>Governing Law and Updates</h3>
<p>These terms shall be governed by the laws of the jurisdiction in which our primary operations are based. We reserve the right to modify or replace these Terms at any time. Significant changes will be communicated through our application or website. Your continued use of NEXUS following the posting of any changes constitutes acceptance of those changes.</p>`,
      tr: `<h2>Kullanım Koşulları</h2>
<p>Son Güncelleme: Ekim 2026</p>
<p>NEXUS uygulamasını ve ilgili hizmetleri (topluca "Hizmetler") indirerek, kurarak, bunlara erişerek veya kullanarak, bu Kullanım Koşullarına tabi olmayı açıkça kabul edersiniz. Bu koşulları kabul etmiyorsanız, lütfen Hizmetlerimizi kullanmayın.</p>
<h3>Lisans ve Kullanım</h3>
<p>NEXUS, yazılımı sahip olduğunuz veya kontrol ettiğiniz cihazlara kurmanız ve kesinlikle kişisel ve ticari olmayan ev otomasyonu amacıyla kullanmanız için size kişisel, münhasır olmayan, devredilemez ve iptal edilebilir bir lisans verir. Yazılımı herhangi bir üçüncü tarafa dağıtamaz, kiralayamaz veya alt lisansını veremezsiniz.</p>
<h3>Kabul Edilebilir Kullanım ve Kısıtlamalar</h3>
<p>NEXUS'u yalnızca yasal amaçlar için kullanmayı kabul edersiniz. Yürürlükteki yasaların açıkça izin verdiği ölçü dışında, yazılımda tersine mühendislik yapamaz, kaynak koda dönüştüremez, parçalara ayıramaz veya uygulamadan kaynak kodunu elde etmeye çalışamazsınız. Ayrıca, Hizmetleri doğrudan NEXUS ile rekabet eden herhangi bir ürün veya hizmet oluşturmak için kullanamaz ve yazılımdaki herhangi bir hatayı veya güvenlik açığını istismar edemezsiniz.</p>
<h3>Kullanıcı Sorumlulukları</h3>
<p>Ev ağınızın, cihazlarınızın ve NEXUS hesap kimlik bilgilerinizin güvenliğini sağlamaktan yalnızca siz sorumlusunuz. NEXUS yerel olarak çalışır ve kendi ağ altyapınızın güvenliğine dayanır. Güçlü parolalar kullanmanızı ve yönlendiricinizin (router) donanım yazılımının güncel olduğundan emin olmanızı şiddetle tavsiye ederiz.</p>
<h3>Garanti Reddi</h3>
<p>NEXUS, ticari elverişlilik, belirli bir amaca uygunluk veya ihlal etmeme gibi zımni garantiler dahil ancak bunlarla sınırlı olmamak üzere, açık veya zımni hiçbir tür garanti olmaksızın "olduğu gibi" ve "mevcut olduğu gibi" esasına göre sağlanır. Yazılımın her zaman hatasız, kesintisiz veya güvenli olacağını garanti etmiyoruz.</p>
<h3>Sorumluluğun Sınırlandırılması</h3>
<p>Yasaların izin verdiği azami ölçüde, NEXUS, geliştiricileri veya bağlı kuruluşları, bu tür hasarların olasılığı konusunda bilgilendirilmiş olsalar dahi, Hizmetleri kullanmanızdan veya kullanamamanızdan kaynaklanan veya bununla bağlantılı olan herhangi bir doğrudan, dolaylı, arızi, özel, sonuç olarak ortaya çıkan veya cezai hasarlardan (veri kaybı, mülk hasarı veya güvenlik ihlalleri dahil) hiçbir durumda sorumlu tutulamaz.</p>
<h3>Geçerli Kanun ve Güncellemeler</h3>
<p>Bu koşullar, ana faaliyetlerimizin bulunduğu yargı bölgesinin yasalarına tabi olacaktır. Bu Koşulları herhangi bir zamanda değiştirme veya yenileme hakkımızı saklı tutuyoruz. Önemli değişiklikler uygulamamız veya web sitemiz aracılığıyla iletilecektir. Herhangi bir değişikliğin yayınlanmasının ardından NEXUS'u kullanmaya devam etmeniz, söz konusu değişiklikleri kabul ettiğiniz anlamına gelir.</p>`,
    },
  };

  const lang = locale === "tr" ? "tr" : "en";
  const title = titles[page][lang];
  const content = contents[page][lang];

  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} \u2014 NEXUS</title>
<link rel="icon" href="${faviconDataUri(t.color.primary)}" />
<meta name="theme-color" content="${t.color.bg}" />
<style>${renderStyles(t)}${legalPageCss()}</style>
</head>
<body>
<div class="navbar" id="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<div class="nav-actions"><a class="btn primary nav-cta" href="/">${lang === "tr" ? "Ana Sayfa" : "Home"}</a></div>
</div></div>
<main class="legal-content">
<h1>${escapeHtml(title)}</h1>
<p class="legal-updated">${lang === "tr" ? "Son g\u00fcncelleme: Temmuz 2026" : "Last updated: July 2026"}</p>
${content}
</main>
${renderRichFooter(t.color.primary)}
</body>
</html>`;
}

/**
 * Renders a 404 Not Found page.
 */
export function renderNotFoundPage(
  locale: string,
  theme: ThemeName = "dark",
): string {
  setLocale(locale);
  const t = getTheme(theme);

  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>404 \u2014 NEXUS</title>
<link rel="icon" href="${faviconDataUri(t.color.primary)}" />
<meta name="theme-color" content="${t.color.bg}" />
<style>${renderStyles(t)}${legalPageCss()}</style>
</head>
<body>
<div class="navbar" id="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<div class="nav-actions"><a class="btn primary nav-cta" href="/">${locale === "tr" ? "Ana Sayfa" : "Home"}</a></div>
</div></div>
<main class="legal-content" style="text-align:center;padding-top:120px;">
<h1 style="font-size:72px;margin:0;">404</h1>
<p style="font-size:18px;color:var(--muted);margin:16px 0 32px;">${locale === "tr" ? "Sayfa bulunamad\u0131" : "Page not found"}</p>
<a class="btn primary" href="/">${locale === "tr" ? "Ana Sayfaya D\u00f6n" : "Back to Home"}</a>
</main>
${renderRichFooter(t.color.primary)}
</body>
</html>`;
}

/** Minimal CSS for legal/404 pages. */
function legalPageCss(): string {
  return `
.legal-content { max-width: 720px; margin: 0 auto; padding: 100px 24px 60px; }
.legal-content h1 { font-size: 36px; letter-spacing: -0.02em; margin: 0 0 8px; color: var(--text); }
.legal-content h2 { font-size: 24px; margin: 40px 0 12px; color: var(--text); }
.legal-content h3 { font-size: 17px; margin: 24px 0 8px; color: var(--text); }
.legal-content p { font-size: 15px; color: var(--muted); line-height: 1.7; margin: 0 0 16px; }
.legal-content a { color: var(--primary); text-decoration: underline; }
.legal-updated { font-size: 12px; color: var(--muted); margin-bottom: 32px; opacity: 0.7; }
`.trim();
}

/**
 * Renders an About page introducing the NEXUS platform.
 */
export function renderAboutPage(
  locale: string,
  theme: ThemeName = "dark",
): string {
  setLocale(locale);
  const t = getTheme(theme);
  const isTr = locale === "tr";

  const title = isTr ? "NEXUS Hakkında" : "About NEXUS";

  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} \u2014 NEXUS</title>
<link rel="icon" href="${faviconDataUri(t.color.primary)}" />
<meta name="theme-color" content="${t.color.bg}" />
<style>${renderStyles(t)}${legalPageCss()}</style>
</head>
<body>
<div class="navbar" id="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<div class="nav-actions"><a class="btn primary nav-cta" href="/">${isTr ? "Ana Sayfa" : "Home"}</a></div>
</div></div>
<main class="legal-content">
<h1>${escapeHtml(title)}</h1>
<p class="legal-updated">${isTr ? "Kişisel Akıllı Ev İşletim Sistemi" : "The Personal Operating System for Your Smart Home"}</p>

<h2>${isTr ? "Hikayemiz" : "Our Story"}</h2>
<p>${isTr ? "NEXUS, akıllı ev teknolojilerinin karmaşıklığına, bulut bağımlılığına ve gizlilik endişelerine bir tepki olarak doğdu. Bulut sunucuları çöktüğünde ışıklarınızı bile kapatamadığınız günleri geride bırakmak istedik. Sadece sizin kontrolünüzde olan, yerel donanımınızın gücünü kullanan ve verilerinizi dış dünyayla paylaşmayan bir sistem hayal ettik ve NEXUS'u inşa ettik." : "NEXUS was born out of frustration with the complexity, cloud dependency, and privacy concerns of modern smart home technology. We wanted to leave behind the days when you couldn't even turn off your lights because a cloud server went down. We envisioned and built NEXUS—a system entirely under your control, harnessing the power of your local hardware without sharing your data with the outside world."}</p>

<h2>${isTr ? "Misyonumuz" : "Our Mission"}</h2>
<p>${isTr ? "NEXUS, akıllı ev otomasyonunu tamamen yerel, güvenli ve gizlilik odaklı bir deneyime dönüştürmek için tasarlanmıştır. Amacımız, teknolojiyi görünmez ama her zaman yanınızda olan güvenilir bir yardımcıya dönüştürmektir. Verilerinizin, ailenizin ve evinizin kontrolü %100 sizdedir." : "NEXUS is designed to transform smart home automation into a completely local, secure, and privacy-first experience. Our goal is to make technology an invisible yet reliable assistant that is always there for you. You retain 100% control over your data, your family, and your home."}</p>

<h2>${isTr ? "Neden Biz?" : "Why Us?"}</h2>
<p>${isTr ? "Çünkü biz de sizin gibi kullanıcıyız. Pazardaki çoğu çözüm, sizi kendi ekosistemlerine kilitlemek ve verileriniz üzerinden gelir elde etmek üzerine kuruluyken, biz size tam bir özgürlük sunuyoruz. Açık standartları (Matter, Zigbee, Z-Wave vb.) destekliyor, cihazlarınızı bir platforma bağlamak zorunda kalmadan kendi ağınızda yerel olarak yönetmenizi sağlıyoruz." : "Because we are users just like you. While most market solutions are built to lock you into their ecosystems and monetize your data, we offer you complete freedom. We support open standards (Matter, Zigbee, Z-Wave, etc.) and allow you to manage your devices locally on your own network without being forced to tether them to an external platform."}</p>

<h2>${isTr ? "Gelecek Vizyonumuz" : "Our Future Vision"}</h2>
<p>${isTr ? "Yapay zeka modellerinin doğrudan kendi sunucunuzda (Edge AI) çalıştırılarak evinizi tam anlamıyla tanıdığı, alışkanlıklarınıza göre proaktif olarak hareket eden ancak hiçbir veriyi dışarı sızdırmayan otonom evler inşa etmek istiyoruz. Her geçen gün platformumuza yeni entegrasyonlar, açık kaynaklı eklentiler ve gelişmiş otomasyon rutinleri eklemeye devam ediyoruz." : "We want to build autonomous homes where AI models run directly on your own server (Edge AI), truly understanding your home and proactively acting on your habits without leaking any data. Every day, we continue to add new integrations, open-source plugins, and advanced automation routines to our platform."}</p>

<h2>${isTr ? "Ekibimiz" : "Our Team"}</h2>
<p>${isTr ? "NEXUS, dünyanın dört bir yanından gelen teknoloji meraklıları, mühendisler ve tasarımcıların ortak bir tutkuyla bir araya geldiği bir ekiptir. Uzaktan çalışan dağıtık bir yapıya sahibiz ve gücümüzü topluluğumuzdan alıyoruz. Siz de bu devrimin bir parçası olmak istiyorsanız, bize katılın!" : "NEXUS is a team of technology enthusiasts, engineers, and designers from around the world brought together by a shared passion. We have a distributed, remote structure and draw our strength from our community. If you want to be part of this revolution, join us!"}</p>
</main>
${renderRichFooter(t.color.primary)}
</body>
</html>`;
}

/**
 * Renders a mock App Store / Google Play store listing page for NEXUS AI.
 */
export function renderStoreDocument(options: { theme?: ThemeName; locale?: string } = {}): string {
  const theme: ThemeName = options.theme ?? "dark";
  const locale = options.locale ?? "en";
  setLocale(locale);
  const t = getTheme(theme);
  const isTr = locale === "tr";

  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>NEXUS AI — App Store & Play Store</title>
<link rel="icon" href="${faviconDataUri(t.color.primary)}" />
<meta name="theme-color" content="${t.color.bg}" />
<style>${renderStyles(t)}
.store-container { max-width: 860px; margin: 0 auto; padding: 40px 24px 80px; }
.store-header { display: flex; gap: 24px; align-items: flex-start; margin-bottom: 32px; }
.store-icon { width: 100px; height: 100px; border-radius: 22px; background: var(--surface); border: 1px solid var(--border-strong); display: flex; align-items: center; justify-content: center; box-shadow: var(--elev); flex: none; }
.store-meta { flex: 1; }
.store-title { font-size: 28px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.02em; }
.store-subtitle { font-size: 15px; color: var(--muted); margin: 0 0 16px; }
.store-stats { display: flex; gap: 24px; padding: 14px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 20px; }
.stat-item { display: flex; flex-direction: column; }
.stat-item .val { font-weight: 800; font-size: 16px; color: var(--text); }
.stat-item .lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; margin-top: 2px; }
.store-cta { display: flex; gap: 12px; }
.store-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: var(--tint); color: var(--primary); text-transform: uppercase; display: inline-block; margin-bottom: 8px; }
.store-screenshots { display: flex; gap: 14px; overflow-x: auto; padding: 12px 0 24px; margin-bottom: 32px; }
.screen-mock { width: 200px; height: 380px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; flex: none; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; }
</style>
</head>
<body>
<div class="navbar" id="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<div class="nav-actions"><a class="btn primary nav-cta" href="/">${isTr ? "Ana Sayfa" : "Home"}</a></div>
</div></div>
<main class="store-container">
<span class="store-badge">${isTr ? "Öne Çıkan Uygulama" : "Featured App"}</span>
<div class="store-header">
  <div class="store-icon">${renderLogo(t.color.primary)}</div>
  <div class="store-meta">
    <h1 class="store-title">NEXUS AI</h1>
    <div class="store-subtitle">${isTr ? "Kişisel İşletim Sistemi & Akıllı Ev Asistanı" : "Personal Operating System & Smart Home AI"}</div>
    <div class="store-stats">
      <div class="stat-item"><span class="val">4.9 ★</span><span class="lbl">12.4K ${isTr ? "Değerlendirme" : "Ratings"}</span></div>
      <div class="stat-item"><span class="val">#1</span><span class="lbl">${isTr ? "Ev Otomasyonu" : "Smart Home"}</span></div>
      <div class="stat-item"><span class="val">4+</span><span class="lbl">${isTr ? "Yaş Sınırı" : "Age Rating"}</span></div>
      <div class="stat-item"><span class="val">100%</span><span class="lbl">${isTr ? "Gizlilik Odaklı" : "Private"}</span></div>
    </div>
    <div class="store-cta">
      <a href="/downloads" class="btn primary">${isTr ? "İndir / Yükle" : "Get / Install"}</a>
      <a href="/preview/mobile" class="btn">${isTr ? "Mobil Önizleme" : "Mobile Preview"}</a>
    </div>
  </div>
</div>
<h2>${isTr ? "Ekran Görüntüleri" : "Screenshots"}</h2>
<div class="store-screenshots">
  <div class="screen-mock"><div style="font-weight:700;font-size:14px;">Today Dashboard</div><div style="font-size:12px;color:var(--muted);">19.4 kWh · 99.98% Uptime</div><div style="font-size:10px;color:var(--primary);font-weight:700;">NEXUS AI ACTIVE</div></div>
  <div class="screen-mock"><div style="font-weight:700;font-size:14px;">Smart Devices</div><div style="font-size:12px;color:var(--muted);">Philips Hue · LG C3 OLED</div><div style="font-size:10px;color:#10b981;font-weight:700;">6 ONLINE</div></div>
  <div class="screen-mock"><div style="font-weight:700;font-size:14px;">Family & Sync</div><div style="font-size:12px;color:var(--muted);">Multi-user control</div><div style="font-size:10px;color:var(--primary);font-weight:700;">3 OS SYNC</div></div>
</div>
<h2>${isTr ? "Açıklama" : "Description"}</h2>
<p style="color:var(--muted);line-height:1.7;font-size:15px;">
${isTr ? "NEXUS AI, akıllı evinizi ve kişisel otomasyonlarınızı internet bağımlılığı olmadan yerel olarak yöneten ses odaklı kişisel işletim sistemidir. Gizliliğinizi %100 korurken, cihazlarınızı ve senaryolarınızı anında senkronize eder." : "NEXUS AI is a voice-first, privacy-focused personal operating system that controls your smart home, learns your routines, and works across iOS, Android, Windows, macOS, and Linux with zero external cloud dependencies."}
</p>
</main>
${renderRichFooter(t.color.primary)}
</body>
</html>`;
}
