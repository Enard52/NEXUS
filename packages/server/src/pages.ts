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
  buildDemoScreens,
  demoReleases,
  escapeHtml,
  faviconDataUri,
  label,
  renderAvatar,
  renderDownloadCenter,
  renderFaq,
  renderFeatures,
  renderLogo,
  renderNav,
  renderRichFooter,
  renderScreenBody,
  renderStyles,
  setLocale,
  type DemoScreens,
  renderHead,
  demoSeo,
  renderPricing,
  renderTestimonials,
  renderIntegrationMarquee,
  renderCookieBanner,
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
      skillDiscovery.getDiscoverableSkills()
    ),
    family: buildFamilyModel(data.family.map((m) => ({ id: m.id, nameKey: m.name, role: m.role }))),
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
<div class="auth-brand">${renderLogo()}<span class="brand">NEXUS</span></div>
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
<div class="brand-group">${renderLogo()}<span class="brand">NEXUS</span></div>
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

/** Marketing-only styles: the download hero, stats strip, product-preview frame and store buttons. */
function marketingCss(): string {
  return `
html { scroll-behavior: smooth; }
.mkt { max-width: 1140px; margin: 0 auto; padding: 0 24px 24px; position: relative; z-index: 1; }
.mkt-anchor, #preview, #download { scroll-margin-top: 84px; }
body { background: radial-gradient(circle at top, color-mix(in srgb, var(--primary) 15%, transparent) 0%, var(--bg) 60%); }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 12px;
  font-weight: 700; color: var(--primary); background: color-mix(in srgb, var(--primary) 12%, transparent);
  padding: 8px 16px; border-radius: 999px; margin-bottom: 24px; letter-spacing: 0.04em;
  box-shadow: 0 0 20px color-mix(in srgb, var(--primary) 30%, transparent); border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent); }
.hero h1 { color: var(--text); text-shadow: 0 4px 24px color-mix(in srgb, var(--primary) 22%, transparent); }
.hero .btn.primary { color: var(--on-primary); box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent); transition: transform 0.2s, box-shadow 0.2s; }
.hero .btn.primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px color-mix(in srgb, var(--primary) 60%, transparent); }
/* Stats strip */
.mkt-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  margin: 16px 0; padding: 32px; border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: var(--radius-lg); background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.05); }
.mkt-stats .stat { text-align: center; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.mkt-stats .stat:hover { transform: translateY(-4px) scale(1.02); }
.mkt-stats .stat-num { display: block; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; color: var(--primary); text-shadow: 0 2px 10px color-mix(in srgb, var(--primary) 20%, transparent); }
.mkt-stats .stat-label { display: block; color: var(--muted); font-size: 13px; margin-top: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
/* Section headings shared by preview + download */
.mkt-heading { text-align: center; margin: 80px 0 16px; }
.mkt-heading h2 { font-size: 36px; letter-spacing: -0.02em; margin: 0; color: var(--text); }
.mkt-heading p { color: var(--muted); font-size: 16px; margin: 12px auto 0; max-width: 52ch; line-height: 1.6; }
/* Steps grid for How it works */
.steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 40px; }
.step-card { text-align: center; padding: 40px 24px; background: color-mix(in srgb, var(--surface) 70%, transparent); backdrop-filter: blur(12px); border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); border-radius: var(--radius-lg); box-shadow: 0 12px 30px rgba(0,0,0,0.03); transition: all 0.3s ease; }
.step-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px color-mix(in srgb, var(--primary) 15%, transparent); border-color: color-mix(in srgb, var(--primary) 30%, transparent); }
.step-num { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 60%, black)); color: var(--on-primary); font-size: 22px; font-weight: 800; margin-bottom: 20px; box-shadow: 0 8px 20px color-mix(in srgb, var(--primary) 40%, transparent); }
/* Product preview browser frame */
.mkt-tabs-wrap { margin-top: 40px; display: flex; justify-content: center; }
.browser-frame { margin-top: 24px; border: 1px solid color-mix(in srgb, var(--border-strong) 40%, transparent);
  border-radius: var(--radius-lg); overflow: hidden; background: color-mix(in srgb, var(--surface) 85%, transparent); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 32px 80px color-mix(in srgb, var(--primary) 15%, transparent), 0 0 0 1px rgba(255,255,255,0.05) inset; transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
.browser-frame:hover { transform: translateY(-4px) scale(1.005); box-shadow: 0 40px 100px color-mix(in srgb, var(--primary) 20%, transparent), 0 0 0 1px rgba(255,255,255,0.1) inset; }
.browser-bar { display: flex; align-items: center; gap: 8px; padding: 14px 20px;
  background: color-mix(in srgb, var(--bg) 40%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent); }
.browser-bar .bdot { width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 1px 2px rgba(255,255,255,0.2); }
.browser-bar .bdot.r { background: #ff5f57; } .browser-bar .bdot.y { background: #febc2e; } .browser-bar .bdot.g { background: #28c840; }
.browser-url { flex: 1; text-align: center; font-size: 13px; color: var(--muted); font-weight: 500;
  background: color-mix(in srgb, var(--bg) 60%, transparent); border-radius: 999px; padding: 6px 16px; margin: 0 16px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); }
.browser-body { padding: 32px; max-height: 640px; overflow: hidden; overflow-y: auto;
  -webkit-mask-image: linear-gradient(180deg, #000 85%, transparent);
  mask-image: linear-gradient(180deg, #000 85%, transparent); }
.browser-body section { margin-bottom: 32px; animation: fadeUp 0.4s ease forwards; }
.browser-body section[hidden] { display: none; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
/* Download center wrapper + mobile store buttons */
.mkt-download h2 { text-align: center; font-size: 36px; letter-spacing: -0.02em; margin: 80px 0 24px; color: var(--text); }
.mkt-download { text-align: center; }
.mkt-download table { text-align: left; margin-top: 32px; background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(12px); border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.02); }
.mkt-download th, .mkt-download td { border-color: color-mix(in srgb, var(--border) 40%, transparent); }
.store-block { margin-top: 48px; }
.store-block h3 { font-size: 20px; margin: 0 0 6px; font-weight: 700; }
.store-block .sub { color: var(--muted); font-size: 14px; margin: 0 0 24px; }
.store-row { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.store-btn { display: inline-flex; align-items: center; gap: 12px; text-align: left;
  padding: 14px 24px; border-radius: var(--radius-lg); border: 1px solid color-mix(in srgb, var(--border-strong) 50%, transparent);
  background: color-mix(in srgb, var(--surface) 70%, transparent); backdrop-filter: blur(10px); color: var(--text); min-width: 200px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: all 0.2s; }
.store-btn:not(.soon):hover { transform: translateY(-2px); box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 20%, transparent); border-color: color-mix(in srgb, var(--primary) 40%, transparent); }
.store-btn.soon { opacity: 0.6; cursor: not-allowed; filter: grayscale(100%); }
.store-btn .store-ic { display: inline-flex; }
.store-btn .store-top { display: block; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
.store-btn .store-name { display: block; font-size: 16px; font-weight: 800; margin-top: 2px; }
.store-btn .store-tag { margin-left: auto; font-size: 11px; font-weight: 800; color: var(--primary);
  background: color-mix(in srgb, var(--primary) 15%, transparent); padding: 4px 10px; border-radius: 999px; }
@media (max-width: 720px) { .mkt-stats { grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 20px; } .steps-grid { grid-template-columns: 1fr; } }
/* Pricing */
.mkt-pricing { margin-top: 80px; }
.pricing-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; max-width: 800px; margin: 40px auto 0; }
.pricing-card { background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(12px); border: 1px solid color-mix(in srgb, var(--border) 40%, transparent); border-radius: var(--radius-lg); padding: 40px; text-align: center; box-shadow: 0 12px 30px rgba(0,0,0,0.02); transition: transform 0.3s; }
.pricing-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px color-mix(in srgb, var(--primary) 10%, transparent); border-color: color-mix(in srgb, var(--primary) 20%, transparent); }
.pricing-card h3 { font-size: 24px; margin: 0 0 12px; }
.pricing-card p { color: var(--muted); font-size: 15px; margin: 0 0 24px; }
.pricing-card .price { font-size: 48px; font-weight: 800; color: var(--primary); margin-bottom: 32px; }
.pricing-card .price span { font-size: 16px; color: var(--muted); font-weight: 500; }
.pricing-card .btn { display: inline-block; width: 100%; padding: 14px; text-decoration: none; text-align: center; border-radius: var(--radius-lg); background: color-mix(in srgb, var(--surface) 90%, transparent); color: var(--text); font-weight: 600; border: 1px solid color-mix(in srgb, var(--border-strong) 50%, transparent); transition: all 0.2s; }
.pricing-card .btn:hover { background: color-mix(in srgb, var(--primary) 10%, transparent); border-color: var(--primary); color: var(--primary); }
/* Testimonials */
.mkt-testimonials { margin-top: 80px; }
.testimonial-card { max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, color-mix(in srgb, var(--tint-soft) 80%, transparent), color-mix(in srgb, var(--surface) 40%, transparent)); padding: 40px; border-radius: var(--radius-lg); border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); text-align: center; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.04); }
.testimonial-card::before { content: "“"; position: absolute; top: -10px; left: 20px; font-size: 80px; color: color-mix(in srgb, var(--primary) 20%, transparent); font-family: serif; line-height: 1; }
.testimonial-card p { font-size: 20px; line-height: 1.6; font-weight: 500; margin: 0 0 24px; color: var(--text); position: relative; z-index: 1; }
.testimonial-card .author { font-size: 15px; color: var(--primary); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
/* Integrations */
.mkt-integrations { margin-top: 80px; padding: 40px 0; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--surface) 60%, transparent), transparent); overflow: hidden; border-top: 1px solid color-mix(in srgb, var(--border) 30%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 30%, transparent); text-align: center; }
.integration-title { font-size: 14px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 24px; }
.marquee { font-size: 24px; font-weight: 800; color: color-mix(in srgb, var(--text) 40%, transparent); white-space: nowrap; word-spacing: 16px; }
.marquee span { color: color-mix(in srgb, var(--text) 70%, transparent); transition: color 0.3s; cursor: default; }
.marquee span:hover { color: var(--primary); }
/* Cookie Banner */
.cookie-banner { position: fixed; bottom: 24px; left: 24px; right: 24px; max-width: 600px; margin: 0 auto; z-index: 1000;
  display: flex; flex-direction: column; gap: 16px; padding: 24px;
  background: color-mix(in srgb, var(--surface) 85%, transparent); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border: 1px solid color-mix(in srgb, var(--border-strong) 50%, transparent); border-radius: var(--radius-lg);
  box-shadow: 0 16px 40px color-mix(in srgb, var(--bg) 80%, transparent), 0 0 0 1px rgba(255,255,255,0.05) inset;
  animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; transform: translateY(100%); opacity: 0; }
@keyframes slideUp { to { transform: translateY(0); opacity: 1; } }
.cb-content strong { display: block; font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--text); }
.cb-content p { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.5; }
.cb-actions { display: flex; gap: 12px; justify-content: flex-end; }
.cb-actions .btn { padding: 10px 20px; font-size: 14px; border-radius: var(--radius-lg); font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
.cb-actions .cb-decline { background: transparent; color: var(--muted); border-color: color-mix(in srgb, var(--border) 50%, transparent); }
.cb-actions .cb-decline:hover { color: var(--text); background: color-mix(in srgb, var(--surface) 50%, transparent); }
.cb-actions .cb-accept { background: var(--primary); color: var(--on-primary); box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 40%, transparent); }
.cb-actions .cb-accept:hover { transform: translateY(-1px); box-shadow: 0 6px 16px color-mix(in srgb, var(--primary) 50%, transparent); }
@media (min-width: 600px) { .cookie-banner { flex-direction: row; align-items: center; justify-content: space-between; } .cb-actions { flex-shrink: 0; } }
@media (max-width: 720px) { .pricing-grid { grid-template-columns: 1fr; } }
/* Testimonial hover polish */
.testimonial-card { transition: transform 0.3s cubic-bezier(.2,.8,.2,1), box-shadow 0.3s ease, border-color 0.3s ease; }
.testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 28px 60px color-mix(in srgb, var(--primary) 12%, transparent); border-color: color-mix(in srgb, var(--primary) 25%, transparent); }
/* Step-card number pop on hover */
.step-card .step-num { transition: transform 0.3s cubic-bezier(.2,.8,.2,1); }
.step-card:hover .step-num { transform: scale(1.08) rotate(-4deg); }
/* Scroll-reveal — .nx-reveal is added by JS only, so no-JS visitors see everything */
@media (prefers-reduced-motion: no-preference) {
  .nx-reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s cubic-bezier(.2,.8,.2,1), transform .7s cubic-bezier(.2,.8,.2,1); transition-delay: var(--nx-d, 0ms); }
  .nx-reveal.nx-in { opacity: 1; transform: none; }
}
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
  userAgent: string,
  theme: ThemeName = "dark",
): string {
  setLocale(locale);
  const t = getTheme(theme);
  const releases = demoReleases();
  const screens = buildDemoScreens();
  const featured = releases.featuredFor(userAgent);
  const osName = featured
    ? featured.platform === "windows"
      ? "Windows"
      : featured.platform === "macos"
        ? "macOS"
        : featured.platform === "linux"
          ? "Linux"
          : featured.platform.toUpperCase()
    : "";

  const langSwitch =
    `<span class="nav-controls-pill"><span class="lang-switch-clean">` +
    `<a class="lang-opt ${locale === "en" ? "active" : ""}" href="?lang=en">EN</a>` +
    `<span class="lang-sep">/</span>` +
    `<a class="lang-opt ${locale === "tr" ? "active" : ""}" href="?lang=tr">TR</a>` +
    `</span></span>`;

  const hamburger = `<button class="hamburger" aria-label="Menu" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>`;

  const navbar = `<div class="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<nav class="nav-links" aria-label="Primary">
<a class="nav-link" href="#features">${label("mkt.nav.features")}</a>
<a class="nav-link" href="#preview">${label("mkt.nav.preview")}</a>
<a class="nav-link" href="#download">${label("mkt.nav.download")}</a>
<a class="nav-link" href="#faq">${label("mkt.nav.faq")}</a>
</nav>
<div class="nav-actions">${langSwitch}<a class="btn nav-cta" href="/login">${label("mkt.nav.signIn")}</a><a class="btn primary nav-cta" href="#download">${label("mkt.nav.download")}</a>${hamburger}</div>
</div></div>`;

  const heroDl = featured
    ? `<a class="btn primary" href="${escapeHtml(featured.downloadUrl)}" download>${label("mkt.hero.actionPrimary").replace("{os}", osName).replace("{version}", escapeHtml(featured.version))}</a>`
    : `<a class="btn primary" href="#download">${label("mkt.nav.download")}</a>`;

  const hero = `<section class="hero">
<span class="hero-badge">${label("mkt.hero.badge").replace("{version}", featured ? escapeHtml(featured.version) : "3.14.2")}</span>
<h1>${label("mkt.hero.title")}</h1>
<p class="lede">${label("mkt.hero.desc")}</p>
<div class="actions">${heroDl}<a class="btn" href="#preview">${label("mkt.hero.actionSecondary")}</a></div>
<p class="trust">${label("mkt.hero.trust")}</p>
</section>`;

  const stats = `<section class="mkt-stats" aria-label="${label("mkt.stats.title")}">
<div class="stat"><span class="stat-num">500K+</span><span class="stat-label">${label("mkt.stats.users")}</span></div>
<div class="stat"><span class="stat-num">2,000+</span><span class="stat-label">${label("mkt.stats.devices")}</span></div>
<div class="stat"><span class="stat-num">100%</span><span class="stat-label">${label("mkt.stats.privacy")}</span></div>
<div class="stat"><span class="stat-num">4.9★</span><span class="stat-label">${label("mkt.stats.rating")}</span></div>
</section>`;

  const privacySection = `<section class="features" aria-label="${label("mkt.privacy.title")}">
<div class="mkt-heading"><h2>${label("mkt.privacy.title")}</h2></div>
<div class="feature-grid">
<div class="feature-card"><span class="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg></span><h3>${label("mkt.privacy.processing")}</h3></div>
<div class="feature-card"><span class="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span><h3>${label("mkt.privacy.encryption")}</h3></div>
<div class="feature-card"><span class="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19C15.6 20.3 13.5 21 12 21C6.5 21 2 16.5 2 11C2 9.5 2.7 7.4 4 5.5"/><path d="M22 12A10 10 0 0 0 12 2"/></svg></span><h3>${label("mkt.privacy.logging")}</h3></div>
</div>
</section>`;

  const howItWorks = `<section class="features" aria-label="${label("mkt.how.title")}">
<div class="mkt-heading"><h2>${label("mkt.how.title")}</h2></div>
<div class="steps-grid">
<div class="step-card"><span class="step-num">1</span><h3>${label("mkt.how.step1.title")}</h3><p>${label("mkt.how.step1.desc")}</p></div>
<div class="step-card"><span class="step-num">2</span><h3>${label("mkt.how.step2.title")}</h3><p>${label("mkt.how.step2.desc")}</p></div>
<div class="step-card"><span class="step-num">3</span><h3>${label("mkt.how.step3.title")}</h3><p>${label("mkt.how.step3.desc")}</p></div>
</div>
</section>`;

  const previewTabs = `<div class="mkt-tabs-wrap"><nav class="web-nav mkt-tabs" aria-label="Preview Tabs">
        <a href="#preview-today" data-nav="today" class="active" aria-current="page">${label("mkt.preview.tab.today")}</a>
        <a href="#preview-devices" data-nav="devices">${label("mkt.preview.tab.devices")}</a>
        <a href="#preview-skills" data-nav="skills">${label("mkt.preview.tab.skills")}</a>
        <a href="#preview-family" data-nav="family">${label("mkt.preview.tab.family")}</a>
       </nav></div>`;

  const preview = `<section id="preview" class="mkt-preview">
<div class="mkt-heading"><h2>${label("mkt.preview.title")}</h2>
<p>${label("mkt.preview.desc")}</p></div>
${previewTabs}
<div class="browser-frame">
<div class="browser-bar"><span class="bdot r"></span><span class="bdot y"></span><span class="bdot g"></span><span class="browser-url">nexus://app</span></div>
<div class="browser-body">
<section id="today">${renderScreenBody("today", screens, userAgent, "web")}</section>
<section id="devices" hidden>${renderScreenBody("devices", screens, userAgent, "web")}</section>
<section id="skills" hidden>${renderScreenBody("skills", screens, userAgent, "web")}</section>
<section id="family" hidden>${renderScreenBody("family", screens, userAgent, "web")}</section>
</div>
</div>
</section>`;

  const stores = `<div class="store-block">
<h3>${label("mkt.download.mobile.title")}</h3>
<p class="sub">${label("mkt.download.mobile.desc")}</p>
<div class="store-row">
<span class="store-btn soon" aria-disabled="true"><span class="store-ic">${appleStoreIcon()}</span><span><span class="store-top">${label("mkt.download.mobile.apple")}</span><span class="store-name">${label("mkt.download.mobile.appleStore")}</span></span><span class="store-tag">${label("mkt.download.mobile.soon")}</span></span>
<span class="store-btn soon" aria-disabled="true"><span class="store-ic">${googlePlayIcon()}</span><span><span class="store-top">${label("mkt.download.mobile.google")}</span><span class="store-name">${label("mkt.download.mobile.googlePlay")}</span></span><span class="store-tag">${label("mkt.download.mobile.soon")}</span></span>
</div>
</div>`;

  const requirements = `<div class="sys-req">
    <h4>${label("mkt.requirements.title")}</h4>
    <p>${label("mkt.requirements.desc")}</p>
  </div>`;

  const download = `<section id="download" class="mkt-download">${renderDownloadCenter(releases, userAgent)}${requirements}${stores}</section>`;

  const seoConfig = {
    ...demoSeo(t.color.primary),
    title: label("mkt.seo.title"),
    description: label("mkt.seo.desc"),
    alternates: [
      { lang: "en", url: "/?lang=en" },
      { lang: "tr", url: "/?lang=tr" },
    ],
  };

  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${renderHead(seoConfig)}
<link rel="icon" href="${faviconDataUri(t.color.primary)}" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="${t.color.bg}" />
<style>${renderStyles(t)}${marketingCss()}</style>
</head>
<body>
<a class="skip" href="#features">${label("mkt.skipToContent")}</a>
${navbar}
<div class="mkt">
${hero}
${renderIntegrationMarquee()}
${stats}
<div id="features" class="mkt-anchor">${renderFeatures()}</div>
${privacySection}
${howItWorks}
${preview}
${renderTestimonials()}
${renderPricing()}
${download}
<div id="faq" class="mkt-anchor">${renderFaq()}</div>
</div>
${renderRichFooter(t.color.primary)}
${renderCookieBanner()}
<script>
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var sel = '.mkt-stats .stat, .feature-card, .step-card, .pricing-card, .testimonial-card, .faq-item, .browser-frame, .mkt-heading';
    var revealEls = Array.prototype.slice.call(document.querySelectorAll(sel));
    revealEls.forEach(function(el){ el.classList.add('nx-reveal'); });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add('nx-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function(el){
      var sibs = el.parentElement ? Array.prototype.slice.call(el.parentElement.children).indexOf(el) : 0;
      el.style.setProperty('--nx-d', (Math.max(0, Math.min(sibs, 6)) * 70) + 'ms');
      io.observe(el);
    });
  }
  var menuBtn = document.querySelector('.hamburger');
  if (menuBtn) {
    menuBtn.addEventListener('click', function() {
      document.querySelector('.nav-links').classList.toggle('open');
    });
  }
  var mktLinks = Array.prototype.slice.call(document.querySelectorAll(".mkt-tabs a"));
  var mktSections = Array.prototype.slice.call(document.querySelectorAll(".browser-body section"));
  mktLinks.forEach(function(a) {
    a.addEventListener("click", function(e) {
      e.preventDefault();
      var id = a.getAttribute("data-nav");
      mktSections.forEach(function(s) { s.hidden = s.id !== id; });
      mktLinks.forEach(function(l) {
        var on = l.getAttribute("data-nav") === id;
        l.classList.toggle("active", on);
        if (on) l.setAttribute("aria-current", "page"); else l.removeAttribute("aria-current");
      });
    });
  });

  var cb = document.getElementById("cookie-banner");
  if (cb && !localStorage.getItem("cookie_consent")) {
    cb.querySelector(".cb-accept").addEventListener("click", function() {
      localStorage.setItem("cookie_consent", "accepted");
      cb.classList.add("hidden");
    });
    cb.querySelector(".cb-decline").addEventListener("click", function() {
      localStorage.setItem("cookie_consent", "declined");
      cb.classList.add("hidden");
    });
  } else if (cb) {
    cb.classList.add("hidden");
  }
})();
</script>
</body>
</html>`;
}

/** Apple App Store glyph (inline, currentColor). */
function appleStoreIcon(): string {
  return `<svg width="22" height="22" viewBox="0 0 16 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M13.09 9.54c-.02-1.9 1.55-2.81 1.62-2.86-.88-1.29-2.26-1.47-2.75-1.49-1.17-.12-2.28.69-2.87.69-.59 0-1.5-.67-2.47-.65-1.27.02-2.44.74-3.09 1.87-1.32 2.29-.34 5.68.95 7.54.63.9 1.38 1.92 2.36 1.88.95-.04 1.31-.61 2.45-.61s1.47.61 2.47.59c1.02-.02 1.66-.92 2.28-1.83.72-1.05 1.02-2.07 1.03-2.12-.02-.01-1.97-.76-1.99-3.01zM11.2 3.9c.52-.64.88-1.51.78-2.4-.75.03-1.67.5-2.21 1.13-.48.56-.91 1.46-.79 2.32.84.07 1.69-.42 2.22-1.05z"/></svg>`;
}

/** Google Play glyph (inline, brand colors). */
function googlePlayIcon(): string {
  return `<svg width="20" height="22" viewBox="0 0 20 22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#00d3ff" d="M.7.8C.4 1.1.2 1.5.2 2.1v17.8c0 .6.2 1 .5 1.3l.1.1L10.8 11v-.2L.7.8z"/><path fill="#ffce00" d="M14.1 14.4l-3.3-3.3v-.2l3.3-3.3.1.1 4 2.3c1.1.6 1.1 1.7 0 2.3l-4.1 2.1z"/><path fill="#00f076" d="M14.2 14.3L10.8 11 .7 21.1c.4.4 1 .4 1.6.1l11.9-6.9z"/><path fill="#ff3131" d="M14.2 7.7L2.3.8C1.7.5 1.1.5.7.9L10.8 11l3.4-3.3z"/></svg>`;
}
