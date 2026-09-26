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
    _map: map,
  };
}

function load(options: {
  config?: { url: string; anonKey: string } | null;
  responders?: Array<(call: Call) => unknown>;
}) {
  const calls: Call[] = [];
  const storage = makeStorage();
  const win: Record<string, unknown> = { localStorage: storage };
  win.nexusGetItem = (key: string) => storage.getItem(key);
  win.nexusSetItem = (key: string, value: string) => {
    if (value === "") storage.removeItem(key);
    else storage.setItem(key, value);
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
    const responder = (options.responders || []).shift();
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
    expect(first.devices.map((d: { id: string }) => d.id)).toEqual(["salon-ampulu-0", "kapi-sensoru-1"]);
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
      responders: [
        () => ({ access_token: "tok-1", refresh_token: "ref-1", expires_in: 3600, user: { id: "u1", email: "a@b.co" } }),
      ],
    });
    const session = await cloud.signIn("a@b.co", "parola");
    expect(calls[0].url).toBe("https://example.supabase.co/auth/v1/token?grant_type=password");
    expect(calls[0].method).toBe("POST");
    expect(JSON.parse(String(calls[0].body))).toEqual({ email: "a@b.co", password: "parola" });
    expect(calls[0].headers.apikey).toBe("anon-key-123");
    expect(session.userId).toBe("u1");
    expect(JSON.parse(storage.getItem("nexusCloudSession") || "{}").accessToken).toBe("tok-1");
  });

  it("süresi dolmuş oturum refresh_token ile yenilenir", async () => {
    const { cloud, calls } = load({
      config: CONFIG,
      responders: [
        () => ({ access_token: "tok-1", refresh_token: "ref-1", expires_in: 3600, user: { id: "u1", email: "a@b.co" } }),
        () => ({ access_token: "tok-2", refresh_token: "ref-2", expires_in: 3600, user: { id: "u1", email: "a@b.co" } }),
      ],
    });
    await cloud.signIn("a@b.co", "parola");
    // Oturumu geçmişe al: yenileme tetiklenmeli.
    const stored = JSON.parse((globalThis as any).localStorage.getItem("nexusCloudSession") || "{}");
    stored.expiresAt = Date.now() - 1000;
    (globalThis as any).localStorage.setItem("nexusCloudSession", JSON.stringify(stored));

    const refreshed = await cloud.session();
    expect(refreshed.accessToken).toBe("tok-2");
    expect(calls[1].url).toContain("grant_type=refresh_token");
  });

  it("çıkış oturumu siler ve sunucuya bildirir", async () => {
    const { cloud, storage } = load({
      config: CONFIG,
      responders: [
        () => ({ access_token: "tok-1", refresh_token: "ref-1", expires_in: 3600, user: { id: "u1" } }),
        () => ({}),
      ],
    });
    await cloud.signIn("a@b.co", "parola");
    await cloud.signOut();
    expect(storage.getItem("nexusCloudSession")).toBe(null);
  });
});

describe("cihaz senkronu ve çevrimdışı dayanıklılık", () => {
  it("push: diziyi merge-duplicates tercihiyle ve Authorization başlığıyla gönderir", async () => {
    const { cloud, calls } = load({
      config: CONFIG,
      responders: [
        () => ({ access_token: "tok-1", refresh_token: "ref-1", expires_in: 3600, user: { id: "u1", email: "a@b.co" } }),
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
      responders: [
        () => ({ access_token: "tok-1", refresh_token: "ref-1", expires_in: 3600, user: { id: "u1", email: "a@b.co" } }),
        () => ({ status: 503, body: { message: "gecici hata" } }),
        () => ([]),
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
    expect(calls.filter((c) => c.url.endsWith("/rest/v1/nexus_devices") && c.method === "POST").length).toBe(2);
  });

  it("syncNow yerel listeyi buluttan gelenle birleştirip geri yazar", async () => {
    const { cloud, win, calls } = load({
      config: CONFIG,
      responders: [
        () => ({ access_token: "tok-1", refresh_token: "ref-1", expires_in: 3600, user: { id: "u1", email: "a@b.co" } }),
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
    (win as any).nexusSetItem("nexusPairedDevices", JSON.stringify([{ id: "d2", name: "Yerel Ampul" }]));
    await cloud.signIn("a@b.co", "parola");
    const summary = await cloud.syncNow();
    expect(summary.count).toBe(2);
    const stored = JSON.parse((win as any).nexusGetItem("nexusPairedDevices"));
    expect(stored.map((d: { id: string }) => d.id).sort()).toEqual(["d1", "d2"]);
    expect(calls.some((c) => c.url.includes("/rest/v1/nexus_devices?select"))).toBe(true);
  });
});

describe("şema dosyası", () => {
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
