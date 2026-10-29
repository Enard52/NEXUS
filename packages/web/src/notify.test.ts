import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * notify.js tarayıcı IIFE'sidir: uygulama içi olay akışını (nexusEvents) dışa dönük
 * kanallara dağıtır. Testlerde sahte window + sahte fetch ile yüklenir; start()
 * çağırmayız (zamanlayıcı kurmasın), doğrudan deliver/checkNew API'si denenir.
 */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const NOTIFY = readFileSync(join(REPO_ROOT, "src", "app", "notify.js"), "utf8");

type Call = { url: string; method: string; headers: Record<string, string>; body: string };

function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    _map: map,
  };
}

function loadNotify(
  options: {
    channels?: Record<string, unknown>;
    events?: unknown[];
    dndUntil?: number;
    page?: Record<string, string>;
    responder?: (call: Call) => { status?: number };
    desktop?: (ev: Record<string, unknown>) => void;
    localNotifications?: Record<string, unknown>;
    notice?: (ev: unknown) => void;
  } = {},
) {
  const owner = "ayse@ornek.com";
  const storage = makeStorage();
  const put = (key: string, value: unknown) =>
    storage.setItem(`${owner}_${key}`, typeof value === "string" ? value : JSON.stringify(value));
  if (options.channels) put("nexusNotifyChannels", options.channels);
  if (options.events) put("nexusEvents", options.events);
  if (options.dndUntil) put("nexusDndEndTime", String(options.dndUntil));
  Object.entries(options.page || {}).forEach(([k, v]) => put(`nexusInstantNotif:${k}`, v));

  const calls: Call[] = [];
  const fetchStub = (input: unknown, init?: Record<string, unknown>) => {
    const call: Call = {
      url: String(input),
      method: String((init && init.method) || "GET"),
      headers: Object.assign({}, (init && init.headers) || {}),
      body: String((init && init.body) || ""),
    };
    calls.push(call);
    const result = (options.responder && options.responder(call)) || {};
    const status = result.status ?? 200;
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(""),
    });
  };

  const win: Record<string, unknown> = {
    localStorage: storage,
    addEventListener: () => {},
    nexusGetItem: (key: string) => storage.getItem(`${owner}_${key}`),
    nexusSetItem: (key: string, value: string) => storage.setItem(`${owner}_${key}`, value),
  };
  if (options.desktop) win.nexusDesktop = { notifyEvent: options.desktop };
  if (options.notice) win.nexusShowNotice = options.notice;
  if (options.localNotifications)
    win.Capacitor = { Plugins: { LocalNotifications: options.localNotifications } };
  (globalThis as Record<string, unknown>).localStorage = storage;
  new Function("window", "fetch", "document", NOTIFY)(win, fetchStub, {
    readyState: "loading",
    addEventListener: () => {},
  });
  const notify = (win as { nexusNotify: any }).nexusNotify;
  return { notify, calls, storage, owner, put };
}

const ALL_OFF = {
  system: { enabled: false },
  ntfy: { enabled: false, topic: "" },
  webhook: { enabled: false, url: "" },
  telegram: { enabled: false, token: "", chat: "" },
};
const EVENT = {
  id: "ev-1",
  title: "Hareket algılandı",
  detail: "Koridor · kamera",
  ts: new Date().toISOString(),
};

describe("masaüstü yerel bildirim", () => {
  it("olay tercihlere uyarak tek bir yerel bildirim olur", async () => {
    const shown: Record<string, unknown>[] = [];
    const { notify } = loadNotify({ channels: ALL_ON_SYSTEM, desktop: (e) => shown.push(e) });
    await notify.deliver(EVENT);
    expect(shown).toHaveLength(1);
    expect(shown[0]).toMatchObject({ id: "ev-1", title: "Hareket algılandı", force: false });
  });

  it("ana anahtar kapalıyken yerel bildirim çıkmaz", async () => {
    const shown: Record<string, unknown>[] = [];
    const { notify } = loadNotify({
      channels: ALL_ON_SYSTEM,
      page: { master: "false" },
      desktop: (e) => shown.push(e),
    });
    await notify.deliver(EVENT);
    expect(shown).toEqual([]);
  });

  it("test bildirimi odaktaki pencerede de gösterilsin diye zorlanır", async () => {
    const shown: Record<string, unknown>[] = [];
    const { notify } = loadNotify({ channels: ALL_ON_SYSTEM, desktop: (e) => shown.push(e) });
    await notify.test(["system"]);
    expect(shown).toHaveLength(1);
    expect(shown[0].force).toBe(true);
  });
});

const ALL_ON_SYSTEM = { system: { enabled: true } };

function fakeLocalNotifications() {
  const log = { scheduled: [] as any[], actionTypes: [] as any[], channels: [] as any[], handler: null as any };
  const plugin = {
    createChannel: (c: unknown) => (log.channels.push(c), Promise.resolve()),
    registerActionTypes: (t: unknown) => (log.actionTypes.push(t), Promise.resolve()),
    checkPermissions: () => Promise.resolve({ display: "granted" }),
    schedule: (p: any) => (log.scheduled.push(...p.notifications), Promise.resolve()),
    addListener: (_n: string, fn: unknown) => ((log.handler = fn), Promise.resolve()),
  };
  return { plugin, log };
}

function permissionPlugin(initial: string, afterAsk: string) {
  let display = initial;
  const asked = { count: 0 };
  return {
    asked,
    plugin: {
      createChannel: () => Promise.resolve(),
      checkPermissions: () => Promise.resolve({ display }),
      requestPermissions: () => ((asked.count += 1), (display = afterAsk), Promise.resolve({ display })),
      schedule: () => Promise.resolve(),
      addListener: () => Promise.resolve(),
    },
  };
}

describe("giriş sonrası bildirim kurulumu ve gerçek izin", () => {
  it("izin durumu sormadan okunur", async () => {
    const a = loadNotify({ localNotifications: permissionPlugin("denied", "denied").plugin });
    expect(await a.notify.permission()).toBe("denied");
    const b = loadNotify({ localNotifications: permissionPlugin("prompt-with-rationale", "granted").plugin });
    expect(await b.notify.permission()).toBe("prompt");
    const c = loadNotify({ localNotifications: permissionPlugin("granted", "granted").plugin });
    expect(await c.notify.permission()).toBe("granted");
  });

  it("onay: izin istenir, anlık ve kritik anahtarlar açılır", async () => {
    const fake = permissionPlugin("prompt", "granted");
    const { notify } = loadNotify({ localNotifications: fake.plugin });
    const res = await notify.finishSetup(true, true);
    expect(res.granted).toBe(true);
    expect(fake.asked.count).toBe(1);
    expect(notify.mutedBy({ id: "e", type: "energy" })).toBe("");
    expect(notify.mutedBy({ id: "s", type: "security" })).toBe("");
    expect(notify.mutedBy({ id: "m", type: "emergency" })).toBe("");
    expect(notify.channels().system.enabled).toBe(true);
  });

  it("red: izin verilmezse hiçbir bildirim açık kalmaz", async () => {
    const fake = permissionPlugin("prompt", "denied");
    const { notify } = loadNotify({ localNotifications: fake.plugin });
    const res = await notify.finishSetup(true, true);
    expect(res.granted).toBe(false);
    expect(notify.mutedBy({ id: "s", type: "security" })).toBe("master");
    expect(notify.mutedBy({ id: "e", type: "energy" })).toBe("master");
  });

  it("'Şimdi değil' izin sormadan her şeyi kapatır", async () => {
    const fake = permissionPlugin("prompt", "granted");
    const { notify } = loadNotify({ localNotifications: fake.plugin });
    await notify.finishSetup(false, false);
    expect(fake.asked.count).toBe(0);
    expect(notify.mutedBy({ id: "s", type: "security" })).toBe("master");
  });

  it("yalnız anlık seçilirse kritik kategoriler kapalı kalır", async () => {
    const fake = permissionPlugin("granted", "granted");
    const { notify } = loadNotify({ localNotifications: fake.plugin });
    await notify.finishSetup(true, false);
    expect(notify.mutedBy({ id: "e", type: "energy" })).toBe("");
    expect(notify.mutedBy({ id: "s", type: "security" })).toBe("category");
    expect(notify.mutedBy({ id: "m", type: "emergency" })).toBe("category");
  });

  it("izin yokken telefon bildirimi hata olarak kaydedilir ve uygulama içi şerit gösterilir", async () => {
    const fake = permissionPlugin("denied", "denied");
    const shown: unknown[] = [];
    const { notify } = loadNotify({ channels: ALL_ON_SYSTEM, localNotifications: fake.plugin, notice: (e) => shown.push(e) });
    const out = await notify.deliver({ id: "k1", type: "security", title: "Alarm", detail: "x", ts: Date.now() });
    expect(out.sent).toEqual([{ channel: "system", ok: false, error: "sistem bildirim izni kapalı" }]);
    expect(shown).toHaveLength(1);
  });
});

describe("telefon bildirimi: eylem düğmeleri ve gruplama", () => {
  it("bildirim kategorisine göre gruplanır ve eylem türü bağlanır; tür bir kez kaydedilir", async () => {
    const { plugin, log } = fakeLocalNotifications();
    const { notify } = loadNotify({ channels: ALL_ON_SYSTEM, localNotifications: plugin });
    await notify.deliver({ id: "a1", type: "energy", title: "Enerji", detail: "x", ts: Date.now() });
    await notify.deliver({ id: "a2", type: "energy", title: "Enerji 2", detail: "y", ts: Date.now() });
    expect(log.scheduled).toHaveLength(2);
    expect(log.scheduled[0]).toMatchObject({ group: "nexus-energy", actionTypeId: "NEXUS_ALERT" });
    expect(log.actionTypes).toHaveLength(1);
    const ids = log.actionTypes[0].types[0].actions.map((a: any) => a.id);
    expect(ids).toEqual(["open", "mute1h"]);
  });

  it("'1 saat sustur' Rahatsız Etmeyin süresini 1 saat ileri alır ve sayfa açmaz", async () => {
    const { plugin, log } = fakeLocalNotifications();
    const { notify } = loadNotify({ channels: ALL_ON_SYSTEM, localNotifications: plugin });
    notify.start();
    expect(notify.dndActive()).toBe(false);
    log.handler({ actionId: "mute1h", notification: { extra: { page: "nexus-messages.html" } } });
    expect(notify.dndActive()).toBe(true);
  });
});
const QUIET_ALL_DAY = { quietEnabled: "true", quietStart: "00:00", quietEnd: "00:00" };

describe("kritik uyarılar ve ses tercihi", () => {
  const ALARM = { id: "ev-alarm", type: "security", title: "Alarm", detail: "Kapı", ts: Date.now() };

  it("kritik olay sessiz saatleri aşar, sıradan olay aşmaz", async () => {
    const shown: Record<string, unknown>[] = [];
    const { notify } = loadNotify({ channels: ALL_ON_SYSTEM, page: QUIET_ALL_DAY, desktop: (e) => shown.push(e) });
    await notify.deliver({ ...EVENT, id: "ev-plain", type: "automation" });
    expect(shown).toEqual([]);
    await notify.deliver(ALARM);
    expect(shown.map((e) => e.id)).toEqual(["ev-alarm"]);
  });

  it("aşım anahtarı kapalıysa kritik olay da sessiz saatte susar", async () => {
    const shown: Record<string, unknown>[] = [];
    const { notify } = loadNotify({
      channels: ALL_ON_SYSTEM,
      page: { ...QUIET_ALL_DAY, "critical-override": "false" },
      desktop: (e) => shown.push(e),
    });
    await notify.deliver(ALARM);
    expect(shown).toEqual([]);
  });

  it("ana anahtar kapalıyken kritik olay da gönderilmez", async () => {
    const shown: Record<string, unknown>[] = [];
    const { notify } = loadNotify({ channels: ALL_ON_SYSTEM, page: { master: "false" }, desktop: (e) => shown.push(e) });
    await notify.deliver(ALARM);
    expect(shown).toEqual([]);
  });

  it("kategori sesi kapalıysa yerel bildirim sessiz gider; kritik her zaman sesli", async () => {
    const shown: Record<string, unknown>[] = [];
    const { notify } = loadNotify({
      channels: ALL_ON_SYSTEM,
      page: { "sound-energy": "false", "sound-security": "false" },
      desktop: (e) => shown.push(e),
    });
    await notify.deliver({ id: "ev-en", type: "energy", title: "Enerji", detail: "x", ts: Date.now() });
    await notify.deliver(ALARM);
    expect(shown.find((e) => e.id === "ev-en")!.silent).toBe(true);
    expect(shown.find((e) => e.id === "ev-alarm")!.silent).toBe(false);
  });

  it("acil durum türü kendi kategori anahtarına bağlıdır", () => {
    const { notify } = loadNotify({ page: { "notif-emergency": "false" } });
    expect(notify.mutedBy({ id: "e", type: "emergency" })).toBe("category");
    expect(notify.mutedBy({ id: "s", type: "security" })).toBe("");
  });
});

describe("dışa dönük bildirim kanalları", () => {
  it("kanallar kapalıyken hiçbir ağ isteği gitmez", async () => {
    const { notify, calls } = loadNotify({ channels: ALL_OFF });
    const out = await notify.deliver(EVENT);
    expect(calls).toEqual([]);
    expect(out.sent).toEqual([]);
  });

  it("ntfy topic'ine ASCII başlık + tam Türkçe gövdeyle gider", async () => {
    const { notify, calls } = loadNotify({
      channels: { ntfy: { enabled: true, topic: "nexus-evim" } },
    });
    await notify.deliver(EVENT);
    expect(calls[0].url).toBe("https://ntfy.sh/nexus-evim");
    expect(calls[0].headers.Title).toBe("NEXUS Hareket algilandi");
    expect(calls[0].body).toBe("Hareket algılandı\nKoridor · kamera");
  });

  /* HTTP başlıkları ISO-8859-1 taşır. Türkçe bir başlık doğrudan yazıldığında fetch
     isteği atmadan patlıyor ("String contains non ISO-8859-1 code point") ve ntfy kanalı
     hiçbir gerçek olayda çalışmıyordu. Tarayıcıda ölçüldü; burada sabitleniyor. */
  it("başlık yalnızca ASCII kalır (aksanlar sadeleştirilir)", async () => {
    const { notify, calls } = loadNotify({ channels: { ntfy: { enabled: true, topic: "ascii" } } });
    await notify.deliver({
      id: "ev-ascii",
      title: "Güvenlik İhlali — kapı algılandı",
      detail: "Ön kapı · 1. kat",
      ts: Date.now(),
    });
    const title = calls[0].headers.Title;
    expect(title).toBe("NEXUS Guvenlik Ihlali - kapi algilandi");
    expect(title).toMatch(/^[\x20-\x7E]+$/);
    expect(title.length).toBeLessThanOrEqual(100);
    expect(calls[0].body).toContain("Güvenlik İhlali — kapı algılandı");
  });

  it("webhook yalnızca HTTPS'ye gider (düz http sır sızdırır)", async () => {
    const https = loadNotify({
      channels: { webhook: { enabled: true, url: "https://kendi.sunucum/nexus" } },
    });
    await https.notify.deliver({ ...EVENT, id: "ev-https" });
    expect(https.calls[0].url).toBe("https://kendi.sunucum/nexus");
    const body = JSON.parse(https.calls[0].body);
    expect(body).toMatchObject({ source: "NEXUS", id: "ev-https", title: "Hareket algılandı" });

    const http = loadNotify({
      channels: { webhook: { enabled: true, url: "http://kendi.sunucum/nexus" } },
    });
    const out = await http.notify.deliver({ ...EVENT, id: "ev-http" });
    expect(http.calls).toEqual([]);
    expect(out.sent.find((r: { channel: string }) => r.channel === "webhook")).toMatchObject({
      ok: false,
    });
    expect(http.notify.stats().lastError).toContain("https");
  });

  it("telegram anahtarı istek URL'inde durur ama istatistiklerde ifşa edilmez", async () => {
    const { notify, calls } = loadNotify({
      channels: { telegram: { enabled: true, token: "123456:SECRET-token", chat: "42" } },
      responder: () => ({ status: 401 }),
    });
    await notify.deliver(EVENT);
    expect(calls[0].url).toContain("api.telegram.org/bot123456:SECRET-token/sendMessage");
    expect(JSON.parse(calls[0].body)).toMatchObject({ chat_id: "42" });
    const dumped = JSON.stringify(notify.stats());
    expect(dumped).not.toContain("SECRET-token");
  });

  it("aynı olay iki kez dağıtılmaz (çoklu sekme/uygulama sahiplenmesi)", async () => {
    const { notify, calls } = loadNotify({ channels: { ntfy: { enabled: true, topic: "tek" } } });
    const ilk = await notify.deliver(EVENT);
    const ikinci = await notify.deliver(EVENT);
    expect(calls.length).toBe(1);
    expect(ilk.duplicate).toBeUndefined();
    expect(ikinci.duplicate).toBe(true);
  });

  it("rahatsız etmeyin süresi açıkken dışarı hiçbir şey gitmez", async () => {
    const { notify, calls } = loadNotify({
      channels: { ntfy: { enabled: true, topic: "sessiz" } },
      dndUntil: Date.now() + 60 * 60 * 1000,
    });
    const out = await notify.deliver(EVENT);
    expect(calls).toEqual([]);
    expect(out.dnd).toBe(true);
  });

  it("DND süresi dolmuşsa kanallar yeniden çalışır", async () => {
    const { notify, calls } = loadNotify({
      channels: { ntfy: { enabled: true, topic: "yeniden" } },
      dndUntil: Date.now() - 1000,
    });
    await notify.deliver(EVENT);
    expect(calls.length).toBe(1);
  });

  it("ilk kurulumda birikmiş eski olaylar dağıtılmaz, yalnızca sahiplenilir", async () => {
    const eski = [
      { id: "e-1", title: "Dünkü olay", ts: new Date(Date.now() - 86400000).toISOString() },
      { id: "e-2", title: "Bu sabah", ts: new Date(Date.now() - 3600000).toISOString() },
    ];
    const { notify, calls, storage } = loadNotify({
      channels: { ntfy: { enabled: true, topic: "yenikurulum" } },
      events: eski,
    });
    const marked = await notify.checkNew({ markOnly: true });
    expect(marked.marked).toBe(2);
    expect(calls).toEqual([]);
    expect(JSON.parse(storage.getItem(`${"ayse@ornek.com"}_nexusNotifySeen`) || "[]")).toEqual([
      "e-1",
      "e-2",
    ]);
    // Sonradan eklenen taze olay gönderilir.
    const taze = { id: "e-3", title: "Şimdi", detail: "yeni", ts: new Date().toISOString() };
    storage.setItem("ayse@ornek.com_nexusEvents", JSON.stringify([...eski, taze]));
    await notify.checkNew({ ignoreOld: true });
    expect(calls.length).toBe(1);
    expect(calls[0].headers.Title).toBe("NEXUS Simdi");
  });

  it("test bildirimi kurulu kanallara tek seferlik gider", async () => {
    const { notify, calls } = loadNotify({
      channels: { webhook: { enabled: true, url: "https://ornek/x" } },
    });
    await notify.test();
    expect(calls.length).toBe(1);
    expect(JSON.parse(calls[0].body).title).toBe("Test bildirimi");
  });

  it("kanal ayarları buluta taşınmaz (cloud-sync STATE_EXCLUDE)", () => {
    const cloud = readFileSync(join(REPO_ROOT, "src", "app", "cloud-sync.js"), "utf8");
    expect(cloud).toContain("nexusNotifyChannels: 1");
    expect(cloud).toContain("nexusNotifyStats: 1");
  });

  it("bildirim şeridi olmayan sayfada patlamaz (system kanalı yedeği)", async () => {
    const { notify } = loadNotify({ channels: { system: { enabled: true } } });
    const out = await notify.deliver(EVENT);
    expect(out.sent[0]).toMatchObject({ channel: "system", ok: true });
  });

  it("notify.js üç pakete de dağıtılıyor (yapılandırma listeleri)", () => {
    const lists = [
      readFileSync(join(REPO_ROOT, "scripts/sync-www.mjs"), "utf8"),
      readFileSync(join(REPO_ROOT, "desktop/scripts/prepare-app.cjs"), "utf8"),
      readFileSync(join(REPO_ROOT, "src", "app", "theme.js"), "utf8"),
    ];
    lists.forEach((text) => expect(text).toContain("notify.js"));
    if (existsSync(join(REPO_ROOT, "www", "notify.js"))) {
      expect(readFileSync(join(REPO_ROOT, "www", "notify.js"), "utf8")).toBe(NOTIFY);
    }
  });
});

/* Otomasyon motoru ve sahne sayfası olayları ts: Date.now() ile SAYI olarak yazıyor.
   Date.parse(sayı) geçersiz tarih döndürdüğünde taze filtre hiçbir olayı geçmiyordu;
   yani kurulduktan sonra hiçbir bildirim hiç gitmezdi. Bu blok o gerçeği sabitler. */
describe("gerçek olay kayıtlarıyla dağıtım", () => {
  const NUMBER_TS = {
    id: "auto-1764000000000",
    type: "automation",
    title: "Sensör",
    detail: "Koridor",
    ts: Date.now(),
  };

  it("ts sayı olan olay kanala ulaşır", async () => {
    const { notify, calls } = loadNotify({
      channels: { ntfy: { enabled: true, topic: "sayi-ts" } },
      events: [NUMBER_TS],
    });
    await notify.checkNew();
    expect(calls.length).toBe(1);
    expect(calls[0].headers.Title).toBe("NEXUS Sensor");
  });

  it("webhook gövdesindeki ts her zaman ISO (sayı değil)", async () => {
    const { notify, calls } = loadNotify({
      channels: { webhook: { enabled: true, url: "https://ornek/hook" } },
    });
    await notify.deliver(NUMBER_TS);
    const body = JSON.parse(calls[0].body);
    expect(body.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(new Date(body.ts).getTime()).toBeGreaterThan(Date.now() - 60000);
  });

  it("uygulama kapalıyken biriken olaylar da birer kez dağıtılır", async () => {
    const eski = [
      { id: "b-1", type: "scene", title: "Bir", ts: Date.now() - 3600_000 },
      { id: "b-2", type: "scene", title: "Iki", ts: Date.now() - 1800_000 },
    ];
    const { notify, calls } = loadNotify({
      channels: { ntfy: { enabled: true, topic: "birikmis" } },
      events: eski,
    });
    await notify.checkNew();
    await notify.checkNew(); // ikinci yoklama tekrar göndermez
    expect(calls.length).toBe(2);
  });
});

/* Ayarlar → Anlık Bildirimler sayfasındaki anahtarlar eskiden hiçbir yere okunmuyordu:
   "Bildirimlere İzin Ver" kapalıyken bile Telegram'a haber gidiyordu. Artık geçiyor. */
describe("bildirim ayarları dağıtımı keser", () => {
  const NTTF = { ntfy: { enabled: true, topic: "ayar" } };
  const SCENE = {
    id: "s-1",
    type: "scene",
    title: "Sahne",
    detail: "Çalıştırıldı",
    ts: Date.now(),
  };
  const ENERGY = { id: "e-9", type: "energy", title: "Enerji", detail: "Rapor", ts: Date.now() };

  function clock(offsetMinutes: number) {
    const d = new Date(Date.now() + offsetMinutes * 60000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  it("master kapalıyken hiçbir kanal tetiklenmez", async () => {
    const { notify, calls } = loadNotify({ channels: NTTF, page: { master: "false" } });
    const out = await notify.deliver(SCENE);
    expect(calls).toEqual([]);
    expect(out.suppressed).toBe("master");
  });

  it("varsayılan açık: anahtar hiç yazılmamışsa gönderilir", async () => {
    const { notify, calls } = loadNotify({ channels: NTTF });
    await notify.deliver({ ...SCENE, id: "s-default" });
    expect(calls.length).toBe(1);
  });

  it("kategori anahtarı yalnız kendi türünü susturur", async () => {
    const { notify, calls } = loadNotify({ channels: NTTF, page: { "notif-energy": "false" } });
    const energy = await notify.deliver(ENERGY);
    const scene = await notify.deliver({ ...SCENE, id: "s-2" });
    expect(energy.suppressed).toBe("category");
    expect(scene.suppressed).toBeUndefined();
    expect(calls.length).toBe(1);
  });

  it("sessiz saatler aralığında (gece yarısını aşan dahil) gönderilmez", async () => {
    const { notify, calls } = loadNotify({
      channels: NTTF,
      page: { quietEnabled: "true", quietStart: clock(-30), quietEnd: clock(30) },
    });
    const out = await notify.deliver({ ...SCENE, id: "s-quiet" });
    expect(out.suppressed).toBe("quiet-hours");
    expect(calls).toEqual([]);
  });

  it("aralık dışındayken sessiz saatler engellemez", async () => {
    const { notify, calls } = loadNotify({
      channels: NTTF,
      page: { quietEnabled: "true", quietStart: clock(120), quietEnd: clock(180) },
    });
    expect(notify.quietHoursActive()).toBe(false);
    await notify.deliver({ ...SCENE, id: "s-disi" });
    expect(calls.length).toBe(1);
  });

  it("kritik işaretli olay sessiz saati aşar (sayfanın sözü)", async () => {
    const { notify, calls } = loadNotify({
      channels: NTTF,
      page: { quietEnabled: "true", quietStart: clock(-30), quietEnd: clock(30) },
    });
    await notify.deliver({ ...SCENE, id: "s-crit", level: "critical" });
    expect(calls.length).toBe(1);
  });

  it("test bildirimi ayar anahtarlarına bakmaz (kullanıcı komutu)", async () => {
    const { notify, calls } = loadNotify({ channels: NTTF, page: { master: "false" } });
    const out = await notify.test();
    expect(calls.length).toBe(1);
    expect(out.sent.find((r: { channel: string }) => r.channel === "ntfy")).toMatchObject({
      ok: true,
    });
  });
});

/* İzin düğmesinin asıl hatası: Chromium bir kaynağa yalnızca KEZ sorar ve masaüstü
   programda Electron istemciyi otomatik onaylar (desktop/main.cjs notifications:1).
   Bu ortamlarda requestPermission() pencere açmadan eski kararı döndürür; arayüz
   "sordum ve verildi" yazınca kullanıcı olmayan bir soruyu sorulmuş sanıyor.
   Sözleşme artık {permission, asked}: "asked" yalnızca GERÇEKTEN sorulduysa true. */
describe("sistem izni — sorulmayan şey 'soruldu' yazılmaz", () => {
  function fakeNotification(permission: string, resolves = "granted") {
    const fake = {
      permission,
      calls: 0,
      requestPermission() {
        fake.calls++;
        return Promise.resolve(resolves);
      },
    };
    (globalThis as Record<string, unknown>).Notification = fake;
    return fake;
  }

  it("izin zaten verilmişse yeniden sorulmaz, asked:false döner", async () => {
    const { notify } = loadNotify({ channels: ALL_OFF });
    const fake = fakeNotification("granted");
    try {
      expect(await notify.requestSystemPermission()).toEqual({
        permission: "granted",
        asked: false,
      });
      expect(fake.calls, "zaten bilinen izin için requestPermission çağrılmamalı").toBe(0);
    } finally {
      delete (globalThis as Record<string, unknown>).Notification;
    }
  });

  it("izin daha önce reddedildiyse o da 'biliniyor'dur, pencere açılmaz", async () => {
    const { notify } = loadNotify({ channels: ALL_OFF });
    const fake = fakeNotification("denied");
    try {
      expect(await notify.requestSystemPermission()).toEqual({
        permission: "denied",
        asked: false,
      });
      expect(fake.calls).toBe(0);
    } finally {
      delete (globalThis as Record<string, unknown>).Notification;
    }
  });

  it("karar hiç verilmediyse TEK KEZ ve senkron sorulur (kullanıcı jesti)", async () => {
    const { notify } = loadNotify({ channels: ALL_OFF });
    const fake = fakeNotification("default");
    try {
      const pending = notify.requestSystemPermission();
      // Jest penceresi, çağrı bir makro göreve ertelenirse açılmaz: sayacın
      // await'den ÖNCE artmış olması sözleşmenin parçası.
      expect(fake.calls, "requestPermission await'den önce çağrılmalı").toBe(1);
      expect(await pending).toEqual({ permission: "granted", asked: true });
    } finally {
      delete (globalThis as Record<string, unknown>).Notification;
    }
  });

  it("bildirim API'si olmayan ortamda uydurma 'granted' dönmez", async () => {
    const { notify } = loadNotify({ channels: ALL_OFF });
    expect(await notify.requestSystemPermission()).toEqual({
      permission: "unsupported",
      asked: false,
    });
  });
});

describe("kanal yüzeyi daraltıldı (yalnız Telegram + sistem)", () => {
  it("test(['system']) tek kanala iner, filtresiz test hepsine gider", async () => {
    const { notify, calls } = loadNotify({
      channels: {
        ntfy: { enabled: true, topic: "eski" },
        telegram: { enabled: true, token: "1:abc", chat: "9" },
      },
    });
    const solo = await notify.test(["system"]);
    expect(calls.length, "sistem tek kanallık denemede ağa çıkmamalı").toBe(0);
    expect(solo.sent.map((r: { channel: string }) => r.channel)).toEqual(["system"]);
    await notify.test();
    expect(calls.length).toBe(2); // ntfy + telegram
  });

  it("ekranda tüm kanallar anahtar ve alanlarıyla görünür (ntfy/webhook yüzeye döndü)", () => {
    const screen = readFileSync(
      join(REPO_ROOT, "src", "app", "nexus-instant-notifications.html"),
      "utf8",
    );
    // Motorun tanıdığı her kanalın arayüzü olmalı: anahtarı olmayan kanal
    // susturulamayan gönderimdir. ntfy/webhook gizliyken bu bekçi onları
    // arayüzden YOK sayıyordu; kanallar yüzeye döndüğünde bekçi tersine döndü.
    expect(screen).toMatch(/data-channel="ntfy"/);
    expect(screen).toMatch(/data-channel="webhook"/);
    expect(screen).toMatch(/data-field="ntfy\.topic"/);
    expect(screen).toMatch(/data-field="webhook\.url"/);
    expect(screen).toMatch(/data-channel="email"/);
    // Gizli kanal mekanizması boş listeyle hazır dursun: ileride arayüzsüz
    // kanal eklenirse sayfa onu yüklenirken kapayabilsin.
    expect(screen).toMatch(/HIDDEN_CHANNELS\s*=\s*\[\s*\]/);
    expect(screen).toMatch(/disableHiddenChannels\(\)/);
    const { notify } = loadNotify({ channels: { ntfy: { enabled: true, topic: "eski" } } });
    expect(Object.keys(notify.channels())).toContain("ntfy");
  });

  it("durum satırı kanal anahtarını ham yazmaz (Türkçe arayüzde 'system' kalıntısı)", () => {
    const screen = readFileSync(
      join(REPO_ROOT, "src", "app", "nexus-instant-notifications.html"),
      "utf8",
    );
    expect(screen, "'Açık kanal: ' + on.join(', ') ham anahtar basıyordu").not.toMatch(
      /on\.join\(/,
    );
    expect(screen).toMatch(/CHANNEL_NAMES/);
    expect(screen).toMatch(/on\.map\(channelName\)/);
    const dict = readFileSync(join(REPO_ROOT, "src", "app", "lang-en.js"), "utf8");
    ["İzin verildi", "İzin zaten açık", "İzin reddedilmiş", "İzin bekleniyor…"].forEach((s) =>
      expect(dict, `lang-en.js'te "${s}" anahtarı olmalı`).toContain(`"${s}"`),
    );
  });
});
