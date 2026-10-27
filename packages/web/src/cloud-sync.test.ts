import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * cloud-sync.js bir tarayıcı IIFE'sidir (telefonda WebView'de koşar). Testlerde
 * sahte bir window + fetch vererek yüklenir; böylece Supabase hesabı ve cihaz
 * senkronu mantığı, gerçek bir proje anahtarı olmadan doğrulanabilir.
 */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CLOUD_SYNC = readFileSync(join(REPO_ROOT, "cloud-sync.js"), "utf8");

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    // Gerçek localStorage gibi indekslenebilir: hesap durumu senkronu anahtarları tarar.
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    _map: map,
  };
}

function load(options: {
  config?: { url: string; anonKey: string } | null;
  responders?: Array<(call: Call) => unknown>;
  /** Aktif kullanıcı (auth.js'in nexusCurrentUser'ı); verilmezse "guest" öneki kullanılır. */
  user?: string;
  /** Sahte sunucu: verilirse sırayla değil bu işlev her isteği yanıtlar. */
  handler?: (call: Call) => unknown;
  /** Sahte WebSocket üreteci (Realtime testleri için). */
  WebSocket?: unknown;
  /** Capacitor ortamı: mobil uygulama gibi davranır. */
  native?: boolean;
  /** Capacitor eklentileri (Browser, App...). */
  plugins?: Record<string, unknown>;
}) {
  const calls: Call[] = [];
  const storage = makeStorage();
  if (options.user) storage.setItem("nexusCurrentUser", options.user);
  const win: Record<string, unknown> = { localStorage: storage };
  if (options.WebSocket) win.WebSocket = options.WebSocket;
  if (options.native) {
    win.Capacitor = {
      isNativePlatform: () => true,
      Plugins: options.plugins || {},
    };
  } else if (options.plugins) {
    win.Capacitor = { Plugins: options.plugins };
  }
  // auth.js ile aynı davranış: anahtarlar aktif kullanıcının önekiyle saklanır.
  const owner = () => storage.getItem("nexusCurrentUser") || "guest";
  win.nexusGetItem = (key: string) =>
    key === "nexusCurrentUser" ? storage.getItem(key) : storage.getItem(`${owner()}_${key}`);
  win.nexusSetItem = (key: string, value: string) => {
    const full = key === "nexusCurrentUser" ? key : `${owner()}_${key}`;
    if (value === "") storage.removeItem(full);
    else storage.setItem(full, value);
  };
  if (options.config) win.NEXUS_CLOUD = options.config;

  const fetchStub = (input: unknown, init?: Record<string, unknown>) => {
    const call: Call = {
      url: String(input),
      method: String((init && init.method) || "GET"),
      headers: Object.assign({}, (init && init.headers) || {}),
      body: (init && init.body) ?? null,
    };
    calls.push(call);
    const responder = options.handler
      ? () => options.handler!(call)
      : (options.responders || []).shift();
    const payload = responder ? responder(call) : {};
    const result = payload as { status?: number; body?: unknown };
    const status = result.status ?? 200;
    const text = status === 204 ? "" : JSON.stringify(result.body ?? result ?? {});
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(text),
    });
  };

  (globalThis as Record<string, unknown>).localStorage = storage;
  new Function("window", "fetch", CLOUD_SYNC)(win, fetchStub);
  return { cloud: (win as { nexusCloud: any }).nexusCloud, calls, storage, win };
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>).localStorage;
});

const CONFIG = { url: "https://example.supabase.co", anonKey: "anon-key-123" };

describe("bulut yapılandırması yokken yerel mod", () => {
  it("devre dışıysa hiçbir ağ çağrısı yapmaz ve patlamaz", async () => {
    const { cloud, calls } = load({ config: null });
    expect(cloud.enabled()).toBe(false);
    const result = await cloud.syncNow();
    expect(calls).toEqual([]);
    expect(result.count).toBe(0);
  });
});

describe("cihaz kayıtlarının tutarlılığı", () => {
  it("eski kayıtlara kararlı id kazandırır, ikinci çağrı değişmez", () => {
    const { cloud } = load({ config: CONFIG });
    const legacy = [{ name: "Salon Ampulü", room: "Salon" }, { name: "Kapı Sensörü" }];
    const first = cloud.ensureDeviceIds(legacy);
    expect(first.changed).toBe(true);
    expect(first.devices.map((d: { id: string }) => d.id)).toEqual([
      "salon-ampulu-0",
      "kapi-sensoru-1",
    ]);
    const second = cloud.ensureDeviceIds(first.devices);
    expect(second.changed).toBe(false);
    expect(second.devices).toEqual(first.devices);
  });

  it("birleştirmede daha yeni olan kazanır, uzaktaki tek kayıtlar korunur", () => {
    const { cloud } = load({ config: CONFIG });
    const local = [
      { id: "a", name: "Yerel ad", updatedAt: "2026-09-20T10:00:00.000Z" },
      { id: "b", name: "Sadece bende", updatedAt: "2026-09-21T10:00:00.000Z" },
    ];
    const remote = [
      { id: "a", name: "Buluttan gelen", updatedAt: "2026-09-22T10:00:00.000Z" },
      { id: "c", name: "Başka telefon", updatedAt: "2026-09-22T10:00:00.000Z" },
    ];
    const merged = cloud.mergeDevices(local, remote);
    expect(merged.map((d: { id: string }) => d.id).sort()).toEqual(["a", "b", "c"]);
    expect(merged.find((d: { id: string }) => d.id === "a").name).toBe("Buluttan gelen");
  });

  it("satır dönüşümü protokol/işlev/adresi korur ve geri okunabilir", () => {
    const { cloud } = load({ config: CONFIG });
    const devices = [
      {
        id: "d1",
        name: "Shelly Plug S",
        room: "Mutfak",
        protocol: "shelly",
        caps: ["switch", "energy"],
        img: "generic-smart-plug.png",
        host: "http://192.168.1.24",
        state: { switch: true },
      },
    ];
    const rows = cloud._internal.toRows("user-9", devices);
    expect(rows[0].user_id).toBe("user-9");
    expect(rows[0].caps).toEqual(["switch", "energy"]);
    const back = cloud._internal.fromRows(rows);
    expect(back[0].protocol).toBe("shelly");
    expect(back[0].host).toBe("http://192.168.1.24");
    expect(back[0].state).toEqual({ switch: true });
  });
});

describe("Supabase kimlik doğrulama akışı", () => {
  it("giriş: parola grant'ı doğru uca gider, oturum saklanır", async () => {
    const { cloud, calls, storage } = load({
      config: CONFIG,
      user: "a@b.co",
      responders: [
        () => ({
          access_token: "tok-1",
          refresh_token: "ref-1",
          expires_in: 3600,
          user: { id: "u1", email: "a@b.co" },
        }),
      ],
    });
    const session = await cloud.signIn("a@b.co", "parola");
    expect(calls[0].url).toBe("https://example.supabase.co/auth/v1/token?grant_type=password");
    expect(calls[0].method).toBe("POST");
    expect(JSON.parse(String(calls[0].body))).toEqual({ email: "a@b.co", password: "parola" });
    expect(calls[0].headers.apikey).toBe("anon-key-123");
    expect(session.userId).toBe("u1");
    expect(JSON.parse(storage.getItem("a@b.co_nexusCloudSession") || "{}").accessToken).toBe(
      "tok-1",
    );
  });

  it("doğrulanmış TOTP, parola oturumunu ikinci adıma bırakır ve kod aal2 belirteciyle değişir", async () => {
    const aal2 = `hdr.${Buffer.from(JSON.stringify({ aal: "aal2" })).toString("base64url")}.sig`;
    const { cloud, calls, storage } = load({
      config: CONFIG,
      user: "a@b.co",
      handler: (call) => {
        if (call.url.includes("grant_type=password")) {
          return {
            access_token: "tok-1",
            refresh_token: "ref-1",
            expires_in: 3600,
            user: { id: "u1", email: "a@b.co" },
          };
        }
        if (call.method === "GET" && call.url.endsWith("/auth/v1/factors")) {
          return { body: [{ id: "fac-1", factor_type: "totp", status: "verified" }] };
        }
        if (call.method === "POST" && call.url.endsWith("/auth/v1/factors")) {
          return { body: { id: "fac-new", totp: { qr_code: "<svg></svg>", secret: "SECRET" } } };
        }
        if (call.url.endsWith("/challenge")) return { body: { id: "ch-1" } };
        if (call.url.endsWith("/verify")) {
          return {
            body: {
              access_token: aal2,
              refresh_token: "ref-2",
              expires_in: 3600,
              user: { id: "u1", email: "a@b.co" },
            },
          };
        }
        return { body: [] };
      },
    });
    await cloud.signIn("a@b.co", "parola");
    await expect(cloud.needsSecondFactor()).resolves.toBe(true);
    expect(storage.getItem("nexusMfaPending")).toBe("1");
    expect(storage.getItem("nexusMfaEnrolled")).toBe("1");
    const enrolled = await cloud.enrollTotp();
    expect(enrolled.id).toBe("fac-new");
    const enrollCall = calls.find(
      (call) => call.method === "POST" && call.url.endsWith("/auth/v1/factors"),
    );
    expect(JSON.parse(String(enrollCall?.body))).toMatchObject({
      factor_type: "totp",
      issuer: "NEXUS",
    });
    const session = await cloud.verifyTotp("123456", "fac-new");
    expect(session.accessToken).toBe(aal2);
    expect(storage.getItem("nexusSessionAal")).toBe("aal2");
    expect(storage.getItem("nexusMfaPending")).toBeNull();
    const verifyCall = calls.find((call) => call.url.endsWith("/verify"));
    expect(JSON.parse(String(verifyCall?.body))).toEqual({ challenge_id: "ch-1", code: "123456" });
    await expect(cloud.needsSecondFactor()).resolves.toBe(false);
  });

  it("süresi dolmuş oturum refresh_token ile yenilenir", async () => {
    const { cloud, calls } = load({
      config: CONFIG,
      user: "a@b.co",
      responders: [
        () => ({
          access_token: "tok-1",
          refresh_token: "ref-1",
          expires_in: 3600,
          user: { id: "u1", email: "a@b.co" },
        }),
        () => ({
          access_token: "tok-2",
          refresh_token: "ref-2",
          expires_in: 3600,
          user: { id: "u1", email: "a@b.co" },
        }),
      ],
    });
    await cloud.signIn("a@b.co", "parola");
    // Oturumu geçmişe al: yenileme tetiklenmeli.
    const stored = JSON.parse(
      (globalThis as any).localStorage.getItem("a@b.co_nexusCloudSession") || "{}",
    );
    stored.expiresAt = Date.now() - 1000;
    (globalThis as any).localStorage.setItem("a@b.co_nexusCloudSession", JSON.stringify(stored));

    const refreshed = await cloud.session();
    expect(refreshed.accessToken).toBe("tok-2");
    expect(calls[1].url).toContain("grant_type=refresh_token");
  });

  it("çıkış oturumu siler ve sunucuya bildirir", async () => {
    const { cloud, storage } = load({
      config: CONFIG,
      user: "a@b.co",
      responders: [
        () => ({
          access_token: "tok-1",
          refresh_token: "ref-1",
          expires_in: 3600,
          user: { id: "u1" },
        }),
        () => ({}),
      ],
    });
    await cloud.signIn("a@b.co", "parola");
    await cloud.signOut();
    expect(storage.getItem("a@b.co_nexusCloudSession")).toBe(null);
  });
});

describe("cihaz senkronu ve çevrimdışı dayanıklılık", () => {
  it("push: diziyi merge-duplicates tercihiyle ve Authorization başlığıyla gönderir", async () => {
    const { cloud, calls } = load({
      config: CONFIG,
      user: "a@b.co",
      responders: [
        () => ({
          access_token: "tok-1",
          refresh_token: "ref-1",
          expires_in: 3600,
          user: { id: "u1", email: "a@b.co" },
        }),
        () => ({}),
      ],
    });
    await cloud.signIn("a@b.co", "parola");
    const result = await cloud.pushDevices([{ id: "d1", name: "Priz", caps: ["switch"] }]);
    expect(result.pushed).toBe(1);
    const pushCall = calls.find((c) => c.url.includes("/rest/v1/nexus_devices"));
    expect(pushCall!.method).toBe("POST");
    expect(pushCall!.headers.Prefer).toBe("resolution=merge-duplicates");
    expect(pushCall!.headers.Authorization).toBe("Bearer tok-1");
    expect(Array.isArray(JSON.parse(String(pushCall!.body)))).toBe(true);
  });

  it("ağ hatasında kuyruğa yazar, flushQueue yeniden dener", async () => {
    const { cloud, win, calls } = load({
      config: CONFIG,
      user: "a@b.co",
      responders: [
        () => ({
          access_token: "tok-1",
          refresh_token: "ref-1",
          expires_in: 3600,
          user: { id: "u1", email: "a@b.co" },
        }),
        () => ({ status: 503, body: { message: "gecici hata" } }),
        () => [],
        () => ({}),
      ],
    });
    // Kuyrugun gercekten gonderecegi bir cihaz olsun.
    (win as any).nexusSetItem("nexusPairedDevices", JSON.stringify([{ id: "d1", name: "Priz" }]));
    await cloud.signIn("a@b.co", "parola");
    await expect(cloud.pushDevices([{ id: "d1", name: "Priz" }])).rejects.toBeTruthy();
    const queued = JSON.parse((globalThis as any).localStorage.getItem("nexusCloudPendingOps"));
    expect(queued[0].kind).toBe("push");
    const flushed = await cloud.flushQueue();
    expect(flushed.flushed).toBe(1);
    expect((globalThis as any).localStorage.getItem("nexusCloudPendingOps")).toBe(null);
    // Flush sirasinda once cekme (select) sonra yazma (POST) yapilmali.
    expect(calls.some((c) => c.url.includes("/rest/v1/nexus_devices?select"))).toBe(true);
    expect(
      calls.filter((c) => c.url.endsWith("/rest/v1/nexus_devices") && c.method === "POST").length,
    ).toBe(2);
  });

  it("syncNow yerel listeyi buluttan gelenle birleştirip geri yazar", async () => {
    const { cloud, win, calls } = load({
      config: CONFIG,
      user: "a@b.co",
      responders: [
        () => ({
          access_token: "tok-1",
          refresh_token: "ref-1",
          expires_in: 3600,
          user: { id: "u1", email: "a@b.co" },
        }),
        () => [
          {
            device_id: "d1",
            name: "Bulut Priz",
            room: "Salon",
            protocol: "shelly",
            caps: ["switch"],
            img: "",
            host: "",
            state: {},
            updated_at: "2026-09-25T10:00:00.000Z",
          },
        ],
        () => ({}),
      ],
    });
    (win as any).nexusSetItem(
      "nexusPairedDevices",
      JSON.stringify([{ id: "d2", name: "Yerel Ampul" }]),
    );
    await cloud.signIn("a@b.co", "parola");
    const summary = await cloud.syncNow();
    expect(summary.count).toBe(2);
    const stored = JSON.parse((win as any).nexusGetItem("nexusPairedDevices"));
    expect(stored.map((d: { id: string }) => d.id).sort()).toEqual(["d1", "d2"]);
    expect(calls.some((c) => c.url.includes("/rest/v1/nexus_devices?select"))).toBe(true);
  });
});

/** Bellekte çalışan sahte Supabase: auth + nexus_devices + nexus_user_state. */
function fakeBackend() {
  const db = new Map<string, { value: string; updated_at: string }>();
  const log: Call[] = [];
  const handler = (call: Call) => {
    log.push(call);
    const u = new URL(call.url);
    if (u.pathname === "/auth/v1/token") {
      return {
        access_token: "tok-" + log.length,
        refresh_token: "ref",
        expires_in: 3600,
        user: { id: "u1", email: "a@b.co", user_metadata: { name: "Ayşe" } },
      };
    }
    if (u.pathname === "/auth/v1/user") return { id: "u1" };
    if (u.pathname === "/rest/v1/nexus_devices") return call.method === "GET" ? [] : {};
    if (u.pathname === "/rest/v1/nexus_user_state") {
      if (call.method === "GET") return [...db].map(([key, row]) => ({ key, ...row }));
      if (call.method === "POST") {
        for (const row of JSON.parse(String(call.body)))
          db.set(row.key, { value: row.value, updated_at: row.updated_at });
        return {};
      }
      if (call.method === "DELETE") {
        const keys = [...(u.searchParams.get("key") || "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
        keys.forEach((k) => db.delete(k));
        return {};
      }
    }
    return {};
  };
  const stateCalls = (method: string) =>
    log.filter((c) => c.url.includes("/rest/v1/nexus_user_state") && c.method === method);
  return { db, log, handler, stateCalls };
}

async function freshDevice(
  backend: ReturnType<typeof fakeBackend>,
  prefill: Record<string, string> = {},
) {
  const env = load({ config: CONFIG, user: "a@b.co", handler: backend.handler });
  for (const [k, v] of Object.entries(prefill)) env.storage.setItem("a@b.co_" + k, v);
  await env.cloud.signIn("a@b.co", "parola-123");
  return env;
}

describe("hesap durumu senkronu (profil, ayarlar, sahneler ...)", () => {
  it("yeni cihazda hesaptaki veriler geri yüklenir (kaldığı yerden devam)", async () => {
    const backend = fakeBackend();
    const iso = "2026-10-20T10:00:00.000Z";
    backend.db.set("nexusUserName", { value: "Ayşe", updated_at: iso });
    backend.db.set("nexusDarkMode", { value: "true", updated_at: iso });
    backend.db.set("nexusHousehold", { value: JSON.stringify([{ n: "Mehmet" }]), updated_at: iso });
    const { cloud, storage } = await freshDevice(backend);
    const result = await cloud.syncState();
    expect(result.pulled).toBe(3);
    expect(storage.getItem("a@b.co_nexusUserName")).toBe("Ayşe");
    expect(storage.getItem("a@b.co_nexusDarkMode")).toBe("true");
    expect(JSON.parse(storage.getItem("a@b.co_nexusHousehold") || "[]")[0].n).toBe("Mehmet");
  });

  it("oturum, şifre ve kurtarma bilgileri ile cihaz listesi bu tabloya HİÇ gönderilmez", async () => {
    const backend = fakeBackend();
    const { cloud } = await freshDevice(backend, {
      nexusUserName: "Ayşe",
      nexusUserPassword: "SIR",
      nexusLastRecoveryValue: "a@b.co",
      nexusLastRecoveryMethod: "email",
      nexusPairedDevices: "[]",
    });
    await cloud.syncState();
    expect([...backend.db.keys()]).toEqual(["nexusUserName"]);
    const sent = JSON.stringify(backend.stateCalls("POST").map((c) => c.body));
    expect(sent).not.toContain("SIR");
    expect(sent).not.toContain("tok-");
  });

  it("değişmeyen veri tekrar gönderilmez; yalnızca değişen anahtar gider", async () => {
    const backend = fakeBackend();
    const { cloud, storage } = await freshDevice(backend, {
      nexusTempUnit: "C",
      nexusDarkMode: "false",
    });
    await cloud.syncState();
    expect(backend.stateCalls("POST").length).toBe(1);
    await cloud.syncState();
    expect(backend.stateCalls("POST").length).toBe(1); // ikinci turda yeni yazma yok
    storage.setItem("a@b.co_nexusTempUnit", "F");
    const result = await cloud.syncState();
    expect(result.pushed).toBe(1);
    expect(backend.db.get("nexusTempUnit")!.value).toBe("F");
    expect(backend.db.get("nexusDarkMode")!.value).toBe("false");
  });

  it("bu cihazda ilk senkronda çakışma olursa hesaptaki veri kazanır", async () => {
    const backend = fakeBackend();
    backend.db.set("nexusDarkMode", { value: "true", updated_at: "2026-10-20T10:00:00.000Z" });
    const { cloud, storage } = await freshDevice(backend, { nexusDarkMode: "false" });
    await cloud.syncState();
    expect(storage.getItem("a@b.co_nexusDarkMode")).toBe("true");
  });

  it("başka cihazdaki değişiklik çekilir", async () => {
    const backend = fakeBackend();
    const { cloud, storage } = await freshDevice(backend, { nexusTempUnit: "C" });
    await cloud.syncState();
    backend.db.set("nexusTempUnit", { value: "F", updated_at: "2099-01-01T00:00:00.000Z" });
    const result = await cloud.syncState();
    expect(result.pulled).toBe(1);
    expect(storage.getItem("a@b.co_nexusTempUnit")).toBe("F");
  });

  it("yerelde silinen kayıt hesaptan da silinir; uzaktan silinen yerelden de kalkar", async () => {
    const backend = fakeBackend();
    const { cloud, storage } = await freshDevice(backend, { nexusA: "1", nexusB: "2" });
    await cloud.syncState();
    storage.removeItem("a@b.co_nexusA");
    await cloud.syncState();
    expect(backend.db.has("nexusA")).toBe(false);
    expect(backend.stateCalls("DELETE").length).toBe(1);
    backend.db.delete("nexusB");
    const result = await cloud.syncState();
    expect(result.removed).toBe(1);
    expect(storage.getItem("a@b.co_nexusB")).toBe(null);
  });

  it("tam döngü: A cihazı yazar, B cihazı (temiz kurulum) giriş yapınca aynısını görür", async () => {
    const backend = fakeBackend();
    const a = await freshDevice(backend, {
      nexusUserName: "Ayşe",
      nexusSelectedTapToRunCards: JSON.stringify(["x", "y"]),
      nexusHouseholdName: "Yılmaz Ailesi",
    });
    await a.cloud.syncAll();
    const b = await freshDevice(backend);
    const result = await b.cloud.syncState();
    expect(result.pulled).toBe(3);
    expect(b.storage.getItem("a@b.co_nexusHouseholdName")).toBe("Yılmaz Ailesi");
    expect(JSON.parse(b.storage.getItem("a@b.co_nexusSelectedTapToRunCards") || "[]")).toEqual([
      "x",
      "y",
    ]);
  });

  it("bulut kapalıyken ağ çağrısı yapmaz", async () => {
    const { cloud, calls } = load({ config: null, user: "a@b.co" });
    const result = await cloud.syncState();
    expect(result.pulled).toBe(0);
    expect(calls).toEqual([]);
  });
});

describe("hesap akışları (kayıt, şifre sıfırlama, şifre değiştirme)", () => {
  it("oturum, aktif kullanıcı henüz ayarlanmamış olsa da sahibinin e-postasıyla saklanır", async () => {
    const backend = fakeBackend();
    const { cloud, storage } = load({ config: CONFIG, handler: backend.handler });
    await cloud.signIn("a@b.co", "parola-123");
    expect(storage.getItem("a@b.co_nexusCloudSession")).toBeTruthy();
    expect(storage.getItem("guest_nexusCloudSession")).toBe(null);
  });

  it("kayıt: e-posta doğrulaması açıksa oturum açılmaz, doğrulama site köküne döner", async () => {
    const { cloud, calls } = load({
      config: CONFIG,
      handler: () => ({ id: "u2", email: "yeni@b.co" }),
    });
    const result = await cloud.signUp("yeni@b.co", "parola-123", "Ayşe");
    expect(result.needsConfirmation).toBe(true);
    expect(result.session).toBe(null);
    expect(calls[0].url).toContain("/auth/v1/signup?redirect_to=");
    const target = decodeURIComponent(calls[0].url);
    expect(target).toContain("https://nexus-smarthome.pages.dev/");
    // Site kökü hash'i işler; ayrı bir HTML sayfasına dönülmez (canlıda 404'tü).
    expect(target).not.toContain("stitch-");
    expect(JSON.parse(String(calls[0].body)).data).toEqual({ name: "Ayşe", lang: "tr" });
  });

  it("kayıt, İngilizce arayüzde mektup dilini en olarak yazar", async () => {
    const { cloud, calls, win } = load({
      config: CONFIG,
      handler: () => ({ id: "u2", email: "yeni@b.co" }),
    });
    win.nexusLang = "en";
    await cloud.signUp("yeni@b.co", "parola-123", "Ada");
    expect(JSON.parse(String(calls[0].body)).data.lang).toBe("en");
  });

  it("şifre sıfırlama gerçekten Supabase'e istek gönderir ve site köküne döner", async () => {
    const { cloud, calls } = load({ config: CONFIG, handler: () => ({}) });
    await cloud.recover("a@b.co");
    expect(calls[0].url).toContain("/auth/v1/recover?redirect_to=");
    const target = decodeURIComponent(calls[0].url);
    expect(target).toContain("https://nexus-smarthome.pages.dev/");
    // Eski /stitch-forgot-password.html canlıda 404'tü; kök #type=recovery'yi işler.
    expect(target).not.toContain("stitch-");
    expect(JSON.parse(String(calls[0].body))).toEqual({ email: "a@b.co" });
  });

  it("sıfırlama bağlantısındaki belirteçle yeni şifre PUT /auth/v1/user ile yazılır", async () => {
    const { cloud, calls } = load({ config: CONFIG, handler: () => ({}) });
    await cloud.setPasswordWithToken("recovery-token", "yeni-sifre-1");
    expect(calls[0].method).toBe("PUT");
    expect(calls[0].url).toContain("/auth/v1/user");
    expect(calls[0].headers.Authorization).toBe("Bearer recovery-token");
    expect(JSON.parse(String(calls[0].body))).toEqual({ password: "yeni-sifre-1" });
  });

  it("şifre değiştirme: önce mevcut şifre doğrulanır, sonra yenisi yazılır", async () => {
    const backend = fakeBackend();
    const { cloud, calls } = await freshDevice(backend);
    const before = calls.length;
    await cloud.changePassword("parola-123", "yeni-sifre-9");
    const sent = calls.slice(before);
    expect(sent[0].url).toContain("grant_type=password");
    expect(JSON.parse(String(sent[0].body)).password).toBe("parola-123");
    expect(sent[1].method).toBe("PUT");
    expect(JSON.parse(String(sent[1].body)).password).toBe("yeni-sifre-9");
    expect(sent[1].headers.Authorization).toMatch(/^Bearer tok-/);
  });

  it("Google girişi masaüstü/web dışında eklenti yoksa sunulmaz", () => {
    const { cloud } = load({ config: CONFIG });
    expect(cloud.googleAvailable()).toBe(false);
  });

  it("mobil uygulamada Google, sistem tarayıcısında açılır ve site aktarımına döner", () => {
    const open = vi.fn().mockResolvedValue(undefined);
    const { cloud } = load({
      config: CONFIG,
      native: true,
      plugins: {
        Browser: { open },
        App: { addListener: vi.fn(), getLaunchUrl: vi.fn().mockResolvedValue(null) },
      },
    });
    expect(cloud.googleAvailable()).toBe(true);
    cloud.signInWithGoogle();
    expect(open).toHaveBeenCalledTimes(1);
    const auth = new URL(String(open.mock.calls[0][0].url));
    expect(auth.hostname).toBe("example.supabase.co");
    expect(auth.pathname).toBe("/auth/v1/authorize");
    expect(auth.searchParams.get("provider")).toBe("google");
    // Supabase yalnız site alan adına dönüşe izin verir; doğrudan özel şema kullanılmaz.
    expect(auth.searchParams.get("redirect_to")).toBe(
      "https://nexus-smarthome.pages.dev/app-auth.html",
    );
  });

  it("mobil uygulamada Browser eklentisi yoksa düğme gösterilmez", () => {
    const { cloud } = load({
      config: CONFIG,
      native: true,
      plugins: {
        App: { addListener: vi.fn(), getLaunchUrl: vi.fn().mockResolvedValue(null) },
      },
    });
    expect(cloud.googleAvailable()).toBe(false);
  });

  it("nexus://auth dönüşü belirteçleri giriş ekranına aktarır", () => {
    const listeners: Record<string, (event: { url: string }) => void> = {};
    const replace = vi.fn();
    (globalThis as Record<string, unknown>).location = { replace, pathname: "/index.html" };
    try {
      load({
        config: CONFIG,
        native: true,
        plugins: {
          Browser: { open: vi.fn() },
          App: {
            addListener: (name: string, fn: (event: { url: string }) => void) => {
              listeners[name] = fn;
              return Promise.resolve();
            },
            getLaunchUrl: vi.fn().mockResolvedValue(null),
          },
        },
      });
      listeners.appUrlOpen({ url: "nexus://auth#access_token=tok&refresh_token=ref" });
      expect(replace).toHaveBeenCalledWith(
        "stitch-login.html?oauth=1#access_token=tok&refresh_token=ref",
      );
    } finally {
      delete (globalThis as Record<string, unknown>).location;
    }
  });
});

describe("NEXUS+ aboneliği (Whop webhook'u → nexus_entitlements)", () => {
  function withEntitlement(rows: unknown[]) {
    return (call: Call) => {
      const u = new URL(call.url);
      if (u.pathname === "/auth/v1/token") {
        return {
          access_token: "tok",
          refresh_token: "ref",
          expires_in: 3600,
          user: { id: "u1", email: "a@b.co" },
        };
      }
      if (u.pathname === "/rest/v1/nexus_entitlements") return rows;
      return {};
    };
  }

  it("aktif abonelik yerel plan anahtarlarına yansır (plan, dönem sonu, iptal bilgisi)", async () => {
    const { cloud, storage } = load({
      config: CONFIG,
      user: "a@b.co",
      handler: withEntitlement([
        {
          plan: "Yıllık",
          status: "active",
          cancel_at_period_end: true,
          period_end: "2027-10-31T00:00:00.000Z",
        },
      ]),
    });
    await cloud.signIn("a@b.co", "parola-123");
    const r = await cloud.pullEntitlement();
    expect(r).toMatchObject({ active: true, plan: "Yıllık", cancelAtPeriodEnd: true });
    expect(storage.getItem("a@b.co_nexusPlusPlan")).toBe("Yıllık");
    expect(storage.getItem("a@b.co_nexusPlusEnd")).toBe("2027-10-31T00:00:00.000Z");
    expect(storage.getItem("a@b.co_nexusPlusCancel")).toBe("1");
  });

  it("abonelik yoksa ya da bittiyse yerel plan anahtarları temizlenir", async () => {
    const { cloud, storage } = load({
      config: CONFIG,
      user: "a@b.co",
      handler: withEntitlement([]),
    });
    storage.setItem("a@b.co_nexusPlusPlan", "Aylık");
    storage.setItem("a@b.co_nexusPlusEnd", "2027-01-01T00:00:00.000Z");
    await cloud.signIn("a@b.co", "parola-123");
    const r = await cloud.pullEntitlement();
    expect(r.active).toBe(false);
    expect(storage.getItem("a@b.co_nexusPlusPlan")).toBe(null);
    expect(storage.getItem("a@b.co_nexusPlusEnd")).toBe(null);
  });

  it("abonelik anahtarları hesap durumu tablosuna asla gönderilmez (yalnızca sunucu yazar)", async () => {
    const backend = fakeBackend();
    const { cloud } = await freshDevice(backend, {
      nexusPlusPlan: "Yıllık",
      nexusUserName: "Ayşe",
    });
    await cloud.syncState();
    expect([...backend.db.keys()]).toEqual(["nexusUserName"]);
  });

  it("ödeme bağlantıları plana göre doğru Whop planına gider ve e-postayı taşır", () => {
    const { cloud } = load({ config: CONFIG });
    expect(cloud.checkoutUrl("Yıllık", "a@b.co")).toBe(
      "https://whop.com/checkout/plan_UEXO1F5mjIgWB?email=a%40b.co",
    );
    expect(cloud.checkoutUrl("Aylık", "")).toBe("https://whop.com/checkout/plan_fAMBHwTVE0hR2");
    expect(cloud.checkoutUrl("Bilinmeyen", "a@b.co")).toBe("");
  });

  it("gömülü kasa için plan kimliği Whop adresinin son parçasıdır", () => {
    const { cloud } = load({ config: CONFIG });
    expect(cloud.checkoutPlanId("Aylık", "TRY")).toBe("plan_fAMBHwTVE0hR2");
    expect(cloud.checkoutPlanId("Yıllık", "USD")).toBe("plan_XlA3SacShoiJU");
    expect(cloud.checkoutPlanId("Bilinmeyen", "TRY")).toBe("");
  });

  it("hesap iptali ve durumu whop-account uçuna gider ve plan anahtarlarını günceller", async () => {
    const { cloud, storage, calls } = load({
      config: CONFIG,
      user: "a@b.co",
      handler: (call: Call) => {
        const u = new URL(call.url);
        if (u.pathname === "/auth/v1/token") {
          return {
            access_token: "tok",
            refresh_token: "ref",
            expires_in: 3600,
            user: { id: "u1", email: "a@b.co" },
          };
        }
        if (u.pathname === "/functions/v1/whop-account") {
          const body = JSON.parse(String(call.body || "{}"));
          return {
            membership: {
              plan: "Aylık",
              currency: "TRY",
              periodEnd: "2027-11-01T00:00:00.000Z",
              cancelAtPeriodEnd: body.action === "cancel",
            },
            payments: [{ amount: "499.99", currency: "TRY", status: "paid" }],
          };
        }
        return {};
      },
    });
    await cloud.signIn("a@b.co", "parola-123");
    const status = await cloud.billingAccount("status");
    expect(status.membership.plan).toBe("Aylık");
    expect(storage.getItem("a@b.co_nexusPlusPlan")).toBe("Aylık");
    const canceled = await cloud.billingAccount("cancel");
    expect(canceled.membership.cancelAtPeriodEnd).toBe(true);
    expect(storage.getItem("a@b.co_nexusPlusCancel")).toBe("1");
    const accountCalls = calls.filter((c) => c.url.includes("/functions/v1/whop-account"));
    expect(accountCalls).toHaveLength(2);
    expect(accountCalls[1].method).toBe("POST");
    expect(JSON.parse(String(accountCalls[1].body)).action).toBe("cancel");
  });

  it("USD planları yurt dışı için ayrı Whop bağlantılarına gider ve fiyatlar dile göre gelir", () => {
    const { cloud } = load({ config: CONFIG });
    expect(cloud.checkoutUrl("Yıllık", "", "USD")).toBe(
      "https://whop.com/checkout/plan_XlA3SacShoiJU",
    );
    expect(cloud.checkoutUrl("Aylık", "", "USD")).toBe(
      "https://whop.com/checkout/plan_HIySYESquBqlg",
    );
    expect(cloud.prices("USD")["Aylık"]).toBe("$11.99");
    expect(cloud.prices("TRY")["Yıllık"]).toBe("₺3.999,99");
  });

  it("webhook işlevi dört planı (TRY + USD) para birimiyle tanır", () => {
    const src = readFileSync(
      join(REPO_ROOT, "supabase", "functions", "whop-webhook", "index.ts"),
      "utf8",
    );
    for (const id of [
      "plan_fAMBHwTVE0hR2",
      "plan_UEXO1F5mjIgWB",
      "plan_HIySYESquBqlg",
      "plan_XlA3SacShoiJU",
    ]) {
      expect(src).toContain(id);
    }
    expect(src).toContain('currency: "USD"');
  });
  it("webhook işlevi yalnızca bu iki Whop planını tanır ve imza doğrular", () => {
    const src = readFileSync(
      join(REPO_ROOT, "supabase", "functions", "whop-webhook", "index.ts"),
      "utf8",
    );
    expect(src).toContain("plan_fAMBHwTVE0hR2");
    expect(src).toContain("plan_UEXO1F5mjIgWB");
    expect(src).toContain("invalid signature");
    expect(src).toContain("WHOP_WEBHOOK_SECRET");
  });

  it("tablo: RLS açık, istemci için yazma politikası yok (yalnızca select)", () => {
    const sql = readFileSync(
      join(REPO_ROOT, "supabase", "migrations", "0003_nexus_entitlements.sql"),
      "utf8",
    );
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("nexus_entitlements_select_own");
    expect(sql).not.toMatch(/for (insert|update|delete)/);
  });
});

describe("şema dosyası", () => {
  it("hesap durumu tablosu: RLS açık, kendi satırı politikaları ve boyut sınırı var", () => {
    const sql = readFileSync(
      join(REPO_ROOT, "supabase", "migrations", "0002_nexus_user_state.sql"),
      "utf8",
    );
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("primary key (user_id, key)");
    expect(sql).toContain("references auth.users");
    expect(sql).toContain("char_length(value) <= 600000");
    for (const verb of ["select", "insert", "update", "delete"]) {
      expect(sql).toContain(`nexus_user_state_${verb}_own`);
    }
  });

  it("RLS açık, birleşik anahtar ve kendi-kaydı politikaları tanımlı", () => {
    const path = join(REPO_ROOT, "supabase", "migrations", "0001_nexus_devices.sql");
    expect(existsSync(path)).toBe(true);
    const sql = readFileSync(path, "utf8");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("primary key (user_id, device_id)");
    expect(sql).toContain("auth.uid() = user_id");
    expect(sql).toContain("references auth.users");
  });
});

describe("oturum anahtarı: e-posta büyük/küçük harf", () => {
  /* Kanıtlanan hata: auth.js, nexusCurrentUser'ı kullanıcının yazdığı gibi saklar;
     Supabase (GoTrue) ise e-postayı küçülterek döndürür. writeSession oturumu
     session.email ile, readSession ise aktif kullanıcının önekiyle okuyordu →
     "Ensar@Gmail.com" yazan bir kullanıcının oturumu hiç bulunamıyor, bulut senkronu
     üç platformda da (web/masaüstü/Android) sessizce duruyordu. */
  const sessionHandler = (call: Call) => {
    if (call.url.includes("/auth/v1/token")) {
      return {
        access_token: "at-1",
        refresh_token: "rt-1",
        expires_in: 3600,
        user: { id: "u1", email: "ensar@gmail.com" },
      };
    }
    return { body: [] };
  };

  it("sunucu e-postayı küçülterek döndürse bile oturum okunur", async () => {
    const { cloud } = load({ config: CONFIG, user: "Ensar@Gmail.com", handler: sessionHandler });
    await cloud.signIn("Ensar@Gmail.com", "sifre123");
    const s = await cloud.session();
    expect(s && s.accessToken).toBe("at-1");
  });

  it("oturum bulununca cihaz çekme isteğine erişim belirteci eşlik eder", async () => {
    const { cloud, calls } = load({
      config: CONFIG,
      user: "Ensar@Gmail.com",
      handler: sessionHandler,
    });
    await cloud.signIn("Ensar@Gmail.com", "sifre123");
    await cloud.pullDevices();
    const pull = calls.find((c) => c.url.includes("/rest/v1/nexus_devices"));
    expect(pull).toBeTruthy();
    expect((pull as Call).headers.Authorization).toBe("Bearer at-1");
  });

  it("çıkış, büyük/küçük harf fark etmeksizin tüm oturum kayıtlarını siler", async () => {
    const { cloud, storage } = load({
      config: CONFIG,
      user: "Ensar@Gmail.com",
      handler: sessionHandler,
    });
    await cloud.signIn("Ensar@Gmail.com", "sifre123");
    await cloud.signOut();
    const kalan = [...storage._map.keys()].filter((k) => k.endsWith("nexusCloudSession"));
    expect(kalan).toEqual([]);
    expect(storage.getItem("nexusCloudSessionOwner")).toBe(null);
    expect(await cloud.session()).toBe(null);
  });

  it("yerel hesabın yazımı bulutla birleşince veriler kanonik anahtarın altına taşınır", async () => {
    const { cloud, storage, win } = load({
      config: CONFIG,
      user: "Ensar@Gmail.com",
      handler: sessionHandler,
    });
    // Bulut yapılandırması yokken (yerel mod) kullanıcının yazdığı gibi saklanmış kayıtlar:
    // Supabase girişinden sonra bu önek hiç okunmuyor, cihazlar ve ayarlar kaybolmuş gibi
    // görünüyordu. Artık yalnızca harf farkı varsa tek yazımın altına taşınır.
    storage.setItem(
      "Ensar@Gmail.com_nexusPairedDevices",
      JSON.stringify([{ id: "lamp-1", name: "Lamba" }]),
    );
    storage.setItem("Ensar@Gmail.com_nexusTheme", "gece");
    await cloud.signIn("Ensar@Gmail.com", "sifre123");
    const get = win.nexusGetItem as (k: string) => string | null;
    expect(storage.getItem("nexusCurrentUser")).toBe("ensar@gmail.com");
    expect(JSON.parse(get("nexusPairedDevices") || "[]")[0].id).toBe("lamp-1");
    expect(get("nexusTheme")).toBe("gece");
    expect([...storage._map.keys()].filter((k) => k.startsWith("Ensar@"))).toEqual([]);
  });

  it("farklı bir adresin kayıtları taşınmaz (yalnızca harf farkı ele alınır)", async () => {
    const { cloud, storage } = load({
      config: CONFIG,
      user: "Ensar@Gmail.com",
      handler: sessionHandler,
    });
    storage.setItem("baska@ornek.com_nexusPairedDevices", '[{"id":"x"}]');
    await cloud.signIn("Ensar@Gmail.com", "sifre123");
    expect(storage.getItem("baska@ornek.com_nexusPairedDevices")).toBe('[{"id":"x"}]');
  });
});

/* Sayfalar oturumu doğrudan depodan okumaya kalkarsa alan adları karışıyordu:
   cloud-sync nesneyi camelCase yazar (accessToken), GoTrue yanıtı yılan kafesidir
   (access_token). Hesap silme akışı bu yüzden hiç çalışmıyordu — sınıfın geri
   gelmesini bu tarama engeller. */
describe("oturum alan adları: sayfalar camelCase okur", () => {
  const pages = readdirSync(REPO_ROOT).filter((f) => /^stitch-.*\.html$/.test(f));

  it("hiçbir sayfa depodaki oturumdan yılan kafesi alan okumaz", () => {
    const offending = pages.filter((f) =>
      /\.\s*(access_token|refresh_token|expires_in|user_metadata)\b/.test(
        readFileSync(join(REPO_ROOT, f), "utf8"),
      ),
    );
    expect(offending).toEqual([]);
  });

  it("hesap silme akışı cloud-sync'in kendi session API'sini kullanır", () => {
    const src = readFileSync(join(REPO_ROOT, "stitch-account-security.html"), "utf8");
    expect(src).toContain("nexusCloud.session()");
    expect(src).toContain("session.accessToken");
  });

  it("paketlerin hepsi aynı cloud-sync kodunu taşır (üç platform tek kaynak)", () => {
    const root = readFileSync(join(REPO_ROOT, "cloud-sync.js"), "utf8");
    for (const copy of ["www", "desktop/app", "android/app/src/main/assets/public"]) {
      const file = join(REPO_ROOT, copy, "cloud-sync.js");
      if (!existsSync(file)) continue;
      expect(readFileSync(file, "utf8")).toBe(root);
    }
  });

  it("dağıtılacak paketlerde bulut yapılandırması boş değil (senkron kapalı olmasın)", () => {
    for (const copy of ["www", "desktop/app", "android/app/src/main/assets/public"]) {
      const file = join(REPO_ROOT, copy, "cloud-config.js");
      if (!existsSync(file)) continue; // CI'de üretilir: scripts/ensure-cloud-config.mjs
      const text = readFileSync(file, "utf8");
      expect(/url:\s*"https:\/\//.test(text)).toBe(true);
      expect(/anonKey:\s*".{20,}"/.test(text)).toBe(true);
    }
  });
});

/* Realtime: başka cihazdaki değişiklik 45 saniye beklenmeden uygulanmalı.
   Testler ham WebSocket çerçevesini (phx_join / postgres_changes / heartbeat) sahte
   bir soketle doğrular; sunucu tarafında yayın üyeliği gerekir — see
   supabase/migrations/20261025_realtime_publication.sql. */
type Phx = {
  topic: string;
  event: string;
  payload: Record<string, any>;
  ref: string;
  tenant: string;
};

class FakeSocket {
  static OPEN = 1;
  readyState = 0;
  sent: Phx[] = [];
  closed = 0;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) {}
  open() {
    this.readyState = FakeSocket.OPEN;
    if (this.onopen) this.onopen();
  }
  send(text: string) {
    this.sent.push(JSON.parse(text) as Phx);
  }
  /** Sunucudan gelen tablo değişikliğini taklit eder. */
  emit(table: string, data: Record<string, unknown>) {
    if (!this.onmessage) return;
    this.onmessage({
      data: JSON.stringify({
        topic: "realtime:nexus-hesap",
        event: "postgres_changes",
        payload: { data: { table, ...data } },
      }),
    });
  }
  close() {
    this.closed++;
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }
}

const RT_CONFIG = { url: "https://ornek.supabase.co", anonKey: "anon-anahtar" };
const rtHandler = (call: Call) => {
  if (call.url.includes("/auth/v1/token")) {
    return {
      access_token: "at-rt",
      refresh_token: "rt-rt",
      expires_in: 3600,
      user: { id: "u-rt", email: "ayse@ornek.com" },
    };
  }
  if (call.url.includes("nexus_entitlements")) {
    return {
      body: [
        { plan: "Yıllık", status: "active", currency: "TRY", period_end: "2027-01-01T00:00:00Z" },
      ],
    };
  }
  return { body: [] };
};

async function withRealtime(seed?: (storage: ReturnType<typeof makeStorage>) => void) {
  const sockets: FakeSocket[] = [];
  const loaded = load({
    config: RT_CONFIG,
    user: "ayse@ornek.com",
    handler: rtHandler,
    WebSocket: class extends FakeSocket {
      constructor(url: string) {
        super(url);
        sockets.push(this);
      }
    },
  });
  await loaded.cloud.signIn("ayse@ornek.com", "sifre123");
  if (seed) seed(loaded.storage);
  loaded.cloud.startRealtime();
  await new Promise((r) => setTimeout(r, 0));
  const sock = sockets[sockets.length - 1];
  if (sock) sock.open();
  return { ...loaded, sock, sockets };
}

describe("anlık senkron (Supabase Realtime, ham WebSocket)", () => {
  it("oturum varsa doğru kanala ve doğru filtrelerle abone olur", async () => {
    const { sock } = await withRealtime();
    expect(sock.url).toBe(
      "wss://ornek.supabase.co/realtime/v1/websocket?apikey=anon-anahtar&vsn=1.0.0",
    );
    const join = sock.sent[0];
    expect(join.event).toBe("phx_join");
    expect(join.topic).toBe("realtime:nexus-hesap");
    expect(join.tenant).toBe("ornek");
    expect(join.payload.access_token).toBe("at-rt");
    const tables = join.payload.config.postgres_changes.map((c: Record<string, string>) => c.table);
    expect(tables).toEqual(["nexus_user_state", "nexus_devices", "nexus_entitlements"]);
    expect(join.payload.config.postgres_changes[0].filter).toBe("user_id=eq.u-rt");
    expect(join.payload.config.postgres_changes[2].filter).toBe("email=eq.ayse@ornek.com");
  });

  it("oturum yoksa soket bile açmaz (yerel modda gereksiz bağlantı yok)", async () => {
    let constructed = 0;
    class CountingSocket extends FakeSocket {
      constructor(url: string) {
        super(url);
        constructed++;
      }
    }
    const { cloud } = load({
      config: RT_CONFIG,
      user: "ayse@ornek.com",
      WebSocket: CountingSocket,
    });
    cloud.startRealtime();
    await new Promise((r) => setTimeout(r, 0));
    expect(constructed).toBe(0);
    expect(cloud.realtimeActive()).toBe(false);
  });

  it("hesap durumu değişikliği yerelde geçerli olur", async () => {
    const { storage, sock } = await withRealtime();
    sock.emit("nexus_user_state", {
      record: {
        user_id: "u-rt",
        key: "nexusTheme",
        value: "gece",
        updated_at: "2026-10-25T10:00:00Z",
      },
    });
    expect(storage.getItem("ayse@ornek.com_nexusTheme")).toBe("gece");
  });

  it("oturum ve cihaz anahtarı durum tablosundan ASLA üzerine yazılmaz", async () => {
    const { storage, sock } = await withRealtime();
    sock.emit("nexus_user_state", {
      record: { user_id: "u-rt", key: "nexusCloudSession", value: "sahte" },
    });
    sock.emit("nexus_user_state", {
      record: { user_id: "u-rt", key: "nexusPairedDevices", value: "[]" },
    });
    // Oturum yerinde ve gerçek değeriyle duruyor; saldırgan/bozuk satır geçersiz.
    expect(storage.getItem("ayse@ornek.com_nexusCloudSession")).toContain("at-rt");
    expect(storage.getItem("ayse@ornek.com_nexusPairedDevices")).toBe(null);
  });

  it("cihaz eklemesi ve silmesi eşlenir", async () => {
    const { storage, sock } = await withRealtime((s) =>
      s.setItem(
        "ayse@ornek.com_nexusPairedDevices",
        JSON.stringify([{ id: "lamp-1", name: "Lamba", protocol: "shelly", host: "192.168.1.9" }]),
      ),
    );
    sock.emit("nexus_devices", {
      event_type: "INSERT",
      record: {
        user_id: "u-rt",
        device_id: "plug-2",
        name: "Priz",
        protocol: "tapo",
        host: "192.168.1.20",
      },
    });
    let list = JSON.parse(storage.getItem("ayse@ornek.com_nexusPairedDevices") || "[]");
    expect(list.map((d: { id: string }) => d.id).sort()).toEqual(["lamp-1", "plug-2"]);
    sock.emit("nexus_devices", {
      event_type: "DELETE",
      old_record: { user_id: "u-rt", device_id: "lamp-1" },
    });
    list = JSON.parse(storage.getItem("ayse@ornek.com_nexusPairedDevices") || "[]");
    expect(list.map((d: { id: string }) => d.id)).toEqual(["plug-2"]);
  });

  it("abonelik satırı değişince haklar sunucudan yeniden okunur", async () => {
    const { calls, sock, storage } = await withRealtime();
    sock.emit("nexus_entitlements", {
      event_type: "UPDATE",
      record: { email: "ayse@ornek.com", plan: "Yıllık", status: "active" },
    });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(calls.some((c) => c.url.includes("nexus_entitlements"))).toBe(true);
    expect(storage.getItem("ayse@ornek.com_nexusPlusPlan")).toBe("Yıllık");
  });

  it("çıkış yapınca soket kapatılır ve yeniden bağlanma planı kalmaz", async () => {
    const { cloud, sock, sockets } = await withRealtime();
    await cloud.signOut();
    expect(sock.closed).toBe(1);
    expect(cloud.realtimeActive()).toBe(false);
    expect(sockets.length).toBe(1);
  });

  it("bilinmeyen tablo ve bozuk mesaj sessizce yutulur (senkron yoklama ile sürer)", async () => {
    const { sock, storage } = await withRealtime();
    sock.onmessage!({ data: "bu json değil" });
    sock.onmessage!({
      data: JSON.stringify({
        topic: "realtime:baska-kanal",
        event: "postgres_changes",
        payload: {
          data: { table: "nexus_user_state", record: { key: "nexusTheme", value: "kurcalama" } },
        },
      }),
    });
    expect(storage.getItem("ayse@ornek.com_nexusTheme")).toBe(null);
    sock.emit("bilinen_tablo", { record: { key: "nexusTheme", value: "kurcalama" } });
    expect(storage.getItem("ayse@ornek.com_nexusTheme")).toBe(null);
  });
});
