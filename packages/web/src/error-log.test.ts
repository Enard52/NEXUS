import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// theme.js hata kancası: her hata yerel günlüğe (nexusErrorLog) yazılır; anonim gönderim yalnız
// açıkken ve yapılandırma varken olur. Gerçek blok yüklenir, mantık kopyalanmaz.
const REPO_ROOT = resolve(__dirname, "../../..");
const THEME = readFileSync(resolve(REPO_ROOT, "src/app/theme.js"), "utf8");
const CLOUD_SYNC = readFileSync(resolve(REPO_ROOT, "src/app/cloud-sync.js"), "utf8");

function hookBlock(): string {
  const a = THEME.indexOf("// Anonim hata raporlama");
  const b = THEME.indexOf("// ---------- Ortak bildirim şeridi", a);
  if (a < 0 || b < 0) throw new Error("hook block not found");
  return THEME.slice(a, b);
}

function load(store: Record<string, string>, cloud: { url: string } | null) {
  const listeners: Array<(e: unknown) => void> = [];
  const posts: Array<{ url: string; body: any }> = [];
  const win: any = {
    NEXUS_APP_VERSION: "1.0.0",
    NEXUS_CLOUD: cloud || undefined,
    addEventListener: (type: string, fn: (e: unknown) => void) => {
      if (type === "error") listeners.push(fn);
    },
  };
  const fetchStub = (url: string, init: { body: string }) => {
    posts.push({ url, body: JSON.parse(init.body) });
    return Promise.resolve({ ok: true });
  };
  new Function(
    "window",
    "location",
    "document",
    "fetch",
    "nexusGetItem",
    "nexusSetItem",
    "NEXUS_CLOUD",
    hookBlock(),
  )(
    win,
    { pathname: "/nexus-home.html" },
    { documentElement: { classList: { contains: () => false } } },
    fetchStub,
    (k: string) => (k in store ? store[k] : null),
    (k: string, v: string) => {
      store[k] = v;
    },
    cloud,
  );
  const fire = (message: string) =>
    listeners.forEach((fn) => fn({ message, filename: "https://x/app.js", lineno: 7 }));
  return { win, posts, fire };
}

describe("yerel hata günlüğü", () => {
  it("hata yerel günlüğe sayfa, sürüm ve mesajla yazılır", () => {
    const store: Record<string, string> = {};
    const { win, fire } = load(store, null);
    fire("boom");
    const log = win.nexusErrorLog.read();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      page: "nexus-home.html",
      version: "1.0.0",
      platform: "web",
      message: "boom @app.js:7",
    });
    expect(typeof log[0].at).toBe("string");
  });

  it("günlük son 50 kayıtla sınırlıdır", () => {
    const store: Record<string, string> = {};
    const { win, fire } = load(store, null);
    for (let i = 0; i < 60; i++) fire("e" + i);
    const log = win.nexusErrorLog.read();
    expect(log).toHaveLength(50);
    expect(log[0].message).toContain("e10");
    expect(log[49].message).toContain("e59");
  });

  it("anonim rapor kapalıyken hiçbir şey gönderilmez ama yerel günlük tutulur", () => {
    const store: Record<string, string> = { nexusErrorReporting: "off" };
    const { win, posts, fire } = load(store, { url: "https://example.supabase.co" });
    fire("boom");
    expect(posts).toEqual([]);
    expect(win.nexusErrorLog.read()).toHaveLength(1);
  });

  it("açıkken eski gönderim biçimi korunur (zaman damgası sunucuya gitmez)", () => {
    const { posts, fire } = load({}, { url: "https://example.supabase.co/" });
    fire("boom");
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toBe("https://example.supabase.co/functions/v1/client-error");
    expect(Object.keys(posts[0].body).sort()).toEqual(["message", "page", "platform", "version"]);
  });

  it("temizle günlüğü boşaltır; bozuk kayıt boş liste sayılır", () => {
    const store: Record<string, string> = { nexusErrorLog: "{bozuk" };
    const { win, fire } = load(store, null);
    expect(win.nexusErrorLog.read()).toEqual([]);
    fire("boom");
    win.nexusErrorLog.clear();
    expect(win.nexusErrorLog.read()).toEqual([]);
  });

  it("günlük buluta eşitlenmez", () => {
    expect(CLOUD_SYNC).toMatch(/nexusErrorLog: 1,/);
  });
});
