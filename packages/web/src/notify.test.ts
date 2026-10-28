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
