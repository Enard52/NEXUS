/**
 * End-to-end tests for the local sync server. These open a real socket and
 * drive the full HTTP surface with `fetch`, then prove the two properties the
 * product depends on: a hard login gate, and durable per-user data that
 * survives a full server restart (no data loss).
 */

import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import { SqliteKeyValueStore } from "@nexus/database";
import { createNexusApp, startServer } from "./index.js";

interface Running {
  server: Server;
  base: string;
  store: SqliteKeyValueStore;
  memory: import("@nexus/memory").SqliteUserMemoryStore;
}

const running: Running[] = [];

async function boot(dbFile: string): Promise<Running> {
  const store = new SqliteKeyValueStore(dbFile);
  const memoryDbFile = dbFile + ".memory";
  const { SqliteUserMemoryStore } = await import("@nexus/memory");
  const memory = new SqliteUserMemoryStore(memoryDbFile);
  const app = createNexusApp({ store, memory });
  const { server, port } = await startServer(app, 0);
  const r: Running = { server, base: `http://127.0.0.1:${port}`, store, memory };
  running.push(r);
  return r;
}

function closeAll(): Promise<void> {
  const tasks = running.splice(0).map(
    (r) =>
      new Promise<void>((resolve) => {
        r.server.close(() => {
          r.store.close();
          r.memory.close();
          resolve();
        });
      }),
  );
  return Promise.all(tasks).then(() => undefined);
}

/** Pull the session cookie value out of a response's Set-Cookie headers. */
function sessionCookie(res: Response): string {
  const all = res.headers.getSetCookie();
  const found = all.find((c) => c.startsWith("nx_session="));
  if (!found) throw new Error("no session cookie set");
  return found.split(";")[0] ?? "";
}

afterEach(async () => {
  await closeAll();
});

describe("local sync server", () => {
  const tmp = mkdtempSync(join(tmpdir(), "nexus-srv-"));

  it("serves the public marketing + download center at / with no login", async () => {
    const { base } = await boot(join(tmp, "gate.db"));
    const res = await fetch(`${base}/`, { redirect: "manual" });
    expect(res.status).toBe(200);
    const html = await res.text();
    // Download-center content is present for everyone (no session required).
    expect(html).toContain("NEXUS");
    expect(html).toContain("SHA-256");
    // Mobile apps are advertised as coming soon.
    expect(html).toContain("App Store");
    expect(html).toContain("Google Play");
    // Cookie banner should be rendered
    expect(html).toContain('id="cookie-banner"');
    expect(html).toContain("Privacy & Cookies"); // Or Turkish equivalent depending on default lang
  });

  it("applies global security headers", async () => {
    const { base } = await boot(join(tmp, "security.db"));
    const res = await fetch(`${base}/`, { redirect: "manual" });
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("content-security-policy")).toContain("default-src 'self'");
  });

  it("gates the usable app: unauthenticated GET /app redirects to /login", async () => {
    const { base } = await boot(join(tmp, "gate-app.db"));
    const res = await fetch(`${base}/app`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/login");
  });

  it("serves the login page with the real design system", async () => {
    const { base } = await boot(join(tmp, "login.db"));
    const res = await fetch(`${base}/login`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain("Sign in to NEXUS");
    expect(html).toContain("auth-form");
    // Proves the shared token system is inlined, not a hand-made stylesheet.
    expect(html).toContain("--primary");
  });

  it("offers Google + Apple social sign-in buttons on the login page", async () => {
    process.env.GOOGLE_CLIENT_ID = "test-google";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret";
    process.env.APPLE_CLIENT_ID = "test-apple";
    process.env.APPLE_TEAM_ID = "test";
    process.env.APPLE_KEY_ID = "test";
    process.env.APPLE_PRIVATE_KEY = "test";
    const { base } = await boot(join(tmp, "social.db"));
    const html = await (await fetch(`${base}/login`)).text();
    expect(html).toContain('href="/api/oauth/google/start"');
    expect(html).toContain('href="/api/oauth/apple/start"');
    expect(html).toContain("Continue with Google");
    expect(html).toContain("Continue with Apple");
    // The "or continue with email" divider ties the social + password paths together.
    expect(html).toContain("auth-divider");
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.APPLE_CLIENT_ID;
  });

  it("reports honestly when an unconfigured provider is started", async () => {
    const { base } = await boot(join(tmp, "oauth-unset.db"));
    const res = await fetch(`${base}/api/oauth/google/start`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/login?oauth=unavailable");
  });

  it("rejects an unknown provider id", async () => {
    const { base } = await boot(join(tmp, "oauth-unknown.db"));
    const res = await fetch(`${base}/api/oauth/myspace/start`, { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/login?oauth=unavailable");
  });

  it("starts the real Google flow when credentials are configured", async () => {
    process.env.GOOGLE_CLIENT_ID = "test-google-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
    try {
      const { base } = await boot(join(tmp, "oauth-google.db"));
      const res = await fetch(`${base}/api/oauth/google/start`, { redirect: "manual" });
      expect(res.status).toBe(302);
      const loc = new URL(res.headers.get("location") ?? "");
      expect(loc.origin + loc.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
      expect(loc.searchParams.get("client_id")).toBe("test-google-id");
      expect(loc.searchParams.get("code_challenge_method")).toBe("S256");
      // The transaction cookies (state / PKCE / nonce) must be planted for the callback.
      const cookies = res.headers.getSetCookie().join(" ");
      expect(cookies).toContain("nx_oauth_state=");
      expect(cookies).toContain("nx_oauth_pkce=");
    } finally {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
    }
  });

  it("offers a guest button on the login page", async () => {
    const { base } = await boot(join(tmp, "guest-page.db"));
    const html = await (await fetch(`${base}/login`)).text();
    expect(html).toContain('id="auth-guest"');
    expect(html).toContain("Continue as guest");
  });

  it("opens a real guest session and reaches the gated dashboard", async () => {
    const { base } = await boot(join(tmp, "guest.db"));
    const res = await fetch(`${base}/api/guest`, { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { email: string; role: string } };
    expect(body.user.role).toBe("guest");
    // The guest gets a real, durable session cookie — no different from a full account.
    const cookie = sessionCookie(res);
    const dash = await fetch(`${base}/app`, { headers: { cookie } });
    expect(dash.status).toBe(200);
    // And an honest empty state, proving it uses the same per-user data path.
    expect(await dash.text()).toContain("No devices connected yet.");
  });

  it("registers an account, sets a session cookie, and returns the user", async () => {
    const { base } = await boot(join(tmp, "register.db"));
    const res = await fetch(`${base}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ada.lovelace@example.com", password: "supersecret" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { user: { email: string; role: string } };
    expect(body.user.email).toBe("ada.lovelace@example.com");
    expect(body.user.role).toBe("admin");
    expect(() => sessionCookie(res)).not.toThrow();
  });

  it("rejects duplicate registration", async () => {
    const { base } = await boot(join(tmp, "dupe.db"));
    const payload = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dupe@example.com", password: "supersecret" }),
    };
    await fetch(`${base}/api/register`, payload);
    const res = await fetch(`${base}/api/register`, payload);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/already exists/i);
  });

  it("renders the signed-in dashboard from real data with an honest empty state", async () => {
    const { base } = await boot(join(tmp, "dash.db"));
    const reg = await fetch(`${base}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ada.lovelace@example.com", password: "supersecret" }),
    });
    const cookie = sessionCookie(reg);
    const res = await fetch(`${base}/app`, { headers: { cookie } });
    const html = await res.text();
    expect(res.status).toBe(200);
    // Display name derived from the email local-part — the letter-avatar source.
    expect(html).toContain("Ada Lovelace");
    // Brand-new account has no devices: the real empty state, not fake data.
    expect(html).toContain("No devices connected yet.");
    // The signed-in shell exposes a sign-out control.
    expect(html).toContain("app-logout");
  });

  it("keeps per-user data durable across a full server restart", async () => {
    const dbFile = join(tmp, "durable.db");

    // ── First run: register, then add a real device via the data API. ──
    const first = await boot(dbFile);
    const reg = await fetch(`${first.base}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "persist@example.com", password: "supersecret" }),
    });
    const cookie = sessionCookie(reg);
    const put = await fetch(`${first.base}/api/data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({
        devices: [{ id: "lamp", name: "Living room lamp", room: "Living room", online: true }],
        energyWhToday: 1500,
      }),
    });
    expect(put.status).toBe(200);
    await closeAll(); // simulate closing the app entirely

    // ── Second run on the same file: the user and their device still exist. ──
    const second = await boot(dbFile);
    const login = await fetch(`${second.base}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "persist@example.com", password: "supersecret" }),
    });
    expect(login.status).toBe(200);
    const cookie2 = sessionCookie(login);
    const data = await fetch(`${second.base}/api/data`, { headers: { cookie: cookie2 } });
    const body = (await data.json()) as {
      data: { devices: Array<{ name: string }>; energyWhToday: number };
    };
    expect(body.data.devices).toHaveLength(1);
    expect(body.data.devices[0]?.name).toBe("Living room lamp");
    expect(body.data.energyWhToday).toBe(1500);
  });

  it("logs out: the session no longer resolves", async () => {
    const { base } = await boot(join(tmp, "logout.db"));
    const reg = await fetch(`${base}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bye@example.com", password: "supersecret" }),
    });
    const cookie = sessionCookie(reg);
    await fetch(`${base}/api/logout`, { method: "POST", headers: { cookie } });
    const me = await fetch(`${base}/api/me`, { headers: { cookie } });
    expect(me.status).toBe(401);
  });

  it("rejects data access without a session", async () => {
    const { base } = await boot(join(tmp, "noauth.db"));
    const res = await fetch(`${base}/api/data`);
    expect(res.status).toBe(401);
  });

  it("serves the mobile phone-shell app (same real data) for mobile user agents", async () => {
    const { base } = await boot(join(tmp, "mobile.db"));
    const reg = await fetch(`${base}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "grace.hopper@example.com", password: "supersecret" }),
    });
    const cookie = sessionCookie(reg);
    const iphoneUa =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
    const res = await fetch(`${base}/app`, { headers: { cookie, "user-agent": iphoneUa } });
    const html = await res.text();
    expect(res.status).toBe(200);
    // Authentic phone chrome (not the web top bar).
    expect(html).toContain('<div class="phone">');
    expect(html).toContain('<nav class="tabbar"');
    // Same real user identity + installable-PWA wiring + a logout control.
    expect(html).toContain("Grace Hopper");
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('id="m-logout"');
    // Registers the service worker so it can be installed to the home screen.
    expect(html).toContain("serviceWorker");
  });

  it("exposes an installable service worker at /sw.js", async () => {
    const { base } = await boot(join(tmp, "sw.db"));
    const res = await fetch(`${base}/sw.js`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("javascript");
    const js = await res.text();
    expect(js).toContain("addEventListener");
    // API traffic must bypass the cache so live data is never stale.
    expect(js).toContain("/api/");
  });
});
