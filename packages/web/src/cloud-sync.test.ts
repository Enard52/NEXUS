import { afterEach, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
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
}) {
  const calls: Call[] = [];
  const storage = makeStorage();
  if (options.user) storage.setItem("nexusCurrentUser", options.user);
  const win: Record<string, unknown> = { localStorage: storage };
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

  it("kayıt: e-posta doğrulaması açıksa oturum açılmaz, doğrulama web adresine döner", async () => {
    const { cloud, calls } = load({
      config: CONFIG,
      handler: () => ({ id: "u2", email: "yeni@b.co" }),
    });
    const result = await cloud.signUp("yeni@b.co", "parola-123", "Ayşe");
    expect(result.needsConfirmation).toBe(true);
    expect(result.session).toBe(null);
    expect(calls[0].url).toContain("/auth/v1/signup?redirect_to=");
    expect(decodeURIComponent(calls[0].url)).toContain("/stitch-login.html");
    expect(JSON.parse(String(calls[0].body)).data.name).toBe("Ayşe");
  });

  it("şifre sıfırlama gerçekten Supabase'e istek gönderir ve web adresine döner", async () => {
    const { cloud, calls } = load({ config: CONFIG, handler: () => ({}) });
    await cloud.recover("a@b.co");
    expect(calls[0].url).toContain("/auth/v1/recover?redirect_to=");
    expect(decodeURIComponent(calls[0].url)).toContain("/stitch-forgot-password.html");
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

  it("Google girişi yalnızca web adresinde sunulur (test ortamında kapalı)", () => {
    const { cloud } = load({ config: CONFIG });
    expect(cloud.googleAvailable()).toBe(false);
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
