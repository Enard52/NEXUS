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
  type NavContext,
  type ScreenDescriptor,
} from "@nexus/interface";
import {
  demoReleases,
  escapeHtml,
  faviconDataUri,
  label,
  renderAvatar,
  renderLogo,
  renderNav,
  renderRichFooter,
  renderScreenBody,
  renderStyles,
  setLocale,
  type DemoScreens,
} from "@nexus/web";
import type { Account } from "@nexus/accounts";
import { renderMobileDocument } from "@nexus/mobile";
import { renderDesktopDocument } from "@nexus/desktop";
import { SkillDiscoveryService } from "@nexus/skills";
import { isRtl, resolveLocale, SUPPORTED_LOCALES, type Locale } from "@nexus/i18n";
import { renderMarketingPremiumDocument } from "./marketing-premium.js";
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
.auth-lang .lang-dropdown, .app-lang .lang-dropdown {
  appearance: none; -webkit-appearance: none; background: transparent; border: none;
  color: var(--text); font-size: 12px; font-weight: 600; cursor: pointer;
  padding: 2px 18px 2px 4px; outline: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 5 5-5' fill='none' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 2px center; background-size: 10px 6px;
}
.auth-lang .lang-dropdown option, .app-lang .lang-dropdown option { background: var(--surface); color: var(--text); }
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
    billingManage: buildBillingManageModel(data.plan),
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
  const authLangOptions = SUPPORTED_LOCALES.map(
    (l) => `<option value="${l}"${l === locale ? " selected" : ""}>${l.toUpperCase()}</option>`
  ).join("");
  const notice = opts.notice
    ? `<div class="auth-error show">${escapeHtml(label(opts.notice === "unavailable" ? "auth.social.unavailable" : "auth.social.error"))}</div>`
    : "";
  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale as Locale) ? ' dir="rtl"' : ""}>
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
<p class="auth-lang"><select class="lang-dropdown" onchange="location.href='?lang='+this.value" aria-label="Language">${authLangOptions}</select></p>
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

  const first = nav[0]?.id ?? "today";
  const sections = nav
    .map((s) => {
      const body = renderScreenBody(s.id, screens, userAgent, "web");
      return `<section id="${s.id}"${s.id === first ? "" : " hidden"}>${body}</section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale as Locale) ? ' dir="rtl"' : ""}>
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
<span class="app-lang"><select class="lang-dropdown" onchange="location.href='?lang='+this.value" aria-label="Language">${SUPPORTED_LOCALES.map((l) => `<option value="${l}"${l === locale ? " selected" : ""}>${l.toUpperCase()}</option>`).join("")}</select></span>
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

/**
 * The public marketing + download center at `/`. Delegates to the premium
 * homepage renderer (marketing-premium.ts) so the runtime route and the
 * static build always produce the same approved premium design.
 */
export function renderMarketingDocument(
  locale: string,
  _userAgent: string,
  theme: ThemeName = "dark",
): string {
  return renderMarketingPremiumDocument(
    resolveLocale(locale),
    theme === "light" ? "light" : "dark",
  );
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
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale as Locale) ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} — NEXUS</title>
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
<p class="legal-updated">${lang === "tr" ? "Son güncelleme: Temmuz 2026" : "Last updated: July 2026"}</p>
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
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale as Locale) ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>404 — NEXUS</title>
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
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale as Locale) ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} — NEXUS</title>
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
<html lang="${escapeHtml(locale)}" data-theme="${escapeHtml(theme)}"${isRtl(locale as Locale) ? ' dir="rtl"' : ""}>
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
