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
  demoReleases,
  escapeHtml,
  faviconDataUri,
  label,
  renderAvatar,
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
  renderIntegrationMarquee,
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

/** Marketing-only styles: hero, stats, desktop showcase, mobile showcase, FAQ, CTA. */
function marketingCss(): string {
  return `
html { scroll-behavior: smooth; }
.mkt { max-width: 1140px; margin: 0 auto; padding: 0 24px 24px; position: relative; z-index: 1; }
.mkt-anchor, #desktop, #mobile, #faq { scroll-margin-top: 84px; }
body { background: radial-gradient(circle at top, color-mix(in srgb, var(--primary) 15%, transparent) 0%, var(--bg) 60%); }

/* ── Hero ── */
.hero { position: relative; overflow: hidden; padding: 56px 0 40px; border-bottom: 1px solid var(--surface); margin-bottom: 32px; }
.hero-inner { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: center; }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 12px;
  font-weight: 700; color: var(--primary); background: color-mix(in srgb, var(--primary) 12%, transparent);
  padding: 8px 16px; border-radius: 999px; margin-bottom: 24px; letter-spacing: 0.04em;
  box-shadow: 0 0 20px color-mix(in srgb, var(--primary) 30%, transparent); border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent); }
.hero-badge .plat-ic { display: inline-flex; gap: 6px; margin-left: 4px; }
.hero-badge .plat-ic svg { opacity: 0.85; }
.hero h1 { color: var(--text); text-shadow: 0 4px 24px color-mix(in srgb, var(--primary) 22%, transparent); }
.hero .btn.primary { color: var(--on-primary); box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent); transition: transform 0.2s, box-shadow 0.2s; }
.hero .btn.primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px color-mix(in srgb, var(--primary) 60%, transparent); }
@media (prefers-reduced-motion: no-preference) {
  .hero .btn.primary { animation: nxPulseRing 2.8s ease-in-out infinite; }
}
@keyframes nxPulseRing {
  0%, 100% { box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent), 0 0 0 0 color-mix(in srgb, var(--primary) 30%, transparent); }
  50% { box-shadow: 0 12px 32px color-mix(in srgb, var(--primary) 60%, transparent), 0 0 0 8px color-mix(in srgb, var(--primary) 0%, transparent); }
}
/* Scroll indicator */
.scroll-hint { margin-top: 28px; display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 12px; }
.scroll-hint .mouse { width: 20px; height: 32px; border: 2px solid color-mix(in srgb, var(--muted) 50%, transparent); border-radius: 12px; position: relative; }
.scroll-hint .mouse::after { content: ""; position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 4px; height: 8px; border-radius: 999px; background: var(--muted); animation: nxScrollDot 1.6s ease-in-out infinite; }
@keyframes nxScrollDot { 0% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, 10px); } }

/* Hero mockup */
.hero-mockup { position: relative; perspective: 1000px; }
.hero-mockup .mockup-frame {
  border: 1px solid color-mix(in srgb, var(--border-strong) 40%, transparent);
  border-radius: var(--radius-lg); overflow: hidden;
  background: color-mix(in srgb, var(--surface) 85%, transparent); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 32px 80px color-mix(in srgb, var(--primary) 15%, transparent), 0 0 0 1px rgba(255,255,255,0.05) inset;
  transform: rotateY(-6deg) rotateX(4deg); transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.hero-mockup .mockup-frame:hover { transform: rotateY(-3deg) rotateX(2deg) scale(1.02); }
.mockup-bar { display: flex; align-items: center; gap: 8px; padding: 12px 18px;
  background: color-mix(in srgb, var(--bg) 40%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent); }
.mockup-bar .bdot { width: 11px; height: 11px; border-radius: 50%; box-shadow: inset 0 1px 2px rgba(255,255,255,0.2); }
.mockup-bar .bdot.r { background: #ff5f57; } .mockup-bar .bdot.y { background: #febc2e; } .mockup-bar .bdot.g { background: #28c840; }
.mockup-bar .murl { flex: 1; text-align: center; font-size: 12px; color: var(--muted); font-weight: 500;
  background: color-mix(in srgb, var(--bg) 60%, transparent); border-radius: 999px; padding: 5px 14px; margin: 0 12px; }
.mockup-body { padding: 24px; max-height: 380px; overflow: hidden; }
@media (prefers-reduced-motion: no-preference) {
  .hero-mockup { animation: nxFloat 6s ease-in-out infinite; }
  @keyframes nxFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
}
@media (max-width: 860px) { .hero-inner { grid-template-columns: 1fr; } .hero-mockup { display: none; } }

/* ── Stats strip ── */
.mkt-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  margin: 16px 0; padding: 32px; border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: var(--radius-lg); background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.05); }
.mkt-stats .stat { text-align: center; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.mkt-stats .stat:hover { transform: translateY(-4px) scale(1.02); }
.mkt-stats .stat-num { display: block; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; color: var(--primary); text-shadow: 0 2px 10px color-mix(in srgb, var(--primary) 20%, transparent); }
.mkt-stats .stat-label { display: block; color: var(--muted); font-size: 13px; margin-top: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

/* ── Section headings ── */
.mkt-heading { text-align: center; margin: 80px 0 16px; }
.mkt-heading h2 { font-size: 36px; letter-spacing: -0.02em; margin: 0; color: var(--text); }
.mkt-heading p { color: var(--muted); font-size: 16px; margin: 12px auto 0; max-width: 52ch; line-height: 1.6; }
.eyebrow { display: block; text-align: center; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--primary); margin-bottom: 8px; }

/* ── Desktop showcase ── */
.desktop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 40px; }
.dsk-card {
  display: flex; flex-direction: column; gap: 16px;
  background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent); border-radius: var(--radius-lg);
  padding: 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.03); transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  position: relative; overflow: hidden;
}
.dsk-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px color-mix(in srgb, var(--primary) 15%, transparent); border-color: color-mix(in srgb, var(--primary) 30%, transparent); }
.dsk-card .dsk-chrome { border-radius: 10px; overflow: hidden; border: 1px solid color-mix(in srgb, var(--border) 50%, transparent); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.dsk-card .dsk-titlebar { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: color-mix(in srgb, var(--bg) 50%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent); }
.dsk-card .dsk-titlebar .dot { width: 10px; height: 10px; border-radius: 50%; }
.dsk-card .dsk-titlebar .dot.r { background: #ff5f57; } .dsk-card .dsk-titlebar .dot.y { background: #febc2e; } .dsk-card .dsk-titlebar .dot.g { background: #28c840; }
.dsk-card .dsk-shot { background: var(--bg); padding: 16px; min-height: 160px; display: flex; align-items: center; justify-content: center; }
.dsk-card .dsk-shot .dsk-placeholder { width: 100%; height: 140px; border-radius: 8px; background: linear-gradient(135deg, var(--tint-soft), var(--surface)); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; }
.dsk-card .dsk-shot .dsk-placeholder svg { opacity: 0.4; }
.dsk-card .dsk-info { display: flex; flex-direction: column; gap: 4px; }
.dsk-card .dsk-info h3 { font-size: 18px; font-weight: 700; margin: 0; }
.dsk-card .dsk-info p { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5; }
.dsk-card .dsk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: var(--radius); font-size: 13px; font-weight: 600; text-decoration: none; background: var(--primary); color: var(--on-primary); box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 38%, transparent); transition: transform 0.18s, box-shadow 0.18s; margin-top: auto; }
.dsk-card .dsk-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px color-mix(in srgb, var(--primary) 52%, transparent); }
@media (max-width: 860px) { .desktop-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; } }

/* ── Mobile showcase ── */
.mobile-showcase { margin-top: 40px; display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 48px; align-items: center; }
.phone-row { display: flex; gap: 24px; justify-content: center; }
.phone-mockup { width: 200px; height: 420px; border-radius: 36px; border: 4px solid color-mix(in srgb, var(--border-strong) 60%, transparent); background: var(--bg); box-shadow: 0 24px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05) inset; overflow: hidden; position: relative; }
.phone-mockup .ph-notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 80px; height: 20px; background: color-mix(in srgb, var(--border-strong) 80%, transparent); border-radius: 0 0 14px 14px; z-index: 2; }
.phone-mockup .ph-screen { padding: 28px 14px 14px; height: 100%; display: flex; flex-direction: column; gap: 12px; }
.phone-mockup .ph-statusbar { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--muted); padding: 0 4px 4px; }
.phone-mockup .ph-card { background: linear-gradient(155deg, var(--tint-soft), var(--surface) 62%); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
.phone-mockup .ph-card .ph-label { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
.phone-mockup .ph-card .ph-val { font-size: 18px; font-weight: 700; margin-top: 2px; }
.phone-mockup .ph-card .ph-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.phone-mockup .ph-card .ph-dot { width: 8px; height: 8px; border-radius: 50%; background: #2ecc71; }
.phone-mockup .ph-tabbar { margin-top: auto; display: flex; justify-content: space-around; padding: 8px 0 4px; border-top: 1px solid var(--border); }
.phone-mockup .ph-tabbar .ph-tab { width: 24px; height: 24px; border-radius: 8px; background: var(--tint); }
@media (prefers-reduced-motion: no-preference) {
  .phone-mockup:nth-child(1) { animation: nxPhoneFloat 5s ease-in-out infinite; }
  .phone-mockup:nth-child(2) { animation: nxPhoneFloat 5s ease-in-out infinite 1.5s; }
  @keyframes nxPhoneFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
}
.mobile-features { display: flex; flex-direction: column; gap: 20px; }
.mobile-features .mf-item { display: flex; gap: 14px; align-items: flex-start; }
.mobile-features .mf-ic { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: var(--radius); background: var(--tint); color: var(--primary); flex: none; }
.mobile-features .mf-text h4 { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
.mobile-features .mf-text p { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5; }
.mobile-stores { display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
.store-btn { display: inline-flex; align-items: center; gap: 12px; text-align: left;
  padding: 14px 24px; border-radius: var(--radius-lg); border: 1px solid color-mix(in srgb, var(--border-strong) 50%, transparent);
  background: color-mix(in srgb, var(--surface) 70%, transparent); backdrop-filter: blur(10px); color: var(--text); min-width: 200px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: all 0.2s; position: relative; }
.store-btn.soon { opacity: 0.7; }
.store-btn .store-ic { display: inline-flex; }
.store-btn .store-top { display: block; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
.store-btn .store-name { display: block; font-size: 16px; font-weight: 800; margin-top: 2px; }
.store-btn .store-tag { margin-left: auto; font-size: 11px; font-weight: 800; color: var(--primary);
  background: color-mix(in srgb, var(--primary) 15%, transparent); padding: 4px 10px; border-radius: 999px; }
@media (max-width: 860px) { .mobile-showcase { grid-template-columns: 1fr; } .phone-row { margin-bottom: 16px; } }

/* ── Integrations marquee ── */
.mkt-integrations { margin-top: 80px; padding: 40px 0; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--surface) 60%, transparent), transparent); overflow: hidden; border-top: 1px solid color-mix(in srgb, var(--border) 30%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--border) 30%, transparent); text-align: center; }
.integration-title { font-size: 14px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 24px; }
.marquee { font-size: 24px; font-weight: 800; color: color-mix(in srgb, var(--text) 40%, transparent); white-space: nowrap; word-spacing: 16px; }
.marquee span { color: color-mix(in srgb, var(--text) 70%, transparent); transition: color 0.3s; cursor: default; }
.marquee span:hover { color: var(--primary); }

/* ── Closing CTA band ── */
.cta-band { margin: 80px 0 0; padding: 48px 24px; text-align: center;
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--surface)), color-mix(in srgb, var(--primary) 4%, var(--surface)));
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent); border-radius: var(--radius-lg);
  box-shadow: 0 16px 40px color-mix(in srgb, var(--primary) 10%, transparent); }
.cta-band .cta-logo { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.cta-band .cta-logo .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.05em; }
.cta-band h2 { font-size: 28px; margin: 0 0 12px; letter-spacing: -0.02em; color: var(--text); }
.cta-band p { color: var(--muted); font-size: 15px; margin: 0 0 24px; }
.cta-band .btn.primary { font-size: 15px; padding: 14px 32px; }

/* ── Download center (kept for direct links) ── */
.mkt-download h2 { text-align: center; font-size: 36px; letter-spacing: -0.02em; margin: 80px 0 24px; color: var(--text); }
.mkt-download { text-align: center; }
.mkt-download table { text-align: left; margin-top: 32px; background: color-mix(in srgb, var(--surface) 60%, transparent); backdrop-filter: blur(12px); border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.02); }
.mkt-download th, .mkt-download td { border-color: color-mix(in srgb, var(--border) 40%, transparent); }

@media (max-width: 720px) { .mkt-stats { grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 20px; } }

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

  const navbar = `<div class="navbar" id="navbar"><div class="nav-container">
<a href="/" class="nav-brand">${renderLogo()}<span class="brand-title">NEXUS</span></a>
<nav class="nav-links" aria-label="Primary">
<a class="nav-link" href="#features">${label("mkt.nav.features")}</a>
<a class="nav-link" href="#desktop">${label("mkt.nav.preview")}</a>
<a class="nav-link" href="#mobile">${label("mkt.nav.download")}</a>
<a class="nav-link" href="#faq">${label("mkt.nav.faq")}</a>
</nav>
<div class="nav-actions">${langSwitch}<a class="btn nav-cta" href="/login">${label("mkt.nav.signIn")}</a><a class="btn primary nav-cta" href="#desktop">${label("mkt.nav.download")}</a>${hamburger}</div>
</div></div>`;

  const heroDl = featured
    ? `<a class="btn primary" href="${escapeHtml(featured.downloadUrl)}" download>${label("mkt.hero.actionPrimary").replace("{os}", osName).replace("{version}", escapeHtml(featured.version))}</a>`
    : `<a class="btn primary" href="#desktop">${label("mkt.nav.download")}</a>`;

  const platformIcons = `<span class="plat-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5.5L10.5 4.5v7H3v-6zM3 12.5h7.5v7L3 18.5v-6zM12.5 4.2L21 3v8.5h-8.5v-7.3zM12.5 12.5H21V21l-8.5-1.2v-7.3z"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.7 17.3c-.5 1.1-.7 1.6-1.3 2.6-.9 1.4-2.1 3.2-3.7 3.2-1.4 0-1.7-.9-3.6-.9s-2.3.9-3.6.9c-1.6 0-2.7-1.6-3.6-3-2.5-3.8-2.8-8.3-1.2-10.7 1.1-1.7 2.8-2.7 4.5-2.7 1.7 0 2.7.9 4.1.9 1.3 0 2.1-.9 4-.9 1.4 0 2.9.8 4 2.1-3.5 1.9-2.9 6.9.4 8.5zM14.5 3.6c.8-1 1.4-2.4 1.3-3.8-1.3.1-2.8.9-3.7 1.9-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.7 3.7-1.8z"/></svg><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 2c1.5 0 3 2.5 3.5 6.5h-7C9 6.5 10.5 4 12 4zm-7.9 6.5h3.4c.1-2 .5-3.8 1-5.3-2.4.8-4.1 2.9-4.4 5.3zm0 3c.3 2.4 2 4.5 4.4 5.3-.5-1.5-.9-3.3-1-5.3H4.1zm7.9 6.5c-1.5 0-3-2.5-3.5-6.5h7C15 17.5 13.5 20 12 20zm3.5-1.2c2.4-.8 4.1-2.9 4.4-5.3h-3.4c-.1 2-.5 3.8-1 5.3zm1-6.5c.1-2 .5-3.8 1-5.3 2.4.8 4.1 2.9 4.4 5.3h-5.4z"/></svg></span>`;

  const heroMockup = `<div class="hero-mockup"><div class="mockup-frame">
<div class="mockup-bar"><span class="bdot r"></span><span class="bdot y"></span><span class="bdot g"></span><span class="murl">nexus://app</span></div>
<div class="mockup-body">
<div class="bento" style="grid-template-columns:repeat(2,minmax(0,1fr));">
<article class="bento-tile featured" style="grid-column:span 2;grid-row:auto;"><div class="tile-head"><span class="cardicon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="14" height="10" rx="1.5"/><rect x="16" y="9" width="6" height="11" rx="1.5"/></svg></span><span class="tile-title">Devices online</span></div><div class="ring-wrap"><svg class="ring" width="80" height="80" viewBox="0 0 96 96" role="img" aria-hidden="true"><circle cx="48" cy="48" r="34" fill="none" stroke="var(--border)" stroke-width="9"/><circle cx="48" cy="48" r="34" fill="none" stroke="var(--primary)" stroke-width="9" stroke-linecap="round" stroke-dasharray="160.2 213.6" transform="rotate(-90 48 48)"/><text x="48" y="54" text-anchor="middle" font-size="20" font-weight="700" fill="var(--text)">6/8</text></svg><div class="ring-meta"><span class="value">75% online</span><span class="label">2 offline</span></div></div></article>
<article class="bento-tile"><div class="tile-head"><span class="cardicon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></span><span class="tile-title">Energy today</span></div><div class="value">2.72 kWh</div></article>
<article class="bento-tile"><div class="tile-head"><span class="cardicon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span><span class="tile-title">Active routines</span></div><div class="value">5</div></article>
</div>
</div>
</div></div>`;

  const hero = `<section class="hero">
<div class="hero-inner">
<div class="hero-text">
<span class="hero-badge">${label("mkt.hero.badge").replace("{version}", featured ? escapeHtml(featured.version) : "3.14.2")}${platformIcons}</span>
<h1>${label("mkt.hero.title")}</h1>
<p class="lede">${label("mkt.hero.desc")}</p>
<div class="actions">${heroDl}<a class="btn" href="#desktop">${label("mkt.hero.actionSecondary")}</a></div>
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

  const desktopCard = (platform: string, titleKey: string, descKey: string, downloadUrl: string) => {
    const chromeBar = platform === "macos"
      ? `<div class="dsk-titlebar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>`
      : `<div class="dsk-titlebar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>`;
    return `<div class="dsk-card">
<div class="dsk-chrome">${chromeBar}<div class="dsk-shot"><div class="dsk-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="18" x2="12" y2="21"/></svg></div></div></div>
<div class="dsk-info"><h3>${label(titleKey)}</h3><p>${label(descKey)}</p></div>
<a class="dsk-btn" href="${escapeHtml(downloadUrl)}" download>${label("mkt.desktop.download")} · ${escapeHtml(featured ? featured.version : "3.14.2")}</a>
</div>`;
  };

  const winUrl = releases.all().find((r) => r.platform === "windows")?.downloadUrl ?? "#";
  const macUrl = releases.all().find((r) => r.platform === "macos")?.downloadUrl ?? "#";
  const linUrl = releases.all().find((r) => r.platform === "linux")?.downloadUrl ?? "#";

  const desktopSection = `<section id="desktop" class="mkt-anchor">
<div class="mkt-heading"><span class="eyebrow">${label("mkt.desktop.eyebrow")}</span><h2>${label("mkt.desktop.title")}</h2><p>${label("mkt.desktop.desc")}</p></div>
<div class="desktop-grid">
${desktopCard("windows", "mkt.desktop.windows", "mkt.desktop.windowsDesc", winUrl)}
${desktopCard("macos", "mkt.desktop.macos", "mkt.desktop.macosDesc", macUrl)}
${desktopCard("linux", "mkt.desktop.linux", "mkt.desktop.linuxDesc", linUrl)}
</div>
</section>`;

  const mobilePhone = (variant: "ios" | "android") => {
    const notch = variant === "ios" ? `<div class="ph-notch"></div>` : "";
    return `<div class="phone-mockup">${notch}<div class="ph-screen">
<div class="ph-statusbar"><span>9:41</span><span>5G</span></div>
<div class="ph-card"><div class="ph-label">Devices</div><div class="ph-val">6/8 online</div><div class="ph-row"><span class="ph-dot"></span><span style="font-size:10px;color:var(--muted);">Living room lamp</span></div></div>
<div class="ph-card"><div class="ph-label">Energy today</div><div class="ph-val">2.72 kWh</div></div>
<div class="ph-card"><div class="ph-label">Active routines</div><div class="ph-val">5</div></div>
<div class="ph-tabbar"><span class="ph-tab"></span><span class="ph-tab"></span><span class="ph-tab"></span><span class="ph-tab"></span></div>
</div></div>`;
  };

  const mobileFeature = (icon: string, titleKey: string, descKey: string) =>
    `<div class="mf-item"><span class="mf-ic">${icon}</span><div class="mf-text"><h4>${label(titleKey)}</h4><p>${label(descKey)}</p></div></div>`;

  const mobileSection = `<section id="mobile" class="mkt-anchor">
<div class="mkt-heading"><span class="eyebrow">${label("mkt.mobile.eyebrow")}</span><h2>${label("mkt.mobile.title")}</h2><p>${label("mkt.mobile.desc")}</p></div>
<div class="mobile-showcase">
<div class="phone-row">${mobilePhone("ios")}${mobilePhone("android")}</div>
<div class="mobile-features">
${mobileFeature(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`, "mkt.mobile.feat1.title", "mkt.mobile.feat1.desc")}
${mobileFeature(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`, "mkt.mobile.feat2.title", "mkt.mobile.feat2.desc")}
${mobileFeature(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`, "mkt.mobile.feat3.title", "mkt.mobile.feat3.desc")}
${mobileFeature(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 14c-3 0-6 2-6 5v1h12v-1c0-3-3-5-6-5z"/></svg>`, "mkt.mobile.feat4.title", "mkt.mobile.feat4.desc")}
<div class="mobile-stores">
<span class="store-btn soon"><span class="store-ic">${appleStoreIcon()}</span><span><span class="store-top">${label("mkt.download.mobile.apple")}</span><span class="store-name">${label("mkt.download.mobile.appleStore")}</span></span><span class="store-tag">${label("mkt.download.mobile.soon")}</span></span>
<span class="store-btn soon"><span class="store-ic">${googlePlayIcon()}</span><span><span class="store-top">${label("mkt.download.mobile.google")}</span><span class="store-name">${label("mkt.download.mobile.googlePlay")}</span></span><span class="store-tag">${label("mkt.download.mobile.soon")}</span></span>
</div>
</div>
</div>
</section>`;

  const ctaBand = `<section class="cta-band">
<div class="cta-logo">${renderLogo()}<span class="brand">NEXUS</span></div>
<h2>${label("mkt.cta.title")}</h2>
<p>${label("mkt.cta.desc")}</p>
${heroDl}
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
${desktopSection}
${mobileSection}
<div id="faq" class="mkt-anchor">${renderFaq()}</div>
${ctaBand}
</div>
${renderRichFooter(t.color.primary)}
<script>
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var sel = '.mkt-stats .stat, .feature-card, .dsk-card, .phone-mockup, .mf-item, .faq-item, .cta-band, .mkt-heading';
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
  var navbar = document.getElementById('navbar');
  if (navbar) {
    var lastScroll = 0;
    window.addEventListener('scroll', function() {
      var sc = window.scrollY;
      if (sc > 60) { navbar.style.boxShadow = '0 8px 30px color-mix(in srgb, var(--bg) 70%, transparent)'; navbar.style.height = 'auto'; }
      else { navbar.style.boxShadow = ''; }
      lastScroll = sc;
    }, { passive: true });
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
