/**
 * NEXUS AI — Local sync server request handler (FAZ 18)
 *
 * A zero-dependency Node `http` handler that is the single synchronization hub
 * for every surface (web, desktop, mobile):
 *   • Auth API (register/login/logout/me) backed by the durable AccountService.
 *   • Per-user data API (GET/PUT) backed by the durable UserDataStore.
 *   • A hard login gate: no app HTML is reachable without a valid session.
 *   • Static hosting for the marketing assets and the real installer download.
 *
 * The handler is a pure factory over its dependencies so it can be unit-tested
 * without opening a socket.
 */

import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { AuthError, generateNonce, generatePkce, generateState, type AccountService } from "@nexus/accounts";
import { resolveFromAcceptLanguage, SUPPORTED_LOCALES, type Locale } from "@nexus/i18n";
import { renderAppDocument, renderLoginDocument, renderMarketingDocument, renderMobileAppDocument, renderDesktopAppDocument } from "./pages.js";
import { OAUTH_PROVIDERS, type OAuthRegistry } from "./oauth.js";
import type { UserDataStore } from "./userdata.js";

export interface AppDeps {
  readonly accounts: AccountService;
  readonly userData: UserDataStore;
  /** Absolute path to the built web assets (for /downloads and static files). */
  readonly staticRoot?: string;
  /** Configured social sign-in providers (Google/Apple). Optional in tests. */
  readonly oauth?: OAuthRegistry;
}

const SESSION_COOKIE = "nx_session";
const LANG_COOKIE = "nx_lang";
const MAX_BODY = 64 * 1024; // 64 KB is plenty for auth + data payloads.

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".exe": "application/vnd.microsoft.portable-executable",
  ".dmg": "application/x-apple-diskimage",
  ".appimage": "application/x-executable",
};

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function setCookie(res: ServerResponse, name: string, value: string, maxAgeSec: number): void {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  appendHeader(res, "Set-Cookie", parts.join("; "));
}

function clearCookie(res: ServerResponse, name: string): void {
  appendHeader(res, "Set-Cookie", `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

// OAuth transaction cookies (state / PKCE verifier / nonce / provider) live for
// the ~10 minutes of a login round-trip. SameSite=Lax works for the Google GET
// callback; Apple's cross-site form_post callback additionally requires the app
// to be served over HTTPS with SameSite=None (see .env.example).
const OAUTH_COOKIES = ["nx_oauth_state", "nx_oauth_pkce", "nx_oauth_nonce", "nx_oauth_provider"] as const;
function setOAuthCookie(res: ServerResponse, name: string, value: string): void {
  appendHeader(
    res,
    "Set-Cookie",
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  );
}
function clearOAuthCookies(res: ServerResponse): void {
  for (const name of OAUTH_COOKIES) clearCookie(res, name);
}

function appendHeader(res: ServerResponse, name: string, value: string): void {
  const existing = res.getHeader(name);
  if (existing === undefined) res.setHeader(name, value);
  else if (Array.isArray(existing)) res.setHeader(name, [...existing, value]);
  else res.setHeader(name, [String(existing), value]);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(text);
}

function sendHtml(res: ServerResponse, status: number, html: string): void {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function redirect(res: ServerResponse, location: string): void {
  res.writeHead(302, { Location: location });
  res.end();
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return await new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/** Read an application/x-www-form-urlencoded body (used by Apple's form_post callback). */
async function readFormBody(req: IncomingMessage): Promise<Record<string, string>> {
  return await new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      const params = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
      resolve(Object.fromEntries(params));
    });
    req.on("error", reject);
  });
}

function isLocale(v: string): v is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(v);
}

/** Resolve the visitor's locale: explicit ?lang, then cookie, then Accept-Language. */
function resolveLocale(
  url: URL,
  cookies: Record<string, string>,
  acceptLanguage: string | undefined,
): Locale {
  const q = url.searchParams.get("lang");
  if (q && isLocale(q)) return q;
  const c = cookies[LANG_COOKIE];
  if (c && isLocale(c)) return c;
  return resolveFromAcceptLanguage(acceptLanguage);
}

async function serveStatic(res: ServerResponse, root: string, urlPath: string): Promise<boolean> {
  // Only known static extensions are served; never expose arbitrary files.
  const ext = extname(urlPath).toLowerCase();
  if (!ext || !(ext in MIME)) return false;
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const abs = join(root, rel);
  if (!abs.startsWith(root + sep) && abs !== root) return false; // traversal guard
  try {
    const info = await stat(abs);
    if (!info.isFile()) return false;
    const headers: Record<string, string> = { "Content-Type": MIME[ext] ?? "application/octet-stream" };
    // Force a download (not inline) for installer binaries.
    if (ext === ".exe" || ext === ".dmg" || ext === ".appimage") {
      headers["Content-Disposition"] = `attachment; filename="${rel.split("/").pop() ?? "download"}"`;
    }
    res.writeHead(200, headers);
    res.end(await readFile(abs));
    return true;
  } catch {
    return false;
  }
}

/** Coarse mobile/tablet detection from the User-Agent, enough to pick phone chrome. */
function isMobileUserAgent(ua: string): boolean {
  return /Android|iPhone|iPod|iPad|Mobile|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua);
}

/** The native desktop shell (Electron) identifies itself in the User-Agent. */
function isDesktopUserAgent(ua: string): boolean {
  return /Electron|NexusDesktop/i.test(ua);
}

/**
 * Minimal service worker: caches the app shell on install and serves a
 * cache-first fallback for GET requests so the installed PWA opens offline.
 * API calls (/api/*) always go to the network so live data is never stale.
 */
const SERVICE_WORKER = `
var CACHE = "nexus-shell-v1";
var SHELL = ["/", "/app", "/login", "/manifest.webmanifest", "/icon.svg"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function(){}); }));
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.url.indexOf("/api/") >= 0) return;
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy).catch(function(){}); });
      return res;
    }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match("/"); }); })
  );
});
`.trim();

/**
 * Build the request handler. Pure over {@link AppDeps} — no sockets, no globals —
 * so it can be exercised directly in tests or mounted on any `http.Server`.
 */
export function createRequestHandler(deps: AppDeps): (req: IncomingMessage, res: ServerResponse) => void {
  const { accounts, userData, staticRoot, oauth } = deps;

  return (req, res) => {
    handle(req, res).catch((err: unknown) => {
      if (!res.headersSent) sendJson(res, 500, { error: "Internal server error" });
      else res.end();
      // Surface the failure for local debugging without leaking details to clients.
      console.error("[nexus/server]", err);
    });
  };

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;
    const method = req.method ?? "GET";
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    const account = token ? accounts.validateSession(token) : undefined;

    // ── Global Security Headers ──────────────────────────────────────────────
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'");

    // ── Auth API ─────────────────────────────────────────────────────────────
    if (path === "/api/register" && method === "POST") {
      const body = await readJsonBody(req);
      const email = String(body.email ?? "");
      const password = String(body.password ?? "");
      try {
        // The account owner is the admin of their own household.
        const created = accounts.register({ email, password, role: "admin" });
        const session = accounts.login(email, password);
        setCookie(res, SESSION_COOKIE, session.token, 60 * 60 * 24);
        userData.ensure(created.id, created.email, localeFrom(cookies, req));
        return sendJson(res, 201, { user: publicUser(created) });
      } catch (err) {
        return sendJson(res, 400, { error: authMessage(err) });
      }
    }

    if (path === "/api/login" && method === "POST") {
      const body = await readJsonBody(req);
      const email = String(body.email ?? "");
      const password = String(body.password ?? "");
      try {
        const session = accounts.login(email, password);
        const user = accounts.validateSession(session.token)!;
        setCookie(res, SESSION_COOKIE, session.token, 60 * 60 * 24);
        userData.ensure(user.id, user.email, localeFrom(cookies, req));
        return sendJson(res, 200, { user: publicUser(user) });
      } catch (err) {
        return sendJson(res, 401, { error: authMessage(err) });
      }
    }

    if (path === "/api/logout" && method === "POST") {
      if (token) accounts.logout(token);
      clearCookie(res, SESSION_COOKIE);
      return sendJson(res, 200, { ok: true });
    }

    // ── Guest sign-in: a fresh anonymous account with real per-user storage ───
    if (path === "/api/guest" && method === "POST") {
      const session = accounts.loginAsGuest();
      const user = accounts.validateSession(session.token)!;
      setCookie(res, SESSION_COOKIE, session.token, 60 * 60 * 24);
      userData.ensure(user.id, user.email, localeFrom(cookies, req));
      return sendJson(res, 200, { user: publicUser(user) });
    }

    // ── Social sign-in: start the Authorization Code + PKCE round-trip ────────
    const startMatch = /^\/api\/oauth\/([a-z]+)\/start$/.exec(path);
    if (startMatch && method === "GET") {
      const id = startMatch[1] ?? "";
      const known = OAUTH_PROVIDERS.some((p) => p.id === id);
      const provider = known ? oauth?.get(id) : undefined;
      if (!provider) return redirect(res, "/login?oauth=unavailable");
      const state = generateState();
      const nonce = generateNonce();
      const { verifier, challenge } = generatePkce();
      setOAuthCookie(res, "nx_oauth_state", state);
      setOAuthCookie(res, "nx_oauth_pkce", verifier);
      setOAuthCookie(res, "nx_oauth_nonce", nonce);
      setOAuthCookie(res, "nx_oauth_provider", id);
      return redirect(res, provider.authorizeUrl(state, challenge, nonce));
    }

    // ── Social sign-in: provider callback (Google → GET, Apple → POST) ────────
    const cbMatch = /^\/api\/oauth\/([a-z]+)\/callback$/.exec(path);
    if (cbMatch && (method === "GET" || method === "POST")) {
      const id = cbMatch[1] ?? "";
      const provider = oauth?.get(id);
      const params = method === "POST" ? await readFormBody(req) : Object.fromEntries(url.searchParams);
      const code = String(params.code ?? "");
      const returnedState = String(params.state ?? "");
      const savedState = cookies["nx_oauth_state"];
      const verifier = cookies["nx_oauth_pkce"] ?? "";
      const savedProvider = cookies["nx_oauth_provider"];
      clearOAuthCookies(res);
      if (!provider || !code || !savedState || returnedState !== savedState || savedProvider !== id) {
        return redirect(res, "/login?oauth=error");
      }
      try {
        const profile = await provider.exchange(code, verifier);
        const session = accounts.loginWithProvider(profile, provider);
        const user = accounts.validateSession(session.token)!;
        setCookie(res, SESSION_COOKIE, session.token, 60 * 60 * 24);
        userData.ensure(user.id, user.email, localeFrom(cookies, req));
        return redirect(res, "/app");
      } catch {
        return redirect(res, "/login?oauth=error");
      }
    }

    if (path === "/api/me" && method === "GET") {
      if (!account) return sendJson(res, 401, { error: "Not signed in" });
      return sendJson(res, 200, { user: publicUser(account) });
    }

    // ── Per-user data API (requires a session) ────────────────────────────────
    if (path === "/api/data") {
      if (!account) return sendJson(res, 401, { error: "Not signed in" });
      const data = userData.ensure(account.id, account.email, localeFrom(cookies, req));
      if (method === "GET") return sendJson(res, 200, { data });
      if (method === "PUT") {
        const body = await readJsonBody(req);
        const next = userData.patch(account.id, account.email, data.language, sanitizePatch(body));
        return sendJson(res, 200, { data: next });
      }
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    // ── Static assets & installer downloads (public) ──────────────────────────
    if (method === "GET" && staticRoot && (path.startsWith("/downloads/") || extname(path))) {
      const served = await serveStatic(res, staticRoot, path);
      if (served) return;
    }

    // ── Login gate ────────────────────────────────────────────────────────────
    if (path === "/login" && method === "GET") {
      if (account) return redirect(res, "/app");
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      persistLang(res, url, locale);
      const oauthNotice = url.searchParams.get("oauth");
      const notice = oauthNotice === "unavailable" || oauthNotice === "error" ? oauthNotice : undefined;
      return sendHtml(res, 200, renderLoginDocument(locale, { providers: OAUTH_PROVIDERS, notice }));
    }

    // ── Public marketing + download center (the only web surface, no login) ────
    if (path === "/" && method === "GET") {
      const locale = resolveLocale(url, cookies, req.headers["accept-language"]);
      persistLang(res, url, locale);
      const ua = String(req.headers["user-agent"] ?? "");
      return sendHtml(res, 200, renderMarketingDocument(locale, ua));
    }

    if (path === "/privacy" && method === "GET") {
      return sendHtml(res, 200, "<!doctype html><html lang='en'><head><meta charset='utf-8'/><title>Privacy Policy</title></head><body style='font-family:sans-serif;padding:2rem'><h1>Privacy Policy</h1><p>Placeholder for privacy policy.</p><a href='/'>Back to Home</a></body></html>");
    }

    if (path === "/terms" && method === "GET") {
      return sendHtml(res, 200, "<!doctype html><html lang='en'><head><meta charset='utf-8'/><title>Terms of Service</title></head><body style='font-family:sans-serif;padding:2rem'><h1>Terms of Service</h1><p>Placeholder for terms of service.</p><a href='/'>Back to Home</a></body></html>");
    }

    // ── The usable app (login-gated); the desktop/mobile shells live here ─────
    if (path === "/app" && method === "GET") {
      if (!account) return redirect(res, "/login");
      let data = userData.ensure(account.id, account.email, localeFrom(cookies, req));
      // Explicit language switch persists to the user's profile (real sync).
      const q = url.searchParams.get("lang");
      if (q && isLocale(q) && q !== data.language) {
        data = userData.patch(account.id, account.email, data.language, { language: q });
        setCookie(res, LANG_COOKIE, q, 60 * 60 * 24 * 365);
        return redirect(res, "/app");
      }
      const ua = String(req.headers["user-agent"] ?? "");
      // Same login, same real data, same design system — device-appropriate chrome.
      const html = isDesktopUserAgent(ua)
        ? renderDesktopAppDocument(account, data)
        : isMobileUserAgent(ua)
          ? renderMobileAppDocument(account, data)
          : renderAppDocument(account, data, ua);
      return sendHtml(res, 200, html);
    }

    // ── Service worker (enables the installable/offline PWA on every surface) ──
    if (path === "/sw.js" && method === "GET") {
      res.writeHead(200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-cache",
        "Service-Worker-Allowed": "/",
      });
      res.end(SERVICE_WORKER);
      return;
    }

    // Unknown route.
    if (!account) return redirect(res, "/login");
    return sendJson(res, 404, { error: "Not found" });
  }

  function localeFrom(cookies: Record<string, string>, req: IncomingMessage): Locale {
    const c = cookies[LANG_COOKIE];
    if (c && isLocale(c)) return c;
    return resolveFromAcceptLanguage(req.headers["accept-language"]);
  }

  function persistLang(res: ServerResponse, url: URL, locale: Locale): void {
    if (url.searchParams.get("lang")) setCookie(res, LANG_COOKIE, locale, 60 * 60 * 24 * 365);
  }
}

function publicUser(a: { id: string; email: string; role: string }): {
  id: string;
  email: string;
  role: string;
} {
  return { id: a.id, email: a.email, role: a.role };
}

function authMessage(err: unknown): string {
  return err instanceof AuthError ? err.message : "Request failed.";
}

/** Only allow known, safe fields through the data PUT — never the whole object blindly. */
function sanitizePatch(body: Record<string, unknown>): Record<string, unknown> {
  const allowed = [
    "plan",
    "assistantName",
    "displayName",
    "language",
    "energyWhToday",
    "devices",
    "routines",
    "suggestions",
    "family",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  return patch;
}
